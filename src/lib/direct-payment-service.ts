import { supabase } from '@/integrations/supabase/clients';
import { SUPPORTED_CURRENCIES } from './cryptomus';

export interface DirectPaymentData {
  productId: string;
  buyerId: string;
  currency: string;
}

export interface DirectPaymentResult {
  success: boolean;
  orderId?: string;
  paymentUrl?: string;
  error?: string;
}

export class DirectPaymentService {
  /**
   * Create order and get direct Cryptomus payment URL via API
   */
  static async createDirectPayment(data: DirectPaymentData): Promise<DirectPaymentResult> {
    try {
      console.log('Creating direct payment for:', data);

      // Get current user info
      const { data: authUser, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authUser.user || authUser.user.id !== data.buyerId) {
        console.error('Auth user mismatch or error:', authError);
        return { success: false, error: 'Authentication error - please log in again' };
      }

      // Get product details
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

      // Call the secure API endpoint to create payment
      const apiResponse = await fetch('/api/cryptomus/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: data.productId,
          amount: product.price,
          currency: 'USD',
          toCurrency: data.currency,
          buyerId: authUser.user.id,
          returnUrl: `${window.location.origin}/order-success`,
          successUrl: `${window.location.origin}/order-success`,
          callbackUrl: `${window.location.origin}/api/webhooks/cryptomus`
        }),
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json().catch(() => ({ error: 'Unknown API error' }));
        console.error('API response error:', errorData);
        return { success: false, error: errorData.error || 'Failed to create payment invoice' };
      }

      const paymentResponse = await apiResponse.json();
      console.log('Payment API response:', paymentResponse);

      if (!paymentResponse.success || paymentResponse.state !== 0) {
        console.error('Payment creation failed:', paymentResponse);
        return { success: false, error: paymentResponse.error || 'Failed to create payment invoice' };
      }

      console.log('Direct payment created successfully');

      return {
        success: true,
        orderId: paymentResponse.result.orderId,
        paymentUrl: paymentResponse.result.paymentUrl || paymentResponse.result.url,
      };

    } catch (error) {
      console.error('Direct payment creation error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Check payment status via API
   */
  static async checkPaymentStatus(orderId: string): Promise<{ success: boolean; status?: string; error?: string }> {
    try {
      const response = await fetch('/api/cryptomus/check-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown API error' }));
        console.error('Status API error:', errorData);
        return { success: false, error: 'Failed to check payment status' };
      }

      const result = await response.json();

      if (!result.success || result.state !== 0) {
        return { success: false, error: result.error || 'Failed to check payment status' };
      }

      return { 
        success: true, 
        status: result.result.status 
      };

    } catch (error) {
      console.error('Payment status check error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
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