// Direct Cryptomus redirect service - takes users straight to Cryptomus payment page
// This creates orders and immediately redirects to Cryptomus website

import CryptoJS from 'crypto-js';
import { supabase } from '@/integrations/supabase/clients';
import { calculateRevenueSplit } from './cryptomus';

// Cryptomus configuration
const CRYPTOMUS_CONFIG = {
  PAYMENT_API_KEY: 'DSk5vMk3RIBhiQ3qGUw1pH1iYJI1hSSN8iTYmHpm3WpyTj9bsTtIlhadpiFKlK5aVUmpjHH8YoLV9dQsxLAPzpQOdiffl2hzJo0378ExFJB3HMSx49LjTfvnm9qHztoP',
  MERCHANT_UUID: '6e6c1018-48f4-49fd-a10d-36d6cd70eefe',
  BASE_URL: 'https://api.cryptomus.com/v1'
};

// Generate MD5 signature for Cryptomus
function generateSignature(data: Record<string, any>, apiKey: string): string {
  const jsonString = JSON.stringify(data);
  const base64Data = btoa(jsonString);
  const message = base64Data + apiKey;
  
  return CryptoJS.MD5(message).toString(CryptoJS.enc.Hex);
}

export class CryptomusRedirectService {
  /**
   * Direct redirect to Cryptomus payment page
   * Creates order and immediately redirects user to Cryptomus website
   */
  static async redirectToPayment(productId: string, currency: string = 'USDT'): Promise<void> {
    try {
      console.log('Creating order and redirecting to Cryptomus...');

      // 1. Get current user
      const { data: authUser, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authUser.user) {
        // Redirect to login if not authenticated
        window.location.href = '/auth?redirect=' + encodeURIComponent(window.location.pathname);
        return;
      }

      // 2. Get product details
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .eq('status', 'approved')
        .single();

      if (productError || !product) {
        console.error('Product not found:', productError);
        alert('Product not found or not available');
        return;
      }

      // 3. Check if user already owns this product
      const { data: existingOrder } = await supabase
        .from('orders')
        .select('id')
        .eq('buyer_id', authUser.user.id)
        .eq('product_id', productId)
        .eq('status', 'paid')
        .single();

      if (existingOrder) {
        alert('You already own this product');
        return;
      }

      // 4. Calculate revenue split
      const revenueSplit = calculateRevenueSplit(product.price);

      // 5. Create order record
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      
      const orderData = {
        buyer_id: authUser.user.id,
        seller_id: product.seller_id,
        product_id: productId,
        order_number: orderNumber,
        status: 'pending' as const,
        price: product.price,
        platform_fee: revenueSplit.platformFee,
        seller_earnings: revenueSplit.sellerEarnings,
        payment_method: 'cryptocurrency',
        currency: 'USD',
        crypto_currency: currency
      };

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (orderError || !order) {
        console.error('Order creation error:', orderError);
        alert('Failed to create order. Please try again.');
        return;
      }

      console.log('Order created successfully:', order.id);

      // 6. Create Cryptomus payment invoice
      const invoiceData = {
        amount: product.price.toString(),
        currency: 'USD',
        order_id: order.id,
        url_return: `${window.location.origin}/marketplace`,
        url_success: `${window.location.origin}/order-success?order=${order.id}`,
        url_callback: `${window.location.origin}/api/webhooks/cryptomus`,
        to_currency: currency,
        lifetime: 3600, // 1 hour
        merchant: CRYPTOMUS_CONFIG.MERCHANT_UUID,
      };

      const signature = generateSignature(invoiceData, CRYPTOMUS_CONFIG.PAYMENT_API_KEY);

      console.log('Creating Cryptomus payment invoice...');

      // 7. Call Cryptomus API
      const response = await fetch(`${CRYPTOMUS_CONFIG.BASE_URL}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'merchant': CRYPTOMUS_CONFIG.MERCHANT_UUID,
          'sign': signature,
        },
        body: JSON.stringify(invoiceData),
      });

      if (!response.ok) {
        console.error('Cryptomus API error:', response.status, response.statusText);
        
        // Fallback: redirect to manual payment page
        window.location.href = `/manual-payment?order=${order.id}&amount=${product.price}&currency=${currency}`;
        return;
      }

      const paymentResponse = await response.json();

      if (paymentResponse.state !== 0) {
        console.error('Cryptomus payment creation failed:', paymentResponse);
        
        // Fallback: redirect to manual payment page
        window.location.href = `/manual-payment?order=${order.id}&amount=${product.price}&currency=${currency}`;
        return;
      }

      // 8. Update order with payment details
      await supabase
        .from('orders')
        .update({
          payment_id: paymentResponse.result.uuid,
          crypto_amount: parseFloat(paymentResponse.result.payer_amount || '0')
        })
        .eq('id', order.id);

      console.log('Redirecting to Cryptomus payment page:', paymentResponse.result.url);

      // 9. Redirect directly to Cryptomus payment page
      window.location.href = paymentResponse.result.url;

    } catch (error) {
      console.error('Payment redirect error:', error);
      alert('Payment system temporarily unavailable. Please try again later.');
    }
  }

  /**
   * Quick buy with default USDT currency
   */
  static async quickBuy(productId: string): Promise<void> {
    await this.redirectToPayment(productId, 'USDT');
  }

  /**
   * Buy with specific currency
   */
  static async buyWithCurrency(productId: string, currency: string): Promise<void> {
    await this.redirectToPayment(productId, currency);
  }
}