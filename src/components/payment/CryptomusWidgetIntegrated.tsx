import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/clients';
import { Product } from '@/types/database';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { calculateRevenueSplit } from '@/lib/cryptomus';

interface CryptomusWidgetIntegratedProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onSuccess?: (orderId: string) => void;
}

export function CryptomusWidgetIntegrated({ 
  isOpen, 
  onClose, 
  product, 
  onSuccess 
}: CryptomusWidgetIntegratedProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [widgetUrl, setWidgetUrl] = useState('');
  const [error, setError] = useState('');

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setLoading(false);
      setOrderId('');
      setWidgetUrl('');
      setError('');
    }
  }, [isOpen]);

  const createOrderAndWidget = async () => {
    if (!user) {
      toast.error('Please log in to make a purchase');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // 1. Check if user already owns this product
      const { data: existingOrder } = await supabase
        .from('orders')
        .select('id')
        .eq('buyer_id', user.id)
        .eq('product_id', product.id)
        .eq('status', 'paid')
        .single();

      if (existingOrder) {
        setError('You already own this product');
        setLoading(false);
        return;
      }

      // 2. Calculate revenue split
      const revenueSplit = calculateRevenueSplit(product.price);

      // 3. Create order record
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      
      const orderData = {
        buyer_id: user.id,
        seller_id: product.seller_id,
        product_id: product.id,
        order_number: orderNumber,
        status: 'pending' as const,
        price: product.price,
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
        throw new Error(orderError?.message || 'Failed to create order');
      }

      setOrderId(order.id);

      // 4. Create widget URL with order ID
      // You'll need to get this from your Cryptomus dashboard
      const baseWidgetUrl = 'https://pay.cryptomus.com/widget/d39cd7e9-6660-4a68-ba36-557cdb52b1d6';
      const widgetWithOrder = `${baseWidgetUrl}?order_id=${order.id}&amount=${product.price}&currency=USD`;
      
      setWidgetUrl(widgetWithOrder);
      toast.success('Payment ready! Complete your purchase in the widget below.');

    } catch (error) {
      console.error('Order creation error:', error);
      setError(error instanceof Error ? error.message : 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
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
              <span>{product.title}</span>
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

          {/* Loading State */}
          {loading && (
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground">Setting up your payment...</p>
            </div>
          )}

          {/* Widget or Setup Button */}
          {!widgetUrl && !loading && (
            <div className="space-y-3">
              <Button 
                onClick={createOrderAndWidget} 
                className="w-full"
                size="lg"
              >
                Start Payment Process
              </Button>
              
              <Button variant="outline" onClick={handleClose} className="w-full">
                Cancel
              </Button>
            </div>
          )}

          {/* Cryptomus Widget */}
          {widgetUrl && (
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                <p className="text-sm text-green-700 dark:text-green-300">
                  Order created! Complete your payment below. You'll be redirected to the success page after payment.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Order ID: <span className="font-mono">{orderId}</span>
                </p>
              </div>

              {/* Cryptomus Widget Iframe */}
              <div className="border rounded-lg overflow-hidden">
                <iframe
                  src={widgetUrl}
                  width="100%"
                  height="372"
                  frameBorder="0"
                  title="Cryptomus Payment Widget"
                  className="w-full"
                />
              </div>

              <Button variant="outline" onClick={handleClose} className="w-full">
                Close
              </Button>
            </div>
          )}

          {/* Info */}
          <div className="text-xs text-muted-foreground text-center space-y-1">
            <p>• Secure payment powered by Cryptomus</p>
            <p>• Supports Bitcoin, Ethereum, USDT, and more</p>
            <p>• Download available immediately after confirmation</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}