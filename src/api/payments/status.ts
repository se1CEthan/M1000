/**
 * Backend API: Check Payment Status
 * Secure server-side payment status checking
 */

import { CryptomusAPIClient, getPaymentStatusDisplay } from '@/lib/cryptomus-core';
import { supabase } from '@/integrations/supabase/clients';

export interface PaymentStatusAPIRequest {
  orderId?: string;
  paymentId?: string;
}

export interface PaymentStatusAPIResponse {
  success: boolean;
  data?: {
    orderId: string;
    paymentId: string;
    status: string;
    statusLabel: string;
    statusColor: string;
    amount: string;
    paidAmount: string;
    currency: string;
    toCurrency: string;
    network: string;
    address: string;
    txid: string;
    createdAt: string;
    updatedAt: string;
    expiresAt: number;
    isFinal: boolean;
  };
  error?: string;
}

/**
 * POST /api/payments/status
 * Checks payment status via Cryptomus API and updates local database
 */
export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body: PaymentStatusAPIRequest = await req.json();
    const { orderId, paymentId } = body;

    if (!orderId && !paymentId) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Either orderId or paymentId is required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get order from database
    let order;
    if (orderId) {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();
      
      if (error || !data) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Order not found' 
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      order = data;
    } else {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('payment_id', paymentId)
        .single();
      
      if (error || !data) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Order not found' 
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      order = data;
    }

    if (!order.payment_id) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Payment ID not found for this order' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check payment status with Cryptomus
    const statusResponse = await CryptomusAPIClient.getPaymentStatus(order.payment_id);

    if (!statusResponse.result) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Failed to get payment status' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const paymentResult = statusResponse.result;
    const statusInfo = getPaymentStatusDisplay(paymentResult.payment_status);

    // Update order status in database
    const updateData: any = {
      crypto_amount: parseFloat(paymentResult.payer_amount || '0'),
      payment_address: paymentResult.address,
      payment_network: paymentResult.network,
      transaction_hash: paymentResult.txid || null,
      updated_at: new Date().toISOString()
    };

    // Map Cryptomus status to our order status
    if (paymentResult.payment_status === 'paid' || paymentResult.payment_status === 'paid_over') {
      updateData.status = 'paid';
      updateData.completed_at = new Date().toISOString();
      
      // Generate download URL if not exists
      if (!order.download_url) {
        updateData.download_url = await generateDownloadUrl(order.product_id);
        updateData.download_expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      }
    } else if (['fail', 'cancel', 'system_fail'].includes(paymentResult.payment_status)) {
      updateData.status = 'failed';
    } else if (['process', 'confirm_check'].includes(paymentResult.payment_status)) {
      updateData.status = 'pending';
    }

    // Update order in database
    await supabase
      .from('orders')
      .update(updateData)
      .eq('id', order.id);

    // If payment is completed and this is the first time, process seller payout
    if (updateData.status === 'paid' && order.status !== 'paid') {
      // Trigger seller payout (implement this based on your payout system)
      await processSellerpayout(order.id);
    }

    // Return payment status
    const response: PaymentStatusAPIResponse = {
      success: true,
      data: {
        orderId: order.id,
        paymentId: paymentResult.uuid,
        status: statusInfo.status,
        statusLabel: statusInfo.label,
        statusColor: statusInfo.color,
        amount: paymentResult.amount,
        paidAmount: paymentResult.payer_amount,
        currency: paymentResult.currency,
        toCurrency: paymentResult.payer_currency,
        network: paymentResult.network,
        address: paymentResult.address,
        txid: paymentResult.txid,
        createdAt: paymentResult.created_at,
        updatedAt: paymentResult.updated_at,
        expiresAt: paymentResult.expired_at,
        isFinal: paymentResult.is_final
      }
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Payment status check error:', error);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Generate secure download URL for purchased product
 */
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
async function processSellerpayout(orderId: string): Promise<void> {
  try {
    // Get order and seller details
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

    // Check if seller has payout configuration
    if (!order.seller.wallet_address) {
      console.log('Seller does not have wallet configured, skipping automatic payout');
      return;
    }

    // Create payout record
    const { data: payout, error: payoutError } = await supabase
      .from('payouts')
      .insert({
        seller_id: order.seller.user_id,
        order_id: orderId,
        amount: order.seller_earnings,
        currency: order.crypto_currency || 'USDT',
        wallet_address: order.seller.wallet_address,
        status: 'pending'
      })
      .select()
      .single();

    if (payoutError || !payout) {
      console.error('Failed to create payout record:', payoutError);
      return;
    }

    // Create Cryptomus payout (if you want automatic payouts)
    // This is optional - you might want to process payouts manually for security
    console.log(`Payout created for seller ${order.seller.user_id}: $${order.seller_earnings}`);

  } catch (error) {
    console.error('Seller payout processing error:', error);
  }
}