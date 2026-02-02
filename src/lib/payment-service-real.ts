// Real Cryptomus payment service for production use
// This integrates with the actual Cryptomus payment gateway

import { supabase } from '@/integrations/supabase/clients';
import { calculateRevenueSplit, SUPPORTED_CURRENCIES } from './cryptomus';
import { LivePayoutSystem } from './payout-system';

export interface PaymentInitiationData {
  productId: string;
  buyerId: string;
  currency: string;
  returnUrl?: string;
  successUrl?: string;
}

export interface PaymentResult {
  success: boolean;
  orderId?: string;
  paymentUrl?: string;
  error?: string;
}

export class RealPaymentService {
  /**
   * Initiate a real Cryptomus payment for a product purchase
   */
  static async initiatePayment(data: PaymentInitiationData): Promise<PaymentResult> {
    try {
      console.log('Initiating real Cryptomus payment for:', data);

      // 1. Get product details
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', data.productId)
        .eq('status', 'approved')
        .single();

      if (productError || !product) {
        console.error('Product fetch error:', productError);
        return { success: false, error: 'Product not found or not available' };
      }

      console.log('Product found:', product.title);

      // 2. Get current user info directly from auth
      const { data: authUser, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authUser.user || authUser.user.id !== data.buyerId) {
        console.error('Auth user mismatch or error:', authError);
        return { success: false, error: 'Authentication error - please log in again' };
      }

      console.log('User authenticated:', authUser.user.email);

      // 3. Check if user already owns this product
      const { data: existingOrder } = await supabase
        .from('orders')
        .select('id')
        .eq('buyer_id', authUser.user.id)
        .eq('product_id', data.productId)
        .eq('status', 'paid')
        .single();

      if (existingOrder) {
        return { success: false, error: 'You already own this product' };
      }

      // 4. Calculate revenue split
      const revenueSplit = calculateRevenueSplit(product.price);
      console.log('Revenue split:', revenueSplit);

      // 5. Create order record
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      
      const orderData = {
        buyer_id: authUser.user.id,
        seller_id: product.seller_id,
        product_id: data.productId,
        order_number: orderNumber,
        status: 'pending' as const,
        price: product.price,
        platform_fee: revenueSplit.platformFee,
        seller_earnings: revenueSplit.sellerEarnings,
        payment_method: 'cryptocurrency',
        currency: 'USD',
        crypto_currency: data.currency
      };

      console.log('Creating order with data:', orderData);

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (orderError) {
        console.error('Order creation error:', orderError);
        return { success: false, error: `Failed to create order: ${orderError.message}` };
      }

      if (!order) {
        return { success: false, error: 'Failed to create order - no data returned' };
      }

      console.log('Order created successfully:', order.id);

      // 6. Create real Cryptomus payment invoice via server API
      const invoiceData = {
        amount: product.price.toString(),
        currency: 'USD',
        order_id: order.id,
        url_return: data.returnUrl || `${window.location.origin}/marketplace`,
        url_success: data.successUrl || `${window.location.origin}/order-success?order=${order.id}`,
        url_callback: `${window.location.origin}/api/webhooks/cryptomus`,
        to_currency: data.currency,
        lifetime: 3600, // 1 hour expiry
      };

      console.log('Creating real Cryptomus invoice via API:', invoiceData);

      // Call server-side API endpoint for real Cryptomus integration
      const apiResponse = await fetch('/api/cryptomus/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData),
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json().catch(() => ({ error: 'Unknown API error' }));
        console.error('Cryptomus API response error:', errorData);
        
        // Update order status to failed
        await supabase
          .from('orders')
          .update({ status: 'refunded' as const })
          .eq('id', order.id);

        return { success: false, error: errorData.error || 'Failed to create payment invoice' };
      }

      const paymentResponse = await apiResponse.json();
      console.log('Real Cryptomus response via API:', paymentResponse);

      if (paymentResponse.state !== 0) {
        console.error('Cryptomus invoice creation failed:', paymentResponse);
        
        // Update order status to failed
        await supabase
          .from('orders')
          .update({ status: 'refunded' as const })
          .eq('id', order.id);

        return { success: false, error: 'Failed to create payment invoice' };
      }

      // 7. Update order with real payment details
      const updateResult = await supabase
        .from('orders')
        .update({
          payment_id: paymentResponse.result.uuid,
          crypto_amount: parseFloat(paymentResponse.result.payer_amount || '0')
        })
        .eq('id', order.id);

      if (updateResult.error) {
        console.error('Order update error:', updateResult.error);
      }

      console.log('Real Cryptomus payment initiated successfully');

      return {
        success: true,
        orderId: order.id,
        paymentUrl: paymentResponse.result.url, // Real Cryptomus payment URL
      };

    } catch (error) {
      console.error('Real payment initiation error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Check real Cryptomus payment status and update order
   */
  static async checkPaymentStatus(orderId: string): Promise<{ success: boolean; status?: string; error?: string }> {
    try {
      // Get order details
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderError || !order || !order.payment_id) {
        return { success: false, error: 'Order not found' };
      }

      // Check payment status with real Cryptomus API via server endpoint
      const statusResponse = await fetch('/api/cryptomus/check-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uuid: order.payment_id }),
      });

      if (!statusResponse.ok) {
        const errorData = await statusResponse.json().catch(() => ({ error: 'Unknown API error' }));
        console.error('Cryptomus status API error:', errorData);
        return { success: false, error: 'Failed to check payment status' };
      }

      const paymentStatus = await statusResponse.json();

      if (paymentStatus.state !== 0) {
        return { success: false, error: 'Failed to check payment status' };
      }

      const cryptomusStatus = paymentStatus.result.payment_status;
      let orderStatus: string = order.status;

      // Map Cryptomus status to our order status
      switch (cryptomusStatus) {
        case 'paid':
        case 'paid_over':
          orderStatus = 'paid';
          break;
        case 'fail':
        case 'cancel':
        case 'system_fail':
          orderStatus = 'refunded';
          break;
        case 'process':
        case 'confirm_check':
          orderStatus = 'pending';
          break;
        default:
          orderStatus = 'pending';
      }

      // Update order status
      const updateData: any = { status: orderStatus };
      
      if (orderStatus === 'paid') {
        updateData.completed_at = new Date().toISOString();
        updateData.download_url = await this.generateDownloadUrl(order.product_id);
        updateData.download_expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      }

      await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      // If payment is completed, process seller payout
      if (orderStatus === 'paid' && order.status !== 'paid') {
        await LivePayoutSystem.processAutomaticPayout(orderId);
      }

      return { success: true, status: orderStatus };

    } catch (error) {
      console.error('Real payment status check error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Generate secure download URL for purchased product
   */
  static async generateDownloadUrl(productId: string): Promise<string> {
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
   * Get supported cryptocurrencies
   */
  static getSupportedCurrencies() {
    return SUPPORTED_CURRENCIES;
  }
}