// Production Cryptomus Webhook Handler for seltech.online
// Handles payment confirmations and automatic seller payouts

import { supabase } from '@/integrations/supabase/clients';
import { createPayout } from '@/lib/cryptomus';
import crypto from 'crypto';

// Cryptomus configuration
const CRYPTOMUS_CONFIG = {
  MERCHANT_UUID: '6e6c1018-48f4-49fd-a10d-36d6cd70eefe',
  WEBHOOK_SECRET: 'seltech_webhook_secret_2024',
  PAYMENT_API_KEY: 'DSk5vMk3RIBhiQ3qGUw1pH1iYJI1hSSN8iTYmHpm3WpyTj9bsTtIlhadpiFKlK5aVUmpjHH8YoLV9dQsxLAPzpQOdiffl2hzJo0378ExFJB3HMSx49LjTfvnm9qHztoP',
  PAYOUT_API_KEY: '2nuhleS45ns1WTJDX1ZoRG8UAmDFDdahvMafGhU5knS5P3Ozn1Yx0tgRYCmjJpKvtNx0GVQ0FTLo0SNVw1ZM7Zy97fXSsbHX8SGbgGepEHCqwtxw3gIJ8LKDIMDJ3W4s'
};

// Verify webhook signature
function verifyWebhookSignature(payload: string, signature: string): boolean {
  const expectedSignature = crypto
    .createHash('md5')
    .update(payload + CRYPTOMUS_CONFIG.WEBHOOK_SECRET)
    .digest('hex');
  
  return signature === expectedSignature;
}

// Generate secure download URL
async function generateDownloadUrl(productId: string): Promise<string> {
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
async function processSellerpayout(orderId: string): Promise<void> {
  try {
    console.log(`💰 Processing seller payout for order: ${orderId}`);

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
      
      // Create notification for seller to configure wallet
      await supabase
        .from('notifications')
        .insert({
          user_id: seller.user_id,
          type: 'configure_wallet',
          title: 'Configure Wallet Address 💳',
          message: `You have pending earnings of ${order.seller_earnings}! Please configure your wallet address to receive automatic payouts.`,
          data: { 
            amount: order.seller_earnings,
            order_id: orderId,
            action: 'configure_wallet'
          },
        });
      
      return;
    }

    // Create payout record
    const { data: payout, error: payoutError } = await supabase
      .from('payouts')
      .insert({
        seller_id: seller.user_id,
        amount: order.seller_earnings,
        currency: order.crypto_currency || 'USDT',
        method_type: 'crypto',
        method_address: seller.wallet_address,
        status: 'processing',
        order_id: orderId,
        description: `Sale payout for: ${order.product?.title || 'Digital Product'}`,
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

    try {
      const payoutResponse = await createPayout(payoutData);

      if (payoutResponse.state === 0) {
        // Update payout record with success
        await supabase
          .from('payouts')
          .update({
            status: 'completed',
            transaction_id: payoutResponse.result.uuid,
            processed_at: new Date().toISOString(),
          })
          .eq('id', payout.id);

        // Update seller stats
        await supabase
          .from('profiles')
          .update({
            total_earnings: (seller.total_earnings || 0) + order.seller_earnings,
            total_sales: (seller.total_sales || 0) + 1,
          })
          .eq('user_id', seller.user_id);

        // Create success notification
        await supabase
          .from('notifications')
          .insert({
            user_id: seller.user_id,
            type: 'payout_success',
            title: 'Payout Processed Successfully! 💰',
            message: `Your payout of ${order.seller_earnings} ${order.crypto_currency || 'USDT'} has been processed and will arrive in 10-30 minutes.`,
            data: {
              amount: order.seller_earnings,
              currency: order.crypto_currency || 'USDT',
              transactionId: payoutResponse.result.uuid,
              estimatedArrival: '10-30 minutes',
            },
          });

        console.log(`✅ Payout initiated for seller ${seller.user_id}: ${order.seller_earnings} ${order.crypto_currency || 'USDT'}`);
      } else {
        // Update payout record with failure
        await supabase
          .from('payouts')
          .update({ 
            status: 'failed',
            error_message: 'Cryptomus payout failed'
          })
          .eq('id', payout.id);

        // Create failure notification
        await supabase
          .from('notifications')
          .insert({
            user_id: seller.user_id,
            type: 'payout_failed',
            title: 'Payout Failed ⚠️',
            message: `Your payout could not be processed. Please check your wallet address and try again.`,
            data: { 
              amount: order.seller_earnings,
              error: 'Cryptomus payout failed'
            },
          });

        console.error('❌ Failed to create Cryptomus payout:', payoutResponse);
      }
    } catch (payoutError) {
      console.error('Payout API error:', payoutError);
      
      // Update payout record with error
      await supabase
        .from('payouts')
        .update({ 
          status: 'failed',
          error_message: payoutError instanceof Error ? payoutError.message : 'Unknown error'
        })
        .eq('id', payout.id);
    }

  } catch (error) {
    console.error('Seller payout error:', error);
  }
}

// Main webhook handler
export async function POST(request: Request) {
  try {
    const signature = request.headers.get('sign') || request.headers.get('x-sign');
    const body = await request.text();
    const webhookData = JSON.parse(body);

    console.log('📨 Received Cryptomus webhook:', webhookData);

    // Verify signature
    if (!signature || !verifyWebhookSignature(body, signature)) {
      console.error('❌ Invalid webhook signature');
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Find the order by order ID (from widget) or payment ID (from API)
    let order, orderError;
    
    // First try to find by order_id (for widget payments)
    if (webhookData.order_id) {
      const result = await supabase
        .from('orders')
        .select(`
          *,
          product:products(*),
          buyer:profiles!buyer_id(*),
          seller:profiles!seller_id(*)
        `)
        .eq('id', webhookData.order_id)
        .single();
      
      order = result.data;
      orderError = result.error;
    }
    
    // If not found, try by payment_id (for API payments)
    if (!order && webhookData.uuid) {
      const result = await supabase
        .from('orders')
        .select(`
          *,
          product:products(*),
          buyer:profiles!buyer_id(*),
          seller:profiles!seller_id(*)
        `)
        .eq('payment_id', webhookData.uuid)
        .single();
      
      order = result.data;
      orderError = result.error;
    }

    if (orderError || !order) {
      console.error('❌ Order not found for payment:', {
        order_id: webhookData.order_id,
        payment_uuid: webhookData.uuid
      });
      return new Response(JSON.stringify({ error: 'Order not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Map Cryptomus status to our order status
    let orderStatus: string;
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
    const updateData: any = { 
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
      return new Response(JSON.stringify({ error: 'Failed to update order' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
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

      // Create buyer notification
      await supabase
        .from('notifications')
        .insert({
          user_id: order.buyer_id,
          type: 'purchase_complete',
          title: 'Purchase Complete! 🎉',
          message: `Your purchase of "${order.product?.title}" is ready for download. The download link expires in 7 days.`,
          data: {
            product_title: order.product?.title,
            download_url: updateData.download_url,
            expires_at: updateData.download_expires_at,
          },
        });

      console.log('✅ Payment processed successfully');
    }

    return new Response(JSON.stringify({ status: 'ok' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Webhook error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Handle GET requests (for webhook verification)
export async function GET() {
  return new Response(JSON.stringify({ 
    status: 'ok',
    service: 'Seltech Cryptomus Payment Webhook',
    merchant: CRYPTOMUS_CONFIG.MERCHANT_UUID,
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}