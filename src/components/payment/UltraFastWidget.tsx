import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, AlertCircle } from 'lucide-react';
import { Product } from '@/types/database';
import { useAuth } from '@/hooks/useAuth';
import { UltraFastPayment } from '@/lib/ultra-fast-payment';
import { toast } from 'sonner';

interface UltraFastWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onSuccess?: (orderId: string) => void;
}

export function UltraFastWidget({ isOpen, onClose, product, onSuccess }: UltraFastWidgetProps) {
  const { user } = useAuth();
  const [widgetUrl, setWidgetUrl] = useState('');
  const [orderId, setOrderId] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Ultra-fast payment initiation
  const initiatePayment = useCallback(async () => {
    if (!user) {
      setError('Please log in to make a purchase');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Call backend to create Cryptomus invoice
      const response = await fetch('/api/payment/create-cryptomus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productId: product.id,
          buyerId: user.id,
          currency: 'USDT' // or allow user to select
        })
      });
      const result = await response.json();

      if (result.success && result.paymentUrl && result.orderId) {
        setWidgetUrl(result.paymentUrl);
        setOrderId(result.orderId);
        toast.success(`Ready to pay $${product.price} for ${product.title}`);
      } else {
        setError(result.error || 'Failed to create payment');
      }
    } catch (error) {
      setError('Payment setup failed');
      console.error('Payment error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, product]);

  // Auto-initiate when modal opens
  useEffect(() => {
    if (isOpen && !widgetUrl && !error && !isLoading) {
      initiatePayment();
    }
  }, [isOpen, widgetUrl, error, isLoading, initiatePayment]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setWidgetUrl('');
      setOrderId('');
      setError('');
      setIsLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-lg p-0 gap-0 max-h-[90vh] overflow-hidden">
        {/* Close Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="absolute right-2 top-2 z-20 h-8 w-8 p-0 bg-white/90 hover:bg-white shadow-sm"
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Error State */}
        {error && (
          <div className="p-4 space-y-4">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={initiatePayment} className="flex-1" disabled={isLoading}>
                Try Again
              </Button>
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Widget */}
        {widgetUrl && (
          <div className="w-full relative">
            {/* Mobile header */}
            <div className="sm:hidden bg-primary text-primary-foreground p-3 text-center text-sm font-medium">
              Pay ${product.price} • {product.title}
            </div>
            
            {/* Widget iframe */}
            <iframe
              src={widgetUrl}
              className="w-full border-0 block"
              style={{ 
                height: 'clamp(350px, 50vh, 500px)',
                minHeight: '350px',
                maxHeight: '500px'
              }}
              title={`Pay $${product.price} - ${product.title}`}
              allow="payment"
              loading="eager"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation"
            />

            {/* Mobile footer */}
            <div className="sm:hidden bg-muted/50 p-2 text-center border-t">
              <p className="text-xs text-muted-foreground">
                Secure payment • #{orderId.slice(-6)}
              </p>
            </div>
          </div>
        )}

        {/* Loading placeholder */}
        {isLoading && !widgetUrl && !error && (
          <div className="flex items-center justify-center p-8 min-h-[300px]">
            <div className="text-center space-y-2">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-sm font-medium">Loading payment...</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}


//Man that club hasn't been the same since we lost mercedes