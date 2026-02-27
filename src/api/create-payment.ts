/**
 * Backend API: Create Cryptomus Payment
 * This endpoint creates a payment invoice via Cryptomus API
 * Must be called from backend to avoid CORS issues
 */

import { createPaymentInvoice, type CreateInvoiceRequest } from '@/lib/cryptomus';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, currency, order_id, url_return, url_success, url_callback } = body;

    console.log('📡 Creating Cryptomus payment invoice:', {
      amount,
      currency,
      order_id
    });

    // Validate required fields
    if (!amount || !currency || !order_id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields: amount, currency, order_id'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create payment invoice via Cryptomus API
    const invoiceData: CreateInvoiceRequest = {
      amount: amount.toString(),
      currency,
      order_id,
      url_return: url_return || `${new URL(request.url).origin}/order-success?order_id=${order_id}`,
      url_success: url_success || `${new URL(request.url).origin}/order-success?order_id=${order_id}`,
      url_callback: url_callback || `${new URL(request.url).origin}/api/webhooks/cryptomus`,
      lifetime: 3600,
      is_payment_multiple: false
    };

    console.log('📋 Invoice data:', invoiceData);

    const result = await createPaymentInvoice(invoiceData);

    console.log('✅ Cryptomus response:', result);

    if (result.state === 0 && result.result) {
      return new Response(JSON.stringify({
        success: true,
        payment_url: result.result.url,
        payment_id: result.result.uuid,
        order_id: result.result.order_id,
        amount: result.result.amount,
        currency: result.result.currency,
        expired_at: result.result.expired_at
      }), {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    } else {
      console.error('❌ Cryptomus API error:', result);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to create payment invoice'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

  } catch (error: any) {
    console.error('💥 Payment creation error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
