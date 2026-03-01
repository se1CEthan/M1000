/**
 * Backend API: Create Cryptomus Payment
 * Secure server-side payment creation with signature generation
 */

import { CryptomusAPIClient, type CreatePaymentRequest } from '@/lib/cryptomus-core';
import { supabase } from '@/integrations/supabase/clients';

export interface CreatePaymentAPIRequest {
  productId: string;
  amount: number;
  currency: string;
  toCurrency: string;
  buyerId: string;
  returnUrl?: string;
  successUrl?: string;
  callbackUrl?: string;
}

export interface CreatePaymentAPIResponse {
  success: boolean;
  data?: {
    paymentId: string;
    orderId: string;
    paymentUrl: string;
    amount: string;
    currency: string;
    toCurrency: string;
    expiresAt: number;
  };
  error?: string;
}

/**
 * POST /api/payments/create
 * Creates a new payment invoice via Cryptomus API
 */
export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body: CreatePaymentAPIRequest = await req.json();
    const { productId, amount, currency, toCurrency, buyerId, returnUrl, successUrl, callbackUrl } = body;

    // Validate required fields
    if (!productId || !amount || !currency || !toCurrency || !buyerId) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Missing required fields' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate amount
    if (amount <= 0 || amount > 1000000) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid amount' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get product details
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('status', 'approved')
      .single();

    if (productError || !product) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Product not found or not available' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify amount matches product price
    if (Math.abs(amount - product.price) > 0.01) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Amount does not match product price' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if user already owns this product
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id')
      .eq('buyer_id', buyerId)
      .eq('product_id', productId)
      .eq('status', 'paid')
      .single();

    if (existingOrder) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'You already own this product' 
      }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Calculate revenue split
    const platformFee = amount * 0.1;
    const sellerEarnings = amount * 0.9;

    // Create order in database
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        buyer_id: buyerId,
        seller_id: product.seller_id,
        product_id: productId,
        order_number: orderNumber,
        status: 'pending',
        price: amount,
        platform_fee: platformFee,
        seller_earnings: sellerEarnings,
        payment_method: 'cryptocurrency',
        currency: currency,
        crypto_currency: toCurrency
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error('Order creation error:', orderError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Failed to create order' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Prepare Cryptomus payment request
    const baseUrl = new URL(req.url).origin;
    const paymentRequest: CreatePaymentRequest = {
      amount: amount.toString(),
      currency: currency,
      order_id: order.id,
      url_return: returnUrl || `${baseUrl}/order-success?order=${order.id}`,
      url_success: successUrl || `${baseUrl}/order-success?order=${order.id}`,
      // url_callback removed for simpler flow
      to_currency: toCurrency,
      lifetime: 3600, // 1 hour
      is_payment_multiple: false,
      additional_data: JSON.stringify({
        product_title: product.title,
        buyer_id: buyerId,
        seller_id: product.seller_id
      })
    };

    // Create payment via Cryptomus API
    const paymentResponse = await CryptomusAPIClient.createPayment(paymentRequest);

    if (!paymentResponse.result) {
      // Update order status to failed
      await supabase
        .from('orders')
        .update({ status: 'failed' })
        .eq('id', order.id);

      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Failed to create payment invoice' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Update order with payment details
    await supabase
      .from('orders')
      .update({
        payment_id: paymentResponse.result.uuid,
        crypto_amount: parseFloat(paymentResponse.result.payer_amount || '0'),
        payment_address: paymentResponse.result.address,
        payment_network: paymentResponse.result.network
      })
      .eq('id', order.id);

    // Return success response
    const response: CreatePaymentAPIResponse = {
      success: true,
      data: {
        paymentId: paymentResponse.result.uuid,
        orderId: order.id,
        paymentUrl: paymentResponse.result.url,
        amount: paymentResponse.result.amount,
        currency: paymentResponse.result.currency,
        toCurrency: paymentResponse.result.payer_currency,
        expiresAt: paymentResponse.result.expired_at
      }
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Payment creation error:', error);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}