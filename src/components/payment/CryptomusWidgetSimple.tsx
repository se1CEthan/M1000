import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, ExternalLink, AlertCircle } from 'lucide-react';
import { Product } from '@/types/database';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/clients';
import { toast } from 'sonner';

interface CryptomusWidgetSimpleProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onSuccess?: (orderId: string) => void;
}

export function CryptomusWidgetSimple({ isOpen, onClose, product, onSuccess }: CryptomusWidgetSimpleProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [widgetUrl, setWidgetUrl] = useState('');
  const [orderId, setOrderId] = useState('');
  const [error, setError] = useState('');

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setLoading(false);
      setWidgetUrl('');
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

  const generateWidgetUrl = (orderId: string) => {
    const baseUrl = 'https://widget.cryptomus.com';
    const merchantId = '6e6c1018-48f4-49fd-a10d-36d6cd70eefe';
    
    // Success URL - where user goes after successful payment
    const successUrl = `${window.location.origin}/order-success?order=${orderId}`;
    const returnUrl = `${window.location.origin}/marketplace`;
    
    const params = new URLSearchParams({
      merchant: merchantId,
      order_id: orderId,
      amount: product.price.toString(),
      currency: 'USD',
      to_currency: 'USDT',
      url_success: successUrl,
      url_return: returnUrl,
      url_callback: 'https://rtsaarapvlzzinmpjdys.supabase.co/functions/v1/cryptomus-webhook',
      is_payment_multiple: 'false',
      lifetime: '3600'
    });

    return `${baseUrl}?${params.toString()}`;
  };

  const handleInitiatePayment = async () => {
    setError('');
    setLoading(true);

    try {
      // Create order in database
      const order = await createOrder();
      setOrderId(order.id);

      // Generate widget URL
      const url = generateWidgetUrl(order.id);
      setWidgetUrl(url);

      toast.success('Payment ready! Complete your cryptocurrency payment.');
    } catch (error) {
      console.error('Payment initiation error:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentRedirect = () => {
    if (widgetUrl) {
      // Close modal and redirect to Cryptomus widget
      onClose();
      window.location.href = widgetUrl;
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
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

          {/* Payment Actions */}
          {!widgetUrl ? (
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
            <div className="space-y-3">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <p className="text-sm text-green-700 dark:text-green-300 mb-3">
                  Payment ready! You will be redirected to Cryptomus widget to complete your payment.
                </p>
                <div className="text-xs text-muted-foreground">
                  Order ID: <span className="font-mono">{orderId}</span>
                </div>
              </div>

              <Button 
                onClick={handlePaymentRedirect}
                className="w-full"
                size="lg"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Complete Payment
              </Button>
              
              <Button variant="outline" onClick={handleClose} className="w-full">
                Cancel
              </Button>
            </div>
          )}

          {/* Info */}
          <div className="text-xs text-muted-foreground text-center space-y-1">
            <p>• Secure payment powered by Cryptomus widget</p>
            <p>• Supports Bitcoin, Ethereum, USDT, and more</p>
            <p>• Download available immediately after confirmation</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}