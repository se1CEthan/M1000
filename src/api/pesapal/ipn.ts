/**
 * PesaPal IPN (Instant Payment Notification) Handler
 * Handles webhook notifications from PesaPal for payment status updates
 * Processes 90/10 revenue split automatically
 */

import { supabase } from '@/integrations/supabase/clients';

export async function handlePesaPalIPN(request: Request): Promise<Response> {
  console.log('🔔 PesaPal IPN received');

  try {
    // Parse the IPN data
    const url = new URL(request.url);
    const orderTrackingId = url.searchParams.get('OrderTrackingId');
    const orderMerchantReference = url.searchParams.get('OrderMerchantReference');
    const orderNotificationType = url.searchParams.get('OrderNotificationType');

    console.log('📋 IPN Data:', {
      orderTrackingId,
      orderMerchantReference,
      orderNotificationType
    });

    if (!orderTrackingId) {
      console.error('❌ No OrderTrackingId in IPN');
      return new Response('Missing OrderTrackingId', { status: 400 });
    }

    // Find the order by tracking ID
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('pesapal_tracking_id', orderTrackingId)
      .single();

    if (orderError || !order) {
      console.error('❌ Order not found:', orderTrackingId);
      return new Response('Order not found', { status: 404 });
    }

    console.log('📦 Found order:', order.id);

    // Get payment status from PesaPal
    const paymentStatus = await checkPesaPalPaymentStatus(orderTrackingId);
    
    if (paymentStatus.isPaid) {
      console.log('✅ Payment confirmed for order:', order.id);

      // Update order status to paid
      await supabase
        .from('orders')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          payment_status: 'COMPLETED'
        })
        .eq('id', order.id);

      // Process 90/10 split
      await process90_10Split(order);

      // Send notifications
      await sendPaymentNotifications(order);

      console.log('🎉 Payment processing completed for order:', order.id);

    } else if (paymentStatus.status === 'FAILED' || paymentStatus.status === 'CANCELLED') {
      console.log('❌ Payment failed/cancelled for order:', order.id);

      // Update order status
      await supabase
        .from('orders')
        .update({
          status: 'failed',
          payment_status: paymentStatus.status,
          error_message: `Payment ${paymentStatus.status.toLowerCase()}`
        })
        .eq('id', order.id);

    } else {
      console.log('⏳ Payment pending for order:', order.id, 'Status:', paymentStatus.status);

      // Update order with current status
      await supabase
        .from('orders')
        .update({
          payment_status: paymentStatus.status
        })
        .eq('id', order.id);
    }

    return new Response('IPN processed successfully', { status: 200 });

  } catch (error) {
    console.error('💥 IPN processing error:', error);
    return new Response('IPN processing failed', { status: 500 });
  }
}

// Check PesaPal payment status
async function checkPesaPalPaymentStatus(trackingId: string): Promise<{
  status: string;
  isPaid: boolean;
  amount?: number;
  currency?: string;
}> {
  try {
    // Get access token
    const accessToken = await getPesaPalAccessToken();
    
    const response = await fetch(
      `https://pay.pesapal.com/v3/api/Transactions/GetTransactionStatus?orderTrackingId=${trackingId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`PesaPal status check failed: ${response.statusText}`);
    }

    const result = await response.json();

    return {
      status: result.payment_status_description || 'PENDING',
      isPaid: result.payment_status_description === 'COMPLETED',
      amount: result.amount,
      currency: result.currency
    };
  } catch (error) {
    console.error('PesaPal status check error:', error);
    return {
      status: 'ERROR',
      isPaid: false
    };
  }
}

// Get PesaPal access token
async function getPesaPalAccessToken(): Promise<string> {
  const response = await fetch('https://pay.pesapal.com/v3/api/Auth/RequestToken', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      consumer_key: 'weWg875DVTHfXKyPK2w2qq0SuZjLKnFx',
      consumer_secret: 'owNK+kmjk1tgSYIfOGxuvnxCSos='
    })
  });

  if (!response.ok) {
    throw new Error(`PesaPal auth failed: ${response.statusText}`);
  }

  const result = await response.json();
  
  if (!result.token) {
    throw new Error('No token received from PesaPal');
  }

  return result.token;
}

// Process 90/10 revenue split
async function process90_10Split(order: any) {
  try {
    console.log('💰 Processing 90/10 split for order:', order.id);

    // 90% to seller
    const sellerAmount = order.seller_earnings;
    
    // 10% to platform
    const platformAmount = order.platform_fee;

    console.log(`💵 Seller gets: ${sellerAmount} KES, Platform gets: ${platformAmount} KES`);

    // Create seller payout record
    const { error: payoutError } = await supabase
      .from('seller_payouts')
      .insert({
        seller_id: order.seller_id,
        order_id: order.id,
        amount: sellerAmount,
        currency: order.currency || 'KES',
        payout_method: 'pending_setup',
        status: 'pending',
        created_at: new Date().toISOString()
      });

    if (payoutError) {
      console.error('❌ Failed to create seller payout:', payoutError);
    } else {
      console.log('✅ Seller payout record created');
    }

    // Update platform earnings
    const { error: platformError } = await supabase
      .from('platform_earnings')
      .insert({
        order_id: order.id,
        amount: platformAmount,
        currency: order.currency || 'KES',
        source: 'order_commission',
        created_at: new Date().toISOString()
      });

    if (platformError) {
      console.error('❌ Failed to record platform earnings:', platformError);
    } else {
      console.log('✅ Platform earnings recorded');
    }

    // Update seller stats
    const { data: profile } = await supabase
      .from('profiles')
      .select('total_earnings, total_sales')
      .eq('user_id', order.seller_id)
      .single();

    if (profile) {
      await supabase
        .from('profiles')
        .update({
          total_earnings: (profile.total_earnings || 0) + sellerAmount,
          total_sales: (profile.total_sales || 0) + 1
        })
        .eq('user_id', order.seller_id);
    }

    console.log('✅ 90/10 split processing completed');

  } catch (error) {
    console.error('💥 90/10 split processing error:', error);
  }
}

// Send payment notifications
async function sendPaymentNotifications(order: any) {
  try {
    console.log('📧 Sending payment notifications for order:', order.id);

    // Notify buyer
    await supabase
      .from('notifications')
      .insert({
        user_id: order.buyer_id,
        type: 'payment_success',
        title: 'Payment Successful! 🎉',
        message: 'Your PesaPal payment has been processed successfully. You can now download your product.',
        data: {
          order_id: order.id,
          amount: order.price,
          currency: order.currency,
          payment_method: 'PesaPal'
        }
      });

    // Notify seller
    await supabase
      .from('notifications')
      .insert({
        user_id: order.seller_id,
        type: 'sale_notification',
        title: 'New Sale via PesaPal! 💰',
        message: `You made a sale! You'll receive ${order.seller_earnings} ${order.currency || 'KES'} (90% of ${order.price}).`,
        data: {
          order_id: order.id,
          amount: order.seller_earnings,
          currency: order.currency,
          buyer_id: order.buyer_id,
          payment_method: 'PesaPal'
        }
      });

    console.log('✅ Notifications sent successfully');

  } catch (error) {
    console.error('💥 Notification sending error:', error);
  }
}