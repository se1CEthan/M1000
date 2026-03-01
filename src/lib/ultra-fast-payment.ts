/**
 * Ultra-Fast Payment Service
 * Optimized for instant loading and minimal database calls
 */

import { supabase } from '@/integrations/supabase/clients';

interface FastPaymentData {
  productId: string;
  buyerId: string;
  productPrice: number;
  productTitle: string;
  sellerId: string;
}

interface FastPaymentResult {
  success: boolean;
  orderId?: string;
  widgetUrl?: string;
  error?: string;
}

export class UltraFastPayment {
  // Cryptomus widget base URL (replace with actual widget if needed)
  private static widgetBaseUrl = 'https://pay.cryptomus.com/paywidget?';
  
  /**
   * Create payment with minimal database operations
   */
  static async createPayment(data: FastPaymentData): Promise<FastPaymentResult> {
    try {
      // Generate order ID immediately (no database call needed yet)
      const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

      // Create payment via Cryptomus API (replace with your actual endpoint)
      const paymentResponse = await fetch('/api/cryptomus/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: data.productId,
          buyerId: data.buyerId,
          productPrice: data.productPrice,
          productTitle: data.productTitle,
          sellerId: data.sellerId,
          orderId
        })
      });
      const paymentResult = await paymentResponse.json();

      // Use Cryptomus widget URL for widget
      const widgetUrl = paymentResult.widgetUrl || '';

      // Create order in background (non-blocking)
      this.createOrderAsync(data, orderId).catch(console.error);

      return {
        success: !!widgetUrl,
        orderId,
        widgetUrl,
        error: widgetUrl ? undefined : paymentResult.message || 'Failed to create payment'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment creation failed'
      };
    }
  }
  
  // Widget URL is now provided by Cryptomus API response
  // No need for generateWidgetUrl
  
  /**
   * Create order asynchronously (non-blocking)
   */
  private static async createOrderAsync(data: FastPaymentData, orderId: string): Promise<void> {
    try {
      const price = data.productPrice;
      const platformFee = price * 0.1;
      const sellerEarnings = price * 0.9;
      
      await supabase
        .from('orders')
        .insert({
          id: orderId,
          buyer_id: data.buyerId,
          seller_id: data.sellerId,
          product_id: data.productId,
          order_number: orderId,
          status: 'pending',
          price: price,
          platform_fee: platformFee,
          seller_earnings: sellerEarnings,
          payment_method: 'cryptocurrency',
          currency: 'USD',
          crypto_currency: 'USDT'
        });
        
      console.log('Order created successfully:', orderId);
    } catch (error) {
      console.error('Background order creation failed:', error);
      // Don't throw - payment can still proceed
    }
  }
  
  /**
   * Validate user can purchase (fast check)
   */
  static async canPurchase(productId: string, buyerId: string): Promise<boolean> {
    try {
      const { data } = await supabase
        .from('orders')
        .select('id')
        .eq('buyer_id', buyerId)
        .eq('product_id', productId)
        .eq('status', 'paid')
        .limit(1)
        .single();
        
      return !data; // Can purchase if no existing paid order
    } catch {
      return true; // Allow purchase if check fails
    }
  }
}