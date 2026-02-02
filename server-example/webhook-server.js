// Simple Express.js server for handling Cryptomus webhooks
// This is a production-ready webhook handler for your Seltech marketplace

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.raw({ type: 'application/json' }));

// Cryptomus configuration
const CRYPTOMUS_CONFIG = {
  MERCHANT_UUID: '6e6c1018-48f4-49fd-a10d-36d6cd70eefe',
  PAYMENT_API_KEY: 'DSk5vMk3RIBhiQ3qGUw1pH1iYJI1hSSN8iTYmHpm3WpyTj9bsTtIlhadpiFKlK5aVUmpjHH8YoLV9dQsxLAPzpQOdiffl2hzJo0378ExFJB3HMSx49LjTfvnm9qHztoP',
  PAYOUT_API_KEY: '2nuhleS45ns1WTJDX1ZoRG8UAmDFDdahvMafGhU5knS5P3Ozn1Yx0tgRYCmjJpKvtNx0GVQ0FTLo0SNVw1ZM7Zy97fXSsbHX8SGbgGepEHCqwtxw3gIJ8LKDIMDJ3W4s',
  WEBHOOK_SECRET: process.env.CRYPTOMUS_WEBHOOK_SECRET || 'seltech_webhook_secret_2024',
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY
};

// Supabase client (server-side)
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(CRYPTOMUS_CONFIG.SUPABASE_URL, CRYPTOMUS_CONFIG.SUPABASE_SERVICE_KEY);

// Verify webhook signature
function verifyWebhookSignature(payload, signature) {
  const expectedSignature = crypto
    .createHash('md5')
    .update(payload + CRYPTOMUS_CONFIG.WEBHOOK_SECRET)
    .digest('hex');
  
  return signature === expectedSignature;
}

// Calculate revenue split
function calculateRevenueSplit(totalAmount) {
  const platformFee = totalAmount * 0.1; // 10% platform fee
  const sellerEarnings = totalAmount * 0.9; // 90% to seller
  
  return {
    totalAmount,
    platformFee: Math.round(platformFee * 100) / 100,
    sellerEarnings: Math.round(sellerEarnings * 100) / 100,
  };
}

// Create Cryptomus payout
async function createCryptomusPayout(payoutData) {
  const data = {
    ...payoutData,
    merchant: CRYPTOMUS_CONFIG.MERCHANT_UUID,
  };

  const jsonString = JSON.stringify(data);
  const base64Data = Buffer.from(jsonString).toString('base64');
  const signature = crypto.createHash('md5').update(base64Data + CRYPTOMUS_CONFIG.PAYOUT_API_KEY).digest('hex');

  const response = await fetch('https://api.cryptomus.com/v1/payout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'merchant': CRYPTOMUS_CONFIG.MERCHANT_UUID,
      'sign': signature,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Cryptomus API error: ${response.statusText}`);
  }

  return response.json();
}

// Generate secure download URL
async function generateDownloadUrl(productId) {
  try {
    const { data: product, error } = await supabase
      .from('products')
      .select('file_url')
      .eq('id', productId)
      .single();

    if (error || !product?.file_url) {
      throw new Error('Product file not found');
    }

    const { data: signedUrl, error: signError } = await supabase.storage
      .from('product-files')
      .createSignedUrl(product.file_url, 7 * 24 * 60 * 60); // 7 days

    if (signError || !signedUrl) {
      throw new Error('Failed to generate download URL');
    }

    return signedUrl.signedUrl;
  } catch (error) {
    console.error('Download URL generation error:', error);
    return '';
  }
}

// Process seller payout
async function processSellerpayout(orderId) {
  try {
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        seller:profiles!seller_id(*),
        product:products(*)
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order || !order.seller) {
      console.error('Failed to get order details for payout:', orderError);
      return;
    }

    const seller = order.seller;

    if (!seller.wallet_address) {
      console.error('Seller does not have a wallet address configured');
      return;
    }

    // Create payout record
    const { data: payout, error: payoutError } = await supabase
      .from('payouts')
      .insert({
        seller_id: seller.user_id,
        amount: order.seller_earnings,
        wallet_address: seller.wallet_address,
        status: 'pending',
      })
      .select()
      .single();

    if (payoutError || !payout) {
      console.error('Failed to create payout record:', payoutError);
      return;
    }

    // Create Cryptomus payout
    const payoutData = {
      amount: order.seller_earnings.toString(),
      currency: order.crypto_currency || 'USDT',
      network: 'TRC20',
      address: seller.wallet_address,
      order_id: payout.id,
      url_callback: `https://seltech.online/api/webhooks/cryptomus-payout`,
    };

    const payoutResponse = await createCryptomusPayout(payoutData);

    if (payoutResponse.state === 0) {
      await supabase
        .from('payouts')
        .update({
          status: 'processing',
          transaction_hash: payoutResponse.result.txid,
          processed_at: new Date().toISOString(),
        })
        .eq('id', payout.id);

      await supabase
        .from('profiles')
        .update({
          total_earnings: (seller.total_earnings || 0) + order.seller_earnings,
          total_sales: (seller.total_sales || 0) + 1,
        })
        .eq('user_id', seller.user_id);

      console.log(`✅ Payout initiated for seller ${seller.user_id}: $${order.seller_earnings}`);
    } else {
      await supabase
        .from('payouts')
        .update({ status: 'failed' })
        .eq('id', payout.id);

      console.error('❌ Failed to create Cryptomus payout:', payoutResponse);
    }

  } catch (error) {
    console.error('Seller payout error:', error);
  }
}

// Cryptomus payment webhook handler
app.post('/api/webhooks/cryptomus', async (req, res) => {
  try {
    const signature = req.headers['sign'] || req.headers['x-sign'];
    const payload = JSON.stringify(req.body);

    console.log('📨 Received Cryptomus webhook:', req.body);

    // Verify signature
    if (!verifyWebhookSignature(payload, signature)) {
      console.error('❌ Invalid webhook signature');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const webhookData = req.body;

    // Find the order by payment ID
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        product:products(*),
        buyer:profiles!buyer_id(*),
        seller:profiles!seller_id(*)
      `)
      .eq('payment_id', webhookData.uuid)
      .single();

    if (orderError || !order) {
      console.error('❌ Order not found for payment:', webhookData.uuid);
      return res.status(404).json({ error: 'Order not found' });
    }

    // Map Cryptomus status to our order status
    let orderStatus;
    switch (webhookData.status) {
      case 'paid':
      case 'paid_over':
        orderStatus = 'paid';
        break;
      case 'fail':
      case 'cancel':
      case 'system_fail':
        orderStatus = 'failed';
        break;
      default:
        orderStatus = 'pending';
    }

    console.log(`📊 Order ${order.id} status: ${order.status} → ${orderStatus}`);

    // Update order status
    const updateData = { 
      status: orderStatus,
      crypto_amount: parseFloat(webhookData.amount || '0'),
    };

    if (orderStatus === 'paid') {
      updateData.completed_at = new Date().toISOString();
      updateData.download_url = await generateDownloadUrl(order.product_id);
      updateData.download_expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', order.id);

    if (updateError) {
      console.error('❌ Failed to update order:', updateError);
      return res.status(500).json({ error: 'Failed to update order' });
    }

    // Process seller payout for completed payments
    if (orderStatus === 'paid' && order.status !== 'paid') {
      console.log('💰 Processing seller payout...');
      await processSellerpayout(order.id);

      // Update product download count
      await supabase
        .from('products')
        .update({ 
          download_count: (order.product?.download_count || 0) + 1 
        })
        .eq('id', order.product_id);

      console.log('✅ Payment processed successfully');
    }

    res.status(200).json({ status: 'ok' });

  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Cryptomus payout webhook handler
app.post('/api/webhooks/cryptomus-payout', async (req, res) => {
  try {
    const signature = req.headers['sign'] || req.headers['x-sign'];
    const payload = JSON.stringify(req.body);

    console.log('📨 Received Cryptomus payout webhook:', req.body);

    // Verify signature
    if (!verifyWebhookSignature(payload, signature)) {
      console.error('❌ Invalid payout webhook signature');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const webhookData = req.body;

    // Find the payout by order_id (which is our payout ID)
    const { data: payout, error: payoutError } = await supabase
      .from('payouts')
      .select('*')
      .eq('id', webhookData.order_id)
      .single();

    if (payoutError || !payout) {
      console.error('❌ Payout not found:', webhookData.order_id);
      return res.status(404).json({ error: 'Payout not found' });
    }

    // Map Cryptomus payout status
    let payoutStatus;
    switch (webhookData.status) {
      case 'paid':
      case 'paid_over':
        payoutStatus = 'completed';
        break;
      case 'fail':
      case 'cancel':
      case 'system_fail':
        payoutStatus = 'failed';
        break;
      default:
        payoutStatus = 'processing';
    }

    console.log(`💰 Payout ${payout.id} status: ${payout.status} → ${payoutStatus}`);

    // Update payout status
    const updateData = { 
      status: payoutStatus,
      transaction_hash: webhookData.txid,
    };

    if (payoutStatus === 'completed') {
      updateData.processed_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from('payouts')
      .update(updateData)
      .eq('id', payout.id);

    if (updateError) {
      console.error('❌ Failed to update payout:', updateError);
      return res.status(500).json({ error: 'Failed to update payout' });
    }

    console.log('✅ Payout webhook processed successfully');
    res.status(200).json({ status: 'ok' });

  } catch (error) {
    console.error('❌ Payout webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'Seltech Cryptomus Webhook Handler'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Webhook server running on port ${PORT}`);
  console.log(`📡 Webhook endpoints:`);
  console.log(`   - Payment: POST /api/webhooks/cryptomus`);
  console.log(`   - Payout:  POST /api/webhooks/cryptomus-payout`);
  console.log(`   - Health:  GET /health`);
});

module.exports = app;