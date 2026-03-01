import { useState, useEffect, useCallback, useMemo } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, X } from 'lucide-react';
import { Product } from '@/types/database';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/clients';
import { toast } from 'sonner';

interface CryptomusWidgetFastProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onSuccess?: (orderId: string) => void;
}

// Cache for order creation to avoid duplicate requests
const orderCache = new Map<string, Promise<any>>();

export function CryptomusWidgetFast({ isOpen, onClose, product, onSuccess }: CryptomusWidgetFastProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showWidget, setShowWidget] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [error, setError] = useState('');

  // Pre-generate widget URL for instant loading
  const widgetUrl = useMemo(() => {
    if (!orderId) return '';
    
    const params = new URLSearchParams({
      order_id: orderId,
      amount: product.price.toString(),
      currency: 'USD',
      to_currency: 'USDT',
      url_success: `https://seltech.online/order-success?order=${orderId}`,
      url_return: 'https://seltech.online/marketplace',
      url_callback: 'https://rtsaarapvlzzinmpjdys.supabase.co/functions/v1/cryptomus-webhook',
      is_payment_multiple: 'false',
      lifetime: '3600'
    });

    return `https://pay.cryptomus.com/widget/1135f505-133e-474f-b56f-0f56ad44158d?${params.toString()}`;
  }, [orderId, product.price]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setLoading(false);
      setShowWidget(false);
      setOrderId('');
      setError('');
    }
  }, [isOpen]);

  // Optimized order creation with caching
  const createOrderOptimized = useCallback(async () => {
    if (!user) {
      throw new Error('Please log in to make a purchase');
    }

    // Validate product price
    if (typeof product.price !== 'number' || isNaN(product.price) || product.price <= 0) {
      throw new Error('Invalid product price. Please contact support.');
    }

    const cacheKey = `${user.id}-${product.id}`;
    
    // Check cache first
    if (orderCache.has(cacheKey)) {
      return await orderCache.get(cacheKey);
    }

    // Create promise and cache it immediately
    const orderPromise = (async () => {
      // Quick ownership check with minimal data
      const { data: existingOrder } = await supabase
        .from('orders')
        .select('id')
        .eq('buyer_id', user.id)
        .eq('product_id', product.id)
        .eq('status', 'paid')
        .limit(1)
        .single();

      if (existingOrder) {
        throw new Error('You already own this product');
      }

      // Pre-calculate values
      const price = product.price;
      const platformFee = Math.round(price * 10) / 100; // Faster than * 0.1
      const sellerEarnings = price - platformFee;
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

      // Single optimized insert
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
        .select('id')
        .single();

      if (orderError || !order) {
        throw new Error('Failed to create order');
      }

      return order;
    })();

    // Cache the promise
    orderCache.set(cacheKey, orderPromise);
    
    // Clean cache after 5 minutes
    setTimeout(() => orderCache.delete(cacheKey), 300000);

    return await orderPromise;
  }, [user, product]);

  // Ultra-fast payment initiation
  const handleInitiatePayment = useCallback(async () => {
    if (!user) {
      setError('Please log in to make a purchase');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Create order with optimized caching
      const order = await createOrderOptimized();
      
      // Set order ID immediately for URL generation
      setOrderId(order.id);
      
      // Show widget instantly
      setShowWidget(true);
      
      // Success feedback
      toast.success(`Payment ready! Pay $${product.price}`, {
        duration: 2000
      });
      
    } catch (error) {
      console.error('Payment initiation error:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [user, createOrderOptimized, product.price]);

  // Auto-initiate payment when modal opens
  useEffect(() => {
    if (isOpen && !showWidget && !loading && !error && !orderId) {
      handleInitiatePayment();
    }
  }, [isOpen, showWidget, loading, error, orderId, handleInitiatePayment]);

  // Preload widget iframe when order ID is available
  useEffect(() => {
    if (orderId && widgetUrl) {
      // Preload the iframe in the background
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = widgetUrl;
      document.head.appendChild(link);
      
      return () => {
        document.head.removeChild(link);
      };
    }
  }, [orderId, widgetUrl]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-lg p-0 gap-0 max-h-[90vh] overflow-hidden">
        {/* Optimized Close Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClose}
          className="absolute right-2 top-2 z-20 h-8 w-8 p-0 bg-white/90 hover:bg-white shadow-sm"
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Ultra-Fast Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center p-6 space-y-3 min-h-[250px]">
            <div className="relative">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <div className="absolute inset-0 h-6 w-6 border-2 border-primary/20 rounded-full animate-pulse" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-medium">Loading payment...</p>
              <p className="text-xs text-muted-foreground">
                ${product.price} • {product.title}
              </p>
            </div>
          </div>
        )}

        {/* Optimized Error State */}
        {error && (
          <div className="p-4 space-y-3">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleInitiatePayment} size="sm" className="flex-1">
                Retry
              </Button>
              <Button variant="outline" onClick={handleClose} size="sm" className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Lightning-Fast Widget */}
        {showWidget && widgetUrl && (
          <div className="w-full relative">
            {/* Mobile Payment Header */}
            <div className="sm:hidden bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-2 text-center text-sm font-medium">
              Pay ${product.price} • {product.title}
            </div>
            
            {/* Optimized Widget Container */}
            <div className="relative w-full">
              <iframe
                src={widgetUrl}
                className="w-full border-0 block"
                style={{ 
                  height: 'clamp(320px, 45vh, 450px)',
                  minHeight: '320px',
                  maxHeight: '450px'
                }}
                title={`Pay $${product.price} - ${product.title}`}
                allow="payment"
                loading="eager"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation allow-popups-to-escape-sandbox"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>

            {/* Minimal Mobile Footer */}
            <div className="sm:hidden bg-muted/30 px-3 py-2 text-center border-t">
              <p className="text-xs text-muted-foreground">
                Secure • #{orderId.slice(-6)}
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}