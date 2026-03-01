import { useEffect } from 'react';
import { Product } from '@/types/database';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/clients';
import { toast } from 'sonner';

interface InstantPaymentWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
}

/**
 * Cryptomus Payment Widget
 * 
 * Flow:
 * 1️⃣ User clicks Buy
 * 2️⃣ Create order in database (status: pending)
 * 3️⃣ Redirect user to Cryptomus payment page
 * 4️⃣ Cryptomus sends webhook when payment confirmed
 * 5️⃣ Backend marks order as PAID
 * 6️⃣ User returns to success page
 * 7️⃣ Success page checks if order is paid
 * 8️⃣ THEN unlock download
 */
export function InstantPaymentWidget({ isOpen, onClose, product }: InstantPaymentWidgetProps) {
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen && user && product) {
      handleCryptomusPayment();
    }
  }, [isOpen, user, product]);

  const handleCryptomusPayment = async () => {
    console.log('🚀 Starting Cryptomus payment flow...');
    console.log('👤 User:', user?.id, user?.email);
    console.log('📦 Product:', product?.id, product?.title, product?.price);

    if (!user) {
      console.log('❌ No user found');
      toast.error('Please log in to purchase');
      onClose();
      return;
    }

    if (user.id === product.seller_id) {
      console.log('❌ User trying to buy own product');
      toast.error('Cannot purchase your own product');
      onClose();
      return;
    }

    try {
      // STEP 2: Create order in YOUR database
      console.log('📝 Step 2: Creating order in database...');
      
      // Validate product price
      if (!product.price || product.price <= 0) {
        throw new Error('Invalid product price');
      }
      
      // Calculate revenue split (90% seller, 10% platform)
      const price = Number(product.price);
      const sellerEarnings = price * 0.9;
      const platformFee = price * 0.1;
      
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          product_id: product.id,
          seller_id: product.seller_id,
          buyer_id: user.id,
          price: price,
          platform_fee: platformFee,
          seller_earnings: sellerEarnings,
          currency: 'USD',
          status: 'pending',
          payment_status: 'pending',
          payment_method: 'cryptomus',
          order_number: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        })
        .select()
        .single();

      if (orderError || !order) {
        throw new Error('Failed to create order: ' + (orderError?.message || 'Unknown error'));
      }

      console.log('✅ Order created in database:', order.id, order.order_number);

      // STEP 3: Create Cryptomus payment and redirect
      console.log('💳 Step 3: Creating Cryptomus payment invoice...');
      
      const baseUrl = window.location.origin;
      
      // Success/Return URLs - where user returns after payment
      const successUrl = `${baseUrl}/order-success?order_id=${order.id}`;
      const returnUrl = `${baseUrl}/order-success?order_id=${order.id}`;
      
      console.log('🔗 Payment URLs:', {
        success: successUrl,
        return: returnUrl
      });

      const invoiceData = {
        amount: product.price,
        currency: 'USD',
        order_id: order.id,
        url_return: returnUrl,
        url_success: successUrl,
        url_callback: webhookUrl,
      };

      console.log('📋 Invoice data:', invoiceData);

      // Call Supabase Edge Function to create Cryptomus payment
      const { data: result, error: functionError } = await supabase.functions.invoke(
        'create-cryptomus-payment',
        {
          body: invoiceData,
        }
      );

      if (functionError) {
        console.error('❌ Edge function error:', functionError);
        throw new Error(functionError.message || 'Failed to create payment');
      }

      console.log('📨 Cryptomus response:', result);

      if (result.success && result.payment_url) {
        console.log('✅ Payment invoice created successfully');
        console.log('🔗 Payment URL:', result.payment_url);
        console.log('💳 Payment ID:', result.payment_id);

        // Update order with payment details
        await supabase
          .from('orders')
          .update({
            cryptomus_payment_id: result.payment_id,
            payment_url: result.payment_url,
          })
          .eq('id', order.id);

        // Store order info for success page
        localStorage.setItem('pendingOrder', JSON.stringify({
          orderId: order.id,
          orderNumber: order.order_number,
          productTitle: product.title,
          amount: product.price,
          currency: 'USD',
          paymentId: result.payment_id,
          paymentUrl: result.payment_url,
          timestamp: Date.now()
        }));

        // Close modal
        onClose();

        // Show redirect message
        toast.success('Redirecting to Cryptomus payment...', {
          description: 'Pay with cryptocurrency (BTC, ETH, USDT, etc.)',
          duration: 2000
        });

        // STEP 3: Redirect to Cryptomus payment page
        console.log('🚀 Redirecting to Cryptomus payment page...');
        setTimeout(() => {
          window.location.href = result.payment_url;
        }, 1000);

      } else {
        console.error('❌ Failed to create payment invoice:', result);
        
        // Update order status to failed
        await supabase
          .from('orders')
          .update({ 
            status: 'failed',
            payment_status: 'failed',
          })
          .eq('id', order.id);
        
        throw new Error(result.error || 'Failed to create payment invoice');
      }

    } catch (error: any) {
      console.error('💥 Payment error:', error);
      
      toast.error(error.message || 'Failed to create payment', {
        description: 'Please try again or contact support.'
      });
      onClose();
    }
  };

  // This component doesn't render anything - it's purely functional
  // It just handles the payment flow and redirects
  return null;
}