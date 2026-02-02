/**
 * Supabase Edge Functions Cryptomus Payment Integration
 * Uses Supabase Edge Functions to avoid CORS issues
 */

import { supabase } from '@/integrations/supabase/clients';
import { SUPPORTED_CURRENCIES } from './cryptomus';

export interface SimplePaymentData {
  productId: string;
  buyerId: string;
  currency: string;
}

export interface SimplePaymentResult {
  success: boolean;
  orderId?: string;
  paymentUrl?: string;
  error?: string;
}

export class SimpleCryptomusPayment {
  /**
   * Create payment using Supabase Edge Functions
   */
  static async createPayment(data: SimplePaymentData): Promise<SimplePaymentResult> {
    try {
      console.log('Creating Supabase Edge Function payment:', data);

      // Get current user to verify authentication
      const { data: authUser, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authUser.user || authUser.user.id !== data.buyerId) {
        console.error('Auth error:', authError);
        return { success: false, error: 'Authentication error - please log in again' };
      }

      // Call Supabase Edge Function
      const { data: result, error } = await supabase.functions.invoke('create-payment', {
        body: {
          productId: data.productId,
          buyerId: data.buyerId,
          currency: data.currency
        }
      });

      if (error) {
        console.error('Supabase Edge Function error:', error);
        return { 
          success: false, 
          error: error.message || 'Payment creation failed' 
        };
      }

      if (!result.success) {
        console.error('Payment creation failed:', result);
        return { 
          success: false, 
          error: result.error || 'Payment creation failed' 
        };
      }

      console.log('Payment created successfully via Supabase Edge Function:', result);

      return {
        success: true,
        orderId: result.orderId,
        paymentUrl: result.paymentUrl,
      };

    } catch (error) {
      console.error('Supabase Edge Function payment creation error:', error);
      
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Payment creation failed' 
      };
    }
  }

  /**
   * Check payment status directly
   */
  static async checkPaymentStatus(orderId: string): Promise<{ success: boolean; status?: string; error?: string }> {
    try {
      // Get order from database
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderError || !order) {
        return { success: false, error: 'Order not found' };
      }

      // Return current status from database
      return { 
        success: true, 
        status: order.status 
      };

    } catch (error) {
      console.error('Payment status check error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Status check failed' 
      };
    }
  }

  /**
   * Get supported cryptocurrencies
   */
  static getSupportedCurrencies() {
    return SUPPORTED_CURRENCIES;
  }
}