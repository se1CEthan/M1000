import { useEffect } from 'react';
import { Product } from '@/types/database';
import { useAuth } from '@/hooks/useAuth';
import { createPesaPalPayment } from '@/lib/pesapal-payment';
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
      // Use PesaPal payment processing
      handlePesaPalPayment();
    }
  }, [isOpen, user, product]);

  const handlePesaPalPayment = async () => {
    console.log('🚀 Starting PesaPal payment creation...');
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
      console.log('📡 Calling createPesaPalPayment API...');
      
      // Convert USD stored price to UGX for payment
      const ugxAmount = Math.round(product.price * 3700);
      
      const result = await createPesaPalPayment({
        productId: product.id,
        sellerId: product.seller_id,
        buyerId: user.id,
        amount: ugxAmount,
        currency: 'UGX',
        productTitle: product.title,
        buyerEmail: user.email
      });

      console.log('📋 PesaPal Result:', result);

      if (result.success && result.paymentUrl && result.orderId) {
        console.log('✅ PesaPal payment created successfully');
        console.log('🔗 Payment URL:', result.paymentUrl);
        console.log('📄 Order ID:', result.orderId);

        // Store order info for success page
        localStorage.setItem('pendingOrder', JSON.stringify({
          orderId: result.orderId,
          orderNumber: result.orderId,
          productTitle: product.title,
          amount: ugxAmount,
          currency: 'UGX',
          trackingId: result.trackingId,
          timestamp: Date.now()
        }));

        // Close modal immediately
        onClose();

        // Show payment method selection toast
        toast.success('Redirecting to PesaPal payment page...', {
          description: 'Choose M-Pesa, Airtel Money, or Card payment'
        });

        // Redirect to PesaPal payment page
        const paymentUrl = `/pesapal-payment?order_id=${result.orderId}&product=${encodeURIComponent(product.title)}&amount=${ugxAmount}`;
        
        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
          console.log('📱 Mobile redirect to:', paymentUrl);
          // Mobile: Direct redirect for better mobile money integration
          window.location.href = paymentUrl;
        } else {
          console.log('💻 Desktop redirect to:', paymentUrl);
          // Desktop: Navigate to payment page
          window.location.href = paymentUrl;
        }

      } else {
        console.log('❌ PesaPal payment creation failed:', result.error);
        throw new Error(result.error || 'Failed to create payment');
      }

    } catch (error) {
      console.error('💥 PesaPal payment creation error:', error);
      console.error('🔍 Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      // Specific error messages for PesaPal
      let errorMessage = 'Payment setup failed. Please try again.';
      
      if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message.includes('authentication') || error.message.includes('token')) {
        errorMessage = 'Payment service authentication error. Please contact support.';
      } else if (error.message.includes('order')) {
        errorMessage = 'Order creation failed. Please try again.';
      } else if (error.message.includes('PesaPal')) {
        errorMessage = 'PesaPal service temporarily unavailable. Please try again later.';
      }
      
      toast.error(errorMessage);
      onClose();
    }
  };

  // This component doesn't render anything - it's purely functional
  return null;
}