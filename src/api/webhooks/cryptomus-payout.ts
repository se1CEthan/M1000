// Production Cryptomus Payout Webhook Handler for seltech.online
// Handles payout confirmations and status updates

import { supabase } from '@/integrations/supabase/clients';
import crypto from 'crypto';

// Cryptomus configuration
const CRYPTOMUS_CONFIG = {
  MERCHANT_UUID: '6e6c1018-48f4-49fd-a10d-36d6cd70eefe',
  WEBHOOK_SECRET: 'seltech_webhook_secret_2024',
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

// Main payout webhook handler
export async function POST(request: Request) {
  try {
    const signature = request.headers.get('sign') || request.headers.get('x-sign');
    const body = await request.text();
    const webhookData = JSON.parse(body);

    console.log('📨 Received Cryptomus payout webhook:', webhookData);

    // Verify signature
    if (!signature || !verifyWebhookSignature(body, signature)) {
      console.error('❌ Invalid payout webhook signature');
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Find the payout by order_id (which is our payout ID)
    const { data: payout, error: payoutError } = await supabase
      .from('payouts')
      .select(`
        *,
        seller:profiles!seller_id(*)
      `)
      .eq('id', webhookData.order_id)
      .single();

    if (payoutError || !payout) {
      console.error('❌ Payout not found:', webhookData.order_id);
      return new Response(JSON.stringify({ error: 'Payout not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Map Cryptomus payout status
    let payoutStatus: string;
    let notificationTitle: string;
    let notificationMessage: string;
    let notificationType: string;

    switch (webhookData.status) {
      case 'paid':
      case 'paid_over':
        payoutStatus = 'completed';
        notificationTitle = 'Payout Completed! 🎉';
        notificationMessage = `Your payout of ${payout.amount} ${payout.currency} has been successfully sent to your wallet. Transaction ID: ${webhookData.txid}`;
        notificationType = 'payout_completed';
        break;
      case 'fail':
      case 'cancel':
      case 'system_fail':
        payoutStatus = 'failed';
        notificationTitle = 'Payout Failed ⚠️';
        notificationMessage = `Your payout of ${payout.amount} ${payout.currency} could not be processed. Please check your wallet address and contact support if needed.`;
        notificationType = 'payout_failed';
        break;
      default:
        payoutStatus = 'processing';
        notificationTitle = 'Payout Processing 🔄';
        notificationMessage = `Your payout of ${payout.amount} ${payout.currency} is being processed and will arrive shortly.`;
        notificationType = 'payout_processing';
    }

    console.log(`💰 Payout ${payout.id} status: ${payout.status} → ${payoutStatus}`);

    // Update payout status
    const updateData: any = { 
      status: payoutStatus,
      transaction_id: webhookData.txid,
      updated_at: new Date().toISOString(),
    };

    if (payoutStatus === 'completed') {
      updateData.processed_at = new Date().toISOString();
    } else if (payoutStatus === 'failed') {
      updateData.error_message = `Cryptomus payout failed: ${webhookData.status}`;
    }

    const { error: updateError } = await supabase
      .from('payouts')
      .update(updateData)
      .eq('id', payout.id);

    if (updateError) {
      console.error('❌ Failed to update payout:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to update payout' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create notification for seller
    await supabase
      .from('notifications')
      .insert({
        user_id: payout.seller_id,
        type: notificationType,
        title: notificationTitle,
        message: notificationMessage,
        data: {
          payout_id: payout.id,
          amount: payout.amount,
          currency: payout.currency,
          transaction_id: webhookData.txid,
          status: payoutStatus,
          wallet_address: payout.method_address,
        },
      });

    // Log payout completion for analytics
    if (payoutStatus === 'completed') {
      console.log(`✅ Payout completed for seller ${payout.seller_id}: ${payout.amount} ${payout.currency}`);
      
      // Update seller's last payout date
      await supabase
        .from('profiles')
        .update({
          last_payout_at: new Date().toISOString(),
        })
        .eq('user_id', payout.seller_id);
    } else if (payoutStatus === 'failed') {
      console.error(`❌ Payout failed for seller ${payout.seller_id}: ${payout.amount} ${payout.currency}`);
    }

    console.log('✅ Payout webhook processed successfully');
    
    return new Response(JSON.stringify({ status: 'ok' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Payout webhook error:', error);
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
    service: 'Seltech Cryptomus Payout Webhook',
    merchant: CRYPTOMUS_CONFIG.MERCHANT_UUID,
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}