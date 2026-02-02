import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, X } from 'lucide-react';
import { Product } from '@/types/database';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/clients';
import { toast } from 'sonner';

interface CryptomusWidgetOnlyProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onSuccess?: (orderId: string) => void;
}

export function CryptomusWidgetOnly({ isOpen, onClose, product, onSuccess }: CryptomusWidgetOnlyProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showWidget, setShowWidget] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [error, setError] = useState('');
  const [widgetUrl, setWidgetUrl] = useState('');

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setLoading(false);
      setShowWidget(false);
      setOrderId('');
      setError('');
      setWidgetUrl('');
    }
  }, [isOpen]);

  // Auto-initiate payment when modal opens
  useEffect(() => {
    if (isOpen && !showWidget && !loading && !error) {
      handleInitiatePayment();
    }
  }, [isOpen]);

  const createOrder = async () => {
    if (!user) {
      throw new Error('Please log in to make a purchase');
    }

    // Check if user already owns this product
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id')
      .eq('buyer_id', user.id)
      .eq('product_id', product.id)
      .eq('status', 'paid')
      .single();

    if (existingOrder) {
      throw new Error('You already own this product');
    }

    // Calculate revenue split
    const price = product.price;
    const platformFee = price * 0.1;
    const sellerEarnings = price * 0.9;

    // Create order in database
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        buyer_id: user.id,
        seller_id: product.seller_id,
        product_id: product.id,
        order_number: orderNumber,
        status: 'pending',
        price: price,
        platform_fee: platformFee,
        seller_earnings: sellerEarnings,
        payment_method: 'cryptocurrency',
        currency: 'USD',
        crypto_currency: 'USDT'
      })
      .select()
      .single();

    if (orderError || !order) {
      throw new Error('Failed to create order');
    }

    return order;
  };

  const generateDynamicWidgetUrl = (orderId: string, amount: number) => {
    const baseUrl = 'https://pay.cryptomus.com/widget/1135f505-133e-474f-b56f-0f56ad44158d';
    
    // Add dynamic parameters for exact amount and order tracking
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

    return `${baseUrl}?${params.toString()}`;
  };

  const handleInitiatePayment = async () => {
    if (!user) {
      setError('Please log in to make a purchase');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Create order in database
      const order = await createOrder();
      setOrderId(order.id);
      
      // Generate dynamic widget URL with exact product price
      const dynamicUrl = generateDynamicWidgetUrl(order.id, product.price);
      setWidgetUrl(dynamicUrl);
      
      setShowWidget(true);
      toast.success(`Payment ready! Pay exactly $${product.price} for ${product.title}`);
    } catch (error) {
      console.error('Payment initiation error:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-lg p-0 gap-0 max-h-[90vh] overflow-hidden">
        {/* Close Button */}
        <div className="absolute right-2 top-2 z-20">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-8 w-8 p-0 bg-white/90 hover:bg-white shadow-sm"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center p-8 space-y-4 min-h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <div className="text-center space-y-2">
              <p className="text-sm font-medium">Setting up payment...</p>
              <p className="text-xs text-muted-foreground">
                Amount: ${product.price} for {product.title}
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-4 sm:p-6 space-y-4">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={handleInitiatePayment} className="flex-1">
                Try Again
              </Button>
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Cryptomus Widget */}
        {showWidget && (
          <div className="w-full relative">
            {/* Product Info Bar - Mobile */}
            <div className="sm:hidden bg-primary text-primary-foreground p-3 text-center text-sm font-medium">
              Pay ${product.price} for {product.title}
            </div>
            
            {/* Widget Container */}
            <div className="relative w-full overflow-hidden">
              <iframe
                src={widgetUrl}
                className="w-full border-0 block"
                style={{ 
                  height: 'clamp(350px, 50vh, 500px)',
                  minHeight: '350px',
                  maxHeight: '500px'
                }}
                title={`Pay $${product.price} - Cryptomus Payment`}
                allow="payment"
                loading="eager"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation"
              />
            </div>

            {/* Mobile Payment Info */}
            <div className="sm:hidden bg-muted/50 p-3 text-center border-t">
              <p className="text-xs text-muted-foreground">
                Secure payment • Order #{orderId.slice(-8)}
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}