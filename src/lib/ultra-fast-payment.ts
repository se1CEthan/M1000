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
  private static widgetBaseUrl = 'https://pay.cryptomus.com/widget/1135f505-133e-474f-b56f-0f56ad44158d';
  
  /**
   * Create payment with minimal database operations
   */
  static async createPayment(data: FastPaymentData): Promise<FastPaymentResult> {
    try {
      // Generate order ID immediately (no database call needed yet)
      const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      
      // Create widget URL immediately
      const widgetUrl = this.generateWidgetUrl(orderId, data.productPrice);
      
      // Create order in background (non-blocking)
      this.createOrderAsync(data, orderId).catch(console.error);
      
      return {
        success: true,
        orderId,
        widgetUrl
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment creation failed'
      };
    }
  }
  
  /**
   * Generate widget URL instantly
   */
  private static generateWidgetUrl(orderId: string, amount: number): string {
    const params = new URLSearchParams({
      order_id: orderId,
      amount: amount.toString(),
      currency: 'USD',
      to_currency: 'USDT',
      url_success: `https://seltech.online/order-success?order=${orderId}`,
      url_return: 'https://seltech.online/marketplace',
      url_callback: 'https://rtsaarapvlzzinmpjdys.supabase.co/functions/v1/cryptomus-webhook',
      is_payment_multiple: 'false',
      lifetime: '3600'
    });
    
    return `${this.widgetBaseUrl}?${params.toString()}`;
  }
  
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