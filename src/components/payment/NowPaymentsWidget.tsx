import { useEffect } from 'react';
import { Product } from '@/types/database';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/clients';
import { toast } from 'sonner';

interface NowPaymentsWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
}

export function NowPaymentsWidget({ isOpen, onClose, product }: NowPaymentsWidgetProps) {
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen && user && product) {
      handlePayment();
    }
  }, [isOpen, user, product]);

  const handlePayment = async () => {
    console.log('🚀 Starting NowPayments payment...');
    
    if (!user) {
      toast.error('Please log in to purchase');
      onClose();
      return;
    }

    if (user.id === product.seller_id) {
      toast.error('Cannot purchase your own product');
      onClose();
      return;
    }

    try {
      // Create order first
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          buyer_id: user.id,
          product_id: product.id,
          seller_id: product.seller_id,
          amount: product.price,
          currency: 'USD',
          status: 'pending',
          payment_status: 'pending',
          order_number: `ORD-${Date.now()}`,
        })
        .select()
        .single();

      if (orderError || !order) {
        throw new Error('Failed to create order');
      }

      console.log('✅ Order created:', order.id);

      // Call edge function to create payment
      const { data: result, error: functionError } = await supabase.functions.invoke(
        'create-nowpayments-payment',
        {
          body: {
            amount: product.price,
            currency: 'USD',
            order_id: order.id,
            product_id: product.id,
            seller_id: product.seller_id,
            buyer_email: user.email,
          },
        }
      );

      if (functionError) {
        throw new Error(functionError.message || 'Failed to create payment');
      }

      if (result.success && result.payment_url) {
        console.log('✅ Payment created, redirecting...');
        window.location.href = result.payment_url;
      } else {
        throw new Error(result.error || 'Failed to create payment');
      }
    } catch (error: any) {
      console.error('❌ Payment error:', error);
      toast.error(error.message || 'Failed to create payment');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background p-6 rounded-lg max-w-md w-full">
        <h3 className="text-lg font-semibold mb-4">Processing Payment...</h3>
        <p className="text-muted-foreground">
          Redirecting you to secure payment page...
        </p>
      </div>
    </div>
  );
}
