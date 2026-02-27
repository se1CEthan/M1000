import { useEffect } from 'react';
import { Product } from '@/types/database';
import { useAuth } from '@/hooks/useAuth';
import { calculateRevenueSplit } from '@/lib/cryptomus';
import { supabase } from '@/integrations/supabase/clients';
import { toast } from 'sonner';

interface InstantPaymentWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
}

export function InstantPaymentWidget({ isOpen, onClose, product }: InstantPaymentWidgetProps) {
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen && user && product) {
      // Use Cryptomus payment processing with API
      handleCryptomusPayment();
    }
  }, [isOpen, user, product]);

  const handleCryptomusPayment = async () => {
    console.log('🚀 Starting Cryptomus payment creation...');
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
      console.log('📡 Creating Cryptomus payment with API...');
      
      // Calculate revenue split (90% seller, 10% platform)
      const revenueSplit = calculateRevenueSplit(product.price);
      
      console.log('💰 Revenue split:', {
        total: revenueSplit.totalAmount,
        seller: revenueSplit.sellerEarnings,
        platform: revenueSplit.platformFee
      });
      
      // Create order in database first
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          product_id: product.id,
          seller_id: product.seller_id,
          buyer_id: user.id,
          price: product.price,
          platform_fee: revenueSplit.platformFee,
          seller_earnings: revenueSplit.sellerEarnings,
          status: 'pending',
          payment_method: 'cryptomus',
          currency: 'USD'
        })
        .select()
        .single();

      if (orderError || !order) {
        throw new Error('Failed to create order: ' + (orderError?.message || 'Unknown error'));
      }

      console.log('✅ Order created:', order.id);

      // Create Cryptomus payment invoice using API
      const baseUrl = window.location.origin;
      
      // Success URL - redirects to order success page with order ID
      const successUrl = `${baseUrl}/order-success?order_id=${order.id}`;
      const returnUrl = `${baseUrl}/order-success?order_id=${order.id}`;
      const callbackUrl = `${baseUrl}/api/webhooks/cryptomus`;
      
      console.log('🔗 Payment URLs:', {
        success: successUrl,
        return: returnUrl,
        callback: callbackUrl
      });

      const invoiceData = {
        amount: product.price.toString(),
        currency: 'USD',
        order_id: order.id,
        url_return: returnUrl,
        url_success: successUrl,
        url_callback: callbackUrl,
        lifetime: 3600, // 1 hour
        is_payment_multiple: false
      };

      console.log('📋 Creating Cryptomus invoice:', invoiceData);

      // Call our backend API instead of Cryptomus directly (to avoid CORS)
      const apiResponse = await fetch(`${baseUrl}/api/create-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData)
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        throw new Error(errorData.error || 'Failed to create payment');
      }

      const result = await apiResponse.json();

      console.log('📋 Payment API Result:', result);

      if (result.success && result.payment_url) {
        console.log('✅ Cryptomus payment created successfully');
        console.log('🔗 Payment URL:', result.payment_url);
        console.log('💳 Payment UUID:', result.payment_id);

        // Update order with payment details
        await supabase
          .from('orders')
          .update({
            payment_id: result.payment_id,
            payment_url: result.payment_url,
            crypto_currency: result.currency || 'USDT'
          })
          .eq('id', order.id);

        // Store order info for success page
        localStorage.setItem('pendingOrder', JSON.stringify({
          orderId: order.id,
          orderNumber: order.id,
          productTitle: product.title,
          amount: product.price,
          currency: 'USD',
          paymentId: result.payment_id,
          paymentUrl: result.payment_url,
          timestamp: Date.now()
        }));

        // Close modal immediately
        onClose();

        // Show payment redirect toast
        toast.success('Redirecting to Cryptomus payment...', {
          description: 'Pay with cryptocurrency (BTC, ETH, USDT, etc.)',
          duration: 2000
        });

        // Redirect to Cryptomus payment page
        console.log('🚀 Redirecting to Cryptomus payment page...');
        setTimeout(() => {
          window.location.href = result.payment_url;
        }, 1000);

      } else {
        console.log('❌ Cryptomus payment creation failed:', result);
        
        // Update order status to failed
        await supabase
          .from('orders')
          .update({ 
            status: 'failed',
            error_message: result.error || 'Payment invoice creation failed'
          })
          .eq('id', order.id);
        
        throw new Error(result.error || 'Failed to create payment invoice');
      }

    } catch (error: any) {
      console.error('💥 Cryptomus payment creation error:', error);
      console.error('🔍 Error details:', {
        name: error?.name,
        message: error?.message,
        stack: error?.stack
      });
      
      // Specific error messages for Cryptomus
      let errorMessage = 'Payment setup failed. Please try again.';
      
      if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error?.message?.includes('authentication') || error?.message?.includes('signature')) {
        errorMessage = 'Payment service authentication error. Please contact support.';
      } else if (error?.message?.includes('order')) {
        errorMessage = 'Order creation failed. Please try again.';
      } else if (error?.message?.includes('Cryptomus')) {
        errorMessage = 'Cryptomus service temporarily unavailable. Please try again later.';
      }
      
      toast.error(errorMessage, {
        description: 'If the problem persists, please contact support.'
      });
      onClose();
    }
  };

  // This component doesn't render anything - it's purely functional
  return null;
}