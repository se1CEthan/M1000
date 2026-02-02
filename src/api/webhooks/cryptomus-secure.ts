/**
 * Secure Cryptomus Webhook Handler
 * Handles payment confirmations with signature verification
 */

import { verifyWebhookSignature, type WebhookPayload, getPaymentStatusDisplay } from '@/lib/cryptomus-core';
import { supabase } from '@/integrations/supabase/clients';

/**
 * POST /api/webhooks/cryptomus-secure
 * Handles Cryptomus payment webhooks with full security verification
 */
export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    // Get raw body and signature
    const rawBody = await req.text();
    const signature = req.headers.get('sign') || '';

    // Verify webhook signature for security
    if (!verifyWebhookSignature(rawBody, signature)) {
      console.error('Invalid webhook signature');
      return new Response('Invalid signature', { status: 401 });
    }

    // Parse webhook payload
    const payload: WebhookPayload = JSON.parse(rawBody);
    
    console.log('Cryptomus webhook received:', {
      uuid: payload.uuid,
      order_id: payload.order_id,
      status: payload.payment_status,
      amount: payload.amount,
      payer_amount: payload.payer_amount,
      currency: payload.payer_currency,
      txid: payload.txid
    });

    // Find order in database
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        product:products(*),
        seller:profiles!seller_id(*)
      `)
      .eq('id', payload.order_id)
      .single();

    if (orderError || !order) {
      console.error('Order not found for webhook:', payload.order_id);
      return new Response('Order not found', { status: 404 });
    }

    // Verify payment ID matches
    if (order.payment_id !== payload.uuid) {
      console.error('Payment ID mismatch:', {
        expected: order.payment_id,
        received: payload.uuid
      });
      return new Response('Payment ID mismatch', { status: 400 });
    }

    // Get payment status info
    const statusInfo = getPaymentStatusDisplay(payload.payment_status);
    
    // Prepare order update data
    const updateData: any = {
      crypto_amount: parseFloat(payload.payer_amount || '0'),
      payment_address: payload.address,
      payment_network: payload.network,
      transaction_hash: payload.txid || null,
      updated_at: new Date().toISOString()
    };

    // Handle different payment statuses
    switch (payload.payment_status) {
      case 'paid':
      case 'paid_over':
        await handleSuccessfulPayment(order, payload, updateData);
        break;
        
      case 'fail':
      case 'cancel':
      case 'system_fail':
        updateData.status = 'failed';
        await supabase.from('orders').update(updateData).eq('id', order.id);
        console.log(`Payment failed for order ${order.id}`);
        break;
        
      case 'process':
      case 'confirm_check':
        updateData.status = 'pending';
        await supabase.from('orders').update(updateData).eq('id', order.id);
        console.log(`Payment processing for order ${order.id}`);
        break;
        
      default:
        console.log(`Unknown payment status: ${payload.payment_status}`);
        break;
    }

    // Log webhook processing
    await logWebhookEvent(payload, order.id, statusInfo.status);

    return new Response('OK', { status: 200 });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

/**
 * Handle successful payment completion
 */
async function handleSuccessfulPayment(
  order: any, 
  payload: WebhookPayload, 
  updateData: any
): Promise<void> {
  try {
    // Only process if not already paid
    if (order.status === 'paid') {
      console.log(`Order ${order.id} already marked as paid`);
      return;
    }

    updateData.status = 'paid';
    updateData.completed_at = new Date().toISOString();

    // Generate download URL
    if (!order.download_url) {
      updateData.download_url = await generateSecureDownloadUrl(order.product_id);
      updateData.download_expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    }

    // Update order
    await supabase.from('orders').update(updateData).eq('id', order.id);

    // Process seller payout
    await processSellerPayout(order, payload);

    // Update seller statistics
    await updateSellerStats(order.seller_id, order.seller_earnings);

    // Update product statistics
    await updateProductStats(order.product_id);

    // Send notifications (implement as needed)
    await sendPaymentNotifications(order, payload);

    console.log(`Payment completed successfully for order ${order.id}`);

  } catch (error) {
    console.error('Error handling successful payment:', error);
    throw error;
  }
}

/**
 * Generate secure download URL with expiration
 */
async function generateSecureDownloadUrl(productId: string): Promise<string> {
  try {
    const { data: product, error } = await supabase
      .from('products')
      .select('file_url')
      .eq('id', productId)
      .single();

    if (error || !product?.file_url) {
      throw new Error('Product file not found');
    }

    // Generate signed URL that expires in 7 days
    const { data: signedUrl, error: signError } = await supabase.storage
      .from('product-files')
      .createSignedUrl(product.file_url, 7 * 24 * 60 * 60);

    if (signError || !signedUrl) {
      throw new Error('Failed to generate download URL');
    }

    return signedUrl.signedUrl;
  } catch (error) {
    console.error('Download URL generation error:', error);
    return '';
  }
}

/**
 * Process seller payout (90% of sale)
 */
async function processSellerPayout(order: any, payload: WebhookPayload): Promise<void> {
  try {
    // Create payout record
    const { data: payout, error: payoutError } = await supabase
      .from('payouts')
      .insert({
        seller_id: order.seller_id,
        order_id: order.id,
        amount: order.seller_earnings,
        currency: payload.payer_currency,
        wallet_address: order.seller?.wallet_address || null,
        status: 'pending',
        payment_hash: payload.txid,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (payoutError) {
      console.error('Failed to create payout record:', payoutError);
      return;
    }

    console.log(`Payout record created for seller ${order.seller_id}: $${order.seller_earnings}`);

    // If seller has wallet configured, you can trigger automatic payout here
    // For security, you might want to process payouts manually or in batches

  } catch (error) {
    console.error('Seller payout processing error:', error);
  }
}

/**
 * Update seller statistics
 */
async function updateSellerStats(sellerId: string, earnings: number): Promise<void> {
  try {
    // Get current seller stats
    const { data: seller, error } = await supabase
      .from('profiles')
      .select('total_earnings, total_sales')
      .eq('user_id', sellerId)
      .single();

    if (error || !seller) {
      console.error('Failed to get seller stats:', error);
      return;
    }

    // Update seller statistics
    await supabase
      .from('profiles')
      .update({
        total_earnings: (seller.total_earnings || 0) + earnings,
        total_sales: (seller.total_sales || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', sellerId);

  } catch (error) {
    console.error('Error updating seller stats:', error);
  }
}

/**
 * Update product statistics
 */
async function updateProductStats(productId: string): Promise<void> {
  try {
    // Increment download count
    await supabase
      .from('products')
      .update({
        download_count: supabase.sql`download_count + 1`,
        updated_at: new Date().toISOString()
      })
      .eq('id', productId);

  } catch (error) {
    console.error('Error updating product stats:', error);
  }
}

/**
 * Send payment notifications
 */
async function sendPaymentNotifications(order: any, payload: WebhookPayload): Promise<void> {
  try {
    // Create notification records
    const notifications = [
      // Buyer notification
      {
        user_id: order.buyer_id,
        type: 'payment_success',
        title: 'Payment Successful',
        message: `Your payment for "${order.product?.title}" has been confirmed. You can now download your product.`,
        data: {
          order_id: order.id,
          product_id: order.product_id,
          amount: payload.amount,
          currency: payload.payer_currency,
          txid: payload.txid
        }
      },
      // Seller notification
      {
        user_id: order.seller_id,
        type: 'sale_completed',
        title: 'New Sale',
        message: `You made a sale! "${order.product?.title}" was purchased for $${order.seller_earnings}.`,
        data: {
          order_id: order.id,
          product_id: order.product_id,
          earnings: order.seller_earnings,
          buyer_id: order.buyer_id
        }
      }
    ];

    await supabase.from('notifications').insert(notifications);

    console.log('Payment notifications sent');

  } catch (error) {
    console.error('Error sending notifications:', error);
  }
}

/**
 * Log webhook event for audit trail
 */
async function logWebhookEvent(
  payload: WebhookPayload, 
  orderId: string, 
  processedStatus: string
): Promise<void> {
  try {
    await supabase.from('webhook_logs').insert({
      webhook_type: 'cryptomus_payment',
      order_id: orderId,
      payment_id: payload.uuid,
      status: payload.payment_status,
      processed_status: processedStatus,
      payload: payload,
      processed_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error logging webhook event:', error);
  }
}