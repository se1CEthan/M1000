// Server-side API endpoint for creating Cryptomus payments
// Simplified version using existing working integration

import { createPaymentInvoice, calculateRevenueSplit } from '@/lib/cryptomus';
import { supabase } from '@/integrations/supabase/clients';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { productId, amount, currency, toCurrency, buyerId, returnUrl, successUrl, callbackUrl } = body;

    console.log('Creating Cryptomus payment:', { productId, amount, currency, toCurrency, buyerId });

    // Validate required fields
    if (!productId || !amount || !currency || !toCurrency || !buyerId) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Missing required fields',
        state: 1
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
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
        error: 'Product not found or not available',
        state: 1
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      });
    }

    // Verify amount matches product price
    if (Math.abs(amount - product.price) > 0.01) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Amount does not match product price',
        state: 1
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
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
        error: 'You already own this product',
        state: 1
      }), {
        status: 409,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      });
    }

    // Calculate revenue split
    const revenueSplit = calculateRevenueSplit(product.price);

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
        platform_fee: revenueSplit.platformFee,
        seller_earnings: revenueSplit.sellerEarnings,
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
        error: 'Failed to create order',
        state: 1
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      });
    }

    // Prepare Cryptomus payment request using existing working integration
    const baseUrl = new URL(request.url).origin;
    const invoiceData = {
      amount: amount.toString(),
      currency: currency,
      order_id: order.id,
      url_return: returnUrl || `${baseUrl}/order-success?order=${order.id}`,
      url_success: successUrl || `${baseUrl}/order-success?order=${order.id}`,
      url_callback: callbackUrl || `${baseUrl}/api/webhooks/cryptomus`,
      to_currency: toCurrency,
      lifetime: 3600, // 1 hour
      is_payment_multiple: false
    };

    console.log('Creating Cryptomus invoice:', invoiceData);

    // Create payment via existing Cryptomus integration
    const paymentResponse = await createPaymentInvoice(invoiceData);

    if (paymentResponse.state !== 0 || !paymentResponse.result) {
      console.error('Cryptomus invoice creation failed:', paymentResponse);
      
      // Update order status to failed
      await supabase
        .from('orders')
        .update({ status: 'refunded' })
        .eq('id', order.id);

      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Failed to create payment invoice',
        state: 1
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
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

    // Return success response in the format expected by frontend
    const response = {
      success: true,
      state: 0,
      result: {
        paymentId: paymentResponse.result.uuid,
        orderId: order.id,
        paymentUrl: paymentResponse.result.url,
        amount: paymentResponse.result.amount,
        currency: paymentResponse.result.currency,
        toCurrency: paymentResponse.result.payer_currency,
        expiresAt: paymentResponse.result.expired_at,
        uuid: paymentResponse.result.uuid,
        url: paymentResponse.result.url
      }
    };

    console.log('Payment created successfully:', response);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });

  } catch (error) {
    console.error('Payment creation error:', error);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error',
      state: 1
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}