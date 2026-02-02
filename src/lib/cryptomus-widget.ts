// Cryptomus Widget Integration Service
// Based on standard Cryptomus widget implementation patterns

import { supabase } from '@/integrations/supabase/clients';
import { calculateRevenueSplit } from './cryptomus';

export interface CreateWidgetPaymentData {
  productId: string;
  buyerId: string;
  amount: number;
  description: string;
}

export interface WidgetPaymentResult {
  success: boolean;
  orderId?: string;
  widgetUrl?: string;
  error?: string;
}

export class CryptomusWidgetService {
  private static readonly WIDGET_BASE_URL = 'https://pay.cryptomus.com/widget/d39cd7e9-6660-4a68-ba36-557cdb52b1d6';
  
  /**
   * Create order and generate widget URL
   * This follows the pattern from typical Cryptomus integrations
   */
  static async createWidgetPayment(data: CreateWidgetPaymentData): Promise<WidgetPaymentResult> {
    try {
      console.log('Creating widget payment for:', data);

      // 1. Get product details
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', data.productId)
        .eq('status', 'approved')
        .single();

      if (productError || !product) {
        return { success: false, error: 'Product not found or not available' };
      }

      // 2. Get current user info
      const { data: authUser, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authUser.user || authUser.user.id !== data.buyerId) {
        return { success: false, error: 'Authentication error - please log in again' };
      }

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
      const revenueSplit = calculateRevenueSplit(data.amount);

      // 5. Create order record
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      
      const orderData = {
        buyer_id: authUser.user.id,
        seller_id: product.seller_id,
        product_id: data.productId,
        order_number: orderNumber,
        status: 'pending' as const,
        price: data.amount,
        platform_fee: revenueSplit.platformFee,
        seller_earnings: revenueSplit.sellerEarnings,
        payment_method: 'cryptocurrency',
        currency: 'USD',
        crypto_currency: 'USDT'
      };

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (orderError || !order) {
        console.error('Order creation error:', orderError);
        return { success: false, error: 'Failed to create order' };
      }

      // 6. Generate widget URL with order parameters
      const widgetParams = new URLSearchParams({
        amount: data.amount.toString(),
        currency: 'USD',
        order_id: order.id,
        description: data.description,
        success_url: `https://seltech.online/order-success?order=${order.id}`,
        return_url: 'https://seltech.online/marketplace'
      });

      const widgetUrl = `${this.WIDGET_BASE_URL}?${widgetParams.toString()}`;

      console.log('Widget payment created successfully:', {
        orderId: order.id,
        widgetUrl
      });

      return {
        success: true,
        orderId: order.id,
        widgetUrl
      };

    } catch (error) {
      console.error('Widget payment creation error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Check if order exists and get its status
   */
  static async getOrderStatus(orderId: string): Promise<{ success: boolean; status?: string; order?: any; error?: string }> {
    try {
      const { data: order, error } = await supabase
        .from('orders')
        .select(`
          *,
          product:products(*),
          buyer:profiles!buyer_id(*),
          seller:profiles!seller_id(*)
        `)
        .eq('id', orderId)
        .single();

      if (error || !order) {
        return { success: false, error: 'Order not found' };
      }

      return { 
        success: true, 
        status: order.status,
        order 
      };

    } catch (error) {
      console.error('Order status check error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Generate widget HTML for embedding
   */
  static generateWidgetHTML(widgetUrl: string, width: number = 440, height: number = 372): string {
    return `
      <iframe
        src="${widgetUrl}"
        width="${width}"
        height="${height}"
        frameborder="0"
        style="border: none; border-radius: 8px;"
        title="Cryptomus Payment Widget"
      ></iframe>
    `;
  }

  /**
   * Validate widget parameters
   */
  static validateWidgetParams(params: CreateWidgetPaymentData): { valid: boolean; error?: string } {
    if (!params.productId || typeof params.productId !== 'string') {
      return { valid: false, error: 'Invalid product ID' };
    }

    if (!params.buyerId || typeof params.buyerId !== 'string') {
      return { valid: false, error: 'Invalid buyer ID' };
    }

    if (!params.amount || typeof params.amount !== 'number' || params.amount <= 0) {
      return { valid: false, error: 'Invalid amount' };
    }

    if (!params.description || typeof params.description !== 'string') {
      return { valid: false, error: 'Invalid description' };
    }

    return { valid: true };
  }
}