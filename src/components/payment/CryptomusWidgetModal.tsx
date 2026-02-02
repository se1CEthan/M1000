import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';
import { CryptomusWidgetService } from '@/lib/cryptomus-widget';
import { Product } from '@/types/database';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface CryptomusWidgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onSuccess?: (orderId: string) => void;
}

type PaymentStep = 'setup' | 'widget' | 'processing' | 'success' | 'error';

export function CryptomusWidgetModal({ 
  isOpen, 
  onClose, 
  product, 
  onSuccess 
}: CryptomusWidgetModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<PaymentStep>('setup');
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [widgetUrl, setWidgetUrl] = useState('');
  const [error, setError] = useState('');

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('setup');
      setLoading(false);
      setOrderId('');
      setWidgetUrl('');
      setError('');
    }
  }, [isOpen]);

  // Poll order status when processing
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (step === 'processing' && orderId) {
      interval = setInterval(async () => {
        try {
          const result = await CryptomusWidgetService.getOrderStatus(orderId);
          if (result.success && result.status) {
            if (result.status === 'paid') {
              setStep('success');
              toast.success('Payment confirmed! Your download is ready.');
              onSuccess?.(orderId);
              clearInterval(interval);
            } else if (result.status === 'failed') {
              setStep('error');
              setError('Payment failed or was cancelled');
              clearInterval(interval);
            }
          }
        } catch (error) {
          console.error('Error checking order status:', error);
        }
      }, 5000); // Check every 5 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, orderId, onSuccess]);

  const handleCreatePayment = async () => {
    if (!user) {
      toast.error('Please log in to make a purchase');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const result = await CryptomusWidgetService.createWidgetPayment({
        productId: product.id,
        buyerId: user.id,
        amount: product.price,
        description: product.title
      });

      if (result.success && result.widgetUrl && result.orderId) {
        setOrderId(result.orderId);
        setWidgetUrl(result.widgetUrl);
        setStep('widget');
        toast.success('Payment ready! Complete your purchase in the widget.');
      } else {
        setError(result.error || 'Failed to create payment');
        setStep('error');
      }
    } catch (error) {
      console.error('Payment creation error:', error);
      setError('An unexpected error occurred');
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentStarted = () => {
    setStep('processing');
    toast.info('Payment in progress... Please complete the payment in the widget.');
  };

  const handleClose = () => {
    onClose();
  };

  const renderStep = () => {
    switch (step) {
      case 'setup':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Cryptocurrency Payment</h3>
              <p className="text-muted-foreground">
                Pay securely with Bitcoin, Ethereum, USDT, and other cryptocurrencies
              </p>
            </div>

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

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={handleCreatePayment} 
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  'Continue to Payment'
                )}
              </Button>
            </div>
          </div>
        );

      case 'widget':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Complete Your Payment</h3>
              <p className="text-muted-foreground text-sm">
                Use the widget below to complete your cryptocurrency payment
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Order created! Complete your payment in the widget below.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Order ID: <span className="font-mono">{orderId}</span>
              </p>
            </div>

            {/* Cryptomus Widget */}
            <div className="border rounded-lg overflow-hidden bg-white">
              <iframe
                src={widgetUrl}
                width="100%"
                height="372"
                frameBorder="0"
                title="Cryptomus Payment Widget"
                className="w-full"
              />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Close
              </Button>
              <Button onClick={handlePaymentStarted} className="flex-1">
                I've Started Payment
              </Button>
            </div>
          </div>
        );

      case 'processing':
        return (
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <h3 className="text-lg font-semibold">Processing Payment</h3>
            <p className="text-muted-foreground">
              We're waiting for blockchain confirmation. This usually takes a few minutes.
            </p>
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="text-sm">
                <div className="flex justify-between mb-1">
                  <span>Order ID:</span>
                  <span className="font-mono">{orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="text-yellow-600">Processing...</span>
                </div>
              </div>
            </div>
            <Button variant="outline" onClick={handleClose} className="w-full">
              Close (Payment will continue in background)
            </Button>
          </div>
        );

      case 'success':
        return (
          <div className="text-center space-y-4">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
            <h3 className="text-lg font-semibold">Payment Successful!</h3>
            <p className="text-muted-foreground">
              Your payment has been confirmed. You can now access your product.
            </p>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <p className="text-sm text-green-700 dark:text-green-300">
                Your download is ready! Check your email or visit the order success page.
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Close
              </Button>
              <Button asChild className="flex-1">
                <a href={`/order-success?order=${orderId}`} target="_blank">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Order
                </a>
              </Button>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 mx-auto text-red-500" />
            <h3 className="text-lg font-semibold">Payment Error</h3>
            <p className="text-muted-foreground">
              {error || 'An error occurred while processing your payment.'}
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Close
              </Button>
              <Button onClick={() => setStep('setup')} className="flex-1">
                Try Again
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Secure Cryptocurrency Payment</DialogTitle>
        </DialogHeader>
        {renderStep()}
      </DialogContent>
    </Dialog>
  );
}