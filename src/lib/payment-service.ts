import { supabase } from '@/integrations/supabase/clients';
// Remove all Cryptomus and PesaPal imports
import { supabase } from '@/integrations/supabase/clients';
import { Profile } from '@/types/database';

export interface PaymentInitiationData {
  productId: string;
  buyerId: string;
  currency: string;
  paymentMethod?: 'cryptocurrency' | 'airtel_money';
  phoneNumber?: string; // For Airtel Money
  country?: string; // For Airtel Money
  returnUrl?: string;
  successUrl?: string;
}

export interface PaymentResult {
  success: boolean;
  orderId?: string;
  paymentUrl?: string;
  error?: string;
}

export class PaymentService {
  /**
   * Initiate a payment for a product purchase
   */
  static async initiatePayment(data: PaymentInitiationData): Promise<PaymentResult> {
    try {
      console.log('Initiating payment for:', data);

      // 1. Get product details (without foreign key joins to avoid constraint issues)
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

      // 3. Check if user already owns this product (using auth user ID directly)
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

      // 4. Calculate revenue split (simple 90/10)
      const platformFee = product.price * 0.1;
      const sellerEarnings = product.price * 0.9;

      // 5. Create order record
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      const orderData = {
        buyer_id: authUser.user.id,
        seller_id: product.seller_id,
        product_id: data.productId,
        order_number: orderNumber,
        status: 'pending' as const,
        price: product.price,
        platform_fee: platformFee,
        seller_earnings: sellerEarnings,
        payment_method: 'cryptocurrency',
        currency: 'USD',
        crypto_currency: data.currency
      };

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (orderError || !order) {
        return { success: false, error: 'Failed to create order' };
      }

      // 6. Create NOWPayments invoice
      const nowPaymentsApiKey = 'ZNGD7SV-MD74WZK-QSSY2K5-6CW1K3D';
      const invoiceResponse = await fetch('https://api.nowpayments.io/v1/invoice', {
        method: 'POST',
        headers: {
          'x-api-key': nowPaymentsApiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          price_amount: product.price,
          price_currency: 'usd',
          pay_currency: 'usdt',
          order_id: order.id,
          order_description: product.title,
          success_url: `${window.location.origin}/order-success?order=${order.id}`,
          cancel_url: `${window.location.origin}/marketplace`,
        })
      });
      const invoiceData = await invoiceResponse.json();

      if (!invoiceData.invoice_url) {
        await supabase
          .from('orders')
          .update({ status: 'refunded' as const })
          .eq('id', order.id);
        return { success: false, error: invoiceData.message || 'Failed to create payment invoice' };
      }

      // Optionally update order with invoice info
      await supabase
        .from('orders')
        .update({ payment_id: invoiceData.id })
        .eq('id', order.id);

      return {
        success: true,
        orderId: order.id,
        paymentUrl: invoiceData.invoice_url,
      };

    } catch (error) {
      console.error('Payment initiation error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Check payment status and update order
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

      // Check payment status with NOWPayments
      // You may need to implement a webhook or polling for NOWPayments status
      // For now, just return success if order exists
      return { success: true, status: order.status };

    } catch (error) {
      console.error('Payment status check error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Process seller payout (90% of the sale)
   */
  static async processSellerpayout(orderId: string): Promise<void> {
    try {
      // Get order and seller details
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          seller:profiles!seller_id(*),
          product:products(*)
        `)
        .eq('id', orderId)
        .single();

      if (orderError || !order || !order.seller) {
        console.error('Failed to get order details for payout:', orderError);
        return;
      }

      const seller = order.seller as Profile;

      // Check if seller has a wallet address
      if (!seller.wallet_address) {
        console.error('Seller does not have a wallet address configured');
        // You might want to notify the seller or admin about this
        return;
      }

      // Create payout record
      const { data: payout, error: payoutError } = await supabase
        .from('payouts')
        .insert({
          seller_id: seller.user_id,
          amount: order.seller_earnings,
          wallet_address: seller.wallet_address,
          status: 'pending',
        })
        .select()
        .single();

      if (payoutError || !payout) {
        console.error('Failed to create payout record:', payoutError);
        return;
      }

      // Create Cryptomus payout
      const payoutData = {
        amount: order.seller_earnings.toString(),
        currency: order.crypto_currency || 'USDT',
        network: 'TRC20', // Default to TRC20, you might want to make this configurable
        address: seller.wallet_address,
        order_id: payout.id,
        url_callback: `${window.location.origin}/api/webhooks/cryptomus-payout`,
      };

      const payoutResponse = await createPayout(payoutData);

      if (payoutResponse.state === 0) {
        // Update payout record with transaction details
        await supabase
          .from('payouts')
          .update({
            status: 'processing',
            transaction_hash: payoutResponse.result.txid,
            processed_at: new Date().toISOString(),
          })
          .eq('id', payout.id);

        // Update seller's total earnings
        await supabase
          .from('profiles')
          .update({
            total_earnings: (seller.total_earnings || 0) + order.seller_earnings,
            total_sales: (seller.total_sales || 0) + 1,
          })
          .eq('user_id', seller.user_id);

        console.log(`Payout initiated for seller ${seller.user_id}: $${order.seller_earnings}`);
      } else {
        // Update payout status to failed
        await supabase
          .from('payouts')
          .update({ status: 'failed' })
          .eq('id', payout.id);

        console.error('Failed to create Cryptomus payout:', payoutResponse);
      }

    } catch (error) {
      console.error('Seller payout error:', error);
    }
  }

  /**
   * Generate secure download URL for purchased product
   */
  static async generateDownloadUrl(productId: string): Promise<string> {
    try {
      // Get product file URL
      const { data: product, error } = await supabase
        .from('products')
        .select('file_url')
        .eq('id', productId)
        .single();

      if (error || !product?.file_url) {
        throw new Error('Product file not found');
      }

      // Generate a signed URL that expires in 7 days
      const { data: signedUrl, error: signError } = await supabase.storage
        .from('product-files')
        .createSignedUrl(product.file_url, 7 * 24 * 60 * 60); // 7 days

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

  /**
   * Validate wallet address format (basic validation)
   */
  static validateWalletAddress(address: string, currency: string): boolean {
    if (!address || address.length < 10) return false;

    switch (currency) {
      case 'BTC':
        return /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/.test(address);
      case 'ETH':
      case 'USDT':
      case 'USDC':
        return /^0x[a-fA-F0-9]{40}$/.test(address);
      case 'TRX':
        return /^T[A-Za-z1-9]{33}$/.test(address);
      case 'LTC':
        return /^[LM3][a-km-zA-HJ-NP-Z1-9]{26,33}$|^ltc1[a-z0-9]{39,59}$/.test(address);
      default:
        return true; // Allow other currencies for now
    }
  }
}