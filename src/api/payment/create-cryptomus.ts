/**
 * Server-side Cryptomus Payment Creation
 * Handles CORS and API calls from the server
 */

import { createPaymentInvoice, calculateRevenueSplit } from '@/lib/cryptomus';
import { supabase } from '@/integrations/supabase/clients';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { productId, buyerId, currency } = body;

    console.log('Server-side payment creation:', { productId, buyerId, currency });

    // Validate required fields
    if (!productId || !buyerId || !currency) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Missing required fields' 
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
      console.error('Product fetch error:', productError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Product not found or not available' 
      }), {
        status: 404,
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
        error: 'You already own this product' 
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
        price: product.price,
        platform_fee: revenueSplit.platformFee,
        seller_earnings: revenueSplit.sellerEarnings,
        payment_method: 'cryptocurrency',
        currency: 'USD',
        crypto_currency: currency
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
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      });
    }

    console.log('Order created successfully:', order.id);

    // Create Cryptomus payment invoice (server-side)
    const baseUrl = new URL(request.url).origin;
    const invoiceData = {
      amount: product.price.toString(),
      currency: 'USD',
      order_id: order.id,
      url_return: `${baseUrl}/order-success?order=${order.id}`,
      url_success: `${baseUrl}/order-success?order=${order.id}`,
      url_callback: `${baseUrl}/api/webhooks/cryptomus`,
      to_currency: currency,
      lifetime: 3600, // 1 hour
      is_payment_multiple: false
    };

    console.log('Creating Cryptomus invoice server-side:', invoiceData);

    // Call Cryptomus API from server (no CORS issues)
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
        error: 'Failed to create payment invoice' 
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

    console.log('Payment created successfully server-side');

    // Return success response
    return new Response(JSON.stringify({
      success: true,
      orderId: order.id,
      paymentUrl: paymentResponse.result.url,
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });

  } catch (error) {
    console.error('Server-side payment creation error:', error);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Payment creation failed' 
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