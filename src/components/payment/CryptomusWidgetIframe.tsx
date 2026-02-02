import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { Product } from '@/types/database';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/clients';
import { toast } from 'sonner';

interface CryptomusWidgetIframeProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onSuccess?: (orderId: string) => void;
}

export function CryptomusWidgetIframe({ isOpen, onClose, product, onSuccess }: CryptomusWidgetIframeProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showWidget, setShowWidget] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [error, setError] = useState('');

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setLoading(false);
      setShowWidget(false);
      setOrderId('');
      setError('');
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

  const handleInitiatePayment = async () => {
    setError('');
    setLoading(true);

    try {
      // Create order in database
      const order = await createOrder();
      setOrderId(order.id);
      setShowWidget(true);

      toast.success('Payment ready! Complete your cryptocurrency payment in the widget below.');
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

  const handleOpenInNewTab = () => {
    window.open('https://pay.cryptomus.com/widget/1135f505-133e-474f-b56f-0f56ad44158d', '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Cryptocurrency Payment</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Product Info */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">Product:</span>
              <span className="text-right">{product.title}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">Price:</span>
              <span className="text-lg font-bold">${product.price}</span>
            </div>
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>Platform fee (10%):</span>
              <span>${(product.price * 0.1).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>Seller receives (90%):</span>
              <span>${(product.price * 0.9).toFixed(2)}</span>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          )}

          {/* Payment Widget or Initiate Button */}
          {!showWidget ? (
            <div className="space-y-3">
              <Button 
                onClick={handleInitiatePayment} 
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Setting up payment...
                  </>
                ) : (
                  'Pay with Cryptocurrency'
                )}
              </Button>
              
              <Button variant="outline" onClick={handleClose} className="w-full">
                Cancel
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Order Info */}
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <p className="text-sm text-green-700 dark:text-green-300 mb-2">
                  Payment ready! Complete your payment in the widget below.
                </p>
                <div className="text-xs text-muted-foreground">
                  Order ID: <span className="font-mono">{orderId}</span>
                </div>
              </div>

              {/* Cryptomus Widget Iframe */}
              <div className="border rounded-lg overflow-hidden bg-white">
                <iframe
                  src="https://pay.cryptomus.com/widget/1135f505-133e-474f-b56f-0f56ad44158d"
                  height="372px"
                  width="100%"
                  style={{ border: 'none', minWidth: '440px' }}
                  title="Cryptomus Payment Widget"
                  allow="payment"
                />
              </div>

              {/* Widget Actions */}
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleOpenInNewTab}
                  className="flex-1"
                  size="sm"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open in New Tab
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleClose}
                  className="flex-1"
                  size="sm"
                >
                  Close
                </Button>
              </div>

              {/* Payment Info */}
              <div className="text-xs text-muted-foreground text-center space-y-1">
                <p>• After payment, you'll be redirected to the success page</p>
                <p>• Download will be available immediately</p>
                <p>• Check your email for order confirmation</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}