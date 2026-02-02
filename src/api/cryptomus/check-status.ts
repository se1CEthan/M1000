// Server-side API endpoint for checking Cryptomus payment status
// Simplified version using existing working integration

import { checkPaymentStatus } from '@/lib/cryptomus';
import { supabase } from '@/integrations/supabase/clients';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId, paymentId, uuid } = body;

    console.log('Checking payment status:', { orderId, paymentId, uuid });

    if (!orderId && !paymentId && !uuid) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Either orderId, paymentId, or uuid is required',
        state: 1
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
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
          error: 'Order not found',
          state: 1
        }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        });
      }
      order = data;
    } else {
      const searchPaymentId = paymentId || uuid;
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('payment_id', searchPaymentId)
        .single();
      
      if (error || !data) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Order not found',
          state: 1
        }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        });
      }
      order = data;
    }

    if (!order.payment_id) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Payment ID not found for this order',
        state: 1
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      });
    }

    // Check payment status with Cryptomus using existing integration
    const statusResponse = await checkPaymentStatus(order.payment_id);

    if (statusResponse.state !== 0 || !statusResponse.result) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Failed to get payment status',
        state: 1
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      });
    }

    const paymentResult = statusResponse.result;

    // Map payment status
    let mappedStatus = 'pending';
    let statusLabel = 'Payment Processing';
    let statusColor = 'yellow';

    switch (paymentResult.payment_status) {
      case 'paid':
      case 'paid_over':
        mappedStatus = 'completed';
        statusLabel = 'Payment Successful';
        statusColor = 'green';
        break;
      case 'fail':
      case 'cancel':
      case 'system_fail':
        mappedStatus = 'failed';
        statusLabel = 'Payment Failed';
        statusColor = 'red';
        break;
      case 'process':
      case 'confirm_check':
        mappedStatus = 'pending';
        statusLabel = 'Payment Processing';
        statusColor = 'yellow';
        break;
    }

    // Update order status in database
    const updateData: any = {
      crypto_amount: parseFloat(paymentResult.payer_amount || '0'),
      payment_address: paymentResult.address,
      payment_network: paymentResult.network,
      transaction_hash: paymentResult.txid || null,
      updated_at: new Date().toISOString()
    };

    if (mappedStatus === 'completed' && order.status !== 'paid') {
      updateData.status = 'paid';
      updateData.completed_at = new Date().toISOString();
      
      // Generate download URL if not exists
      if (!order.download_url) {
        updateData.download_url = await generateDownloadUrl(order.product_id);
        updateData.download_expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      }
    } else if (mappedStatus === 'failed') {
      updateData.status = 'refunded';
    } else if (mappedStatus === 'pending') {
      updateData.status = 'pending';
    }

    // Update order in database
    await supabase
      .from('orders')
      .update(updateData)
      .eq('id', order.id);

    // Return payment status in the format expected by frontend
    const response = {
      success: true,
      state: 0,
      result: {
        orderId: order.id,
        paymentId: paymentResult.uuid,
        status: mappedStatus,
        statusLabel: statusLabel,
        statusColor: statusColor,
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
        isFinal: paymentResult.is_final,
        // Also include the raw Cryptomus response for compatibility
        uuid: paymentResult.uuid,
        order_id: paymentResult.order_id,
        payment_status: paymentResult.payment_status,
        url: paymentResult.url
      }
    };

    console.log('Payment status checked successfully:', response);

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
    console.error('Payment status check error:', error);
    
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