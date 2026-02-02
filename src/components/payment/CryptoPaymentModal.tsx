import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, ExternalLink, CheckCircle, XCircle, Clock } from 'lucide-react';
import { SimpleCryptomusPayment } from '@/lib/simple-cryptomus-payment';
import { SUPPORTED_CURRENCIES } from '@/lib/cryptomus';
import { Product } from '@/types/database';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface CryptoPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onSuccess?: (orderId: string) => void;
}

type PaymentStep = 'currency' | 'processing' | 'payment' | 'confirming' | 'success' | 'failed';

export function CryptoPaymentModal({ isOpen, onClose, product, onSuccess }: CryptoPaymentModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<PaymentStep>('currency');
  const [selectedCurrency, setSelectedCurrency] = useState('USDT');
  const [paymentUrl, setPaymentUrl] = useState('');
  const [orderId, setOrderId] = useState('');
  const [error, setError] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('currency');
      setSelectedCurrency('USDT');
      setPaymentUrl('');
      setOrderId('');
      setError('');
      setPaymentStatus('');
    }
  }, [isOpen]);

  const handleInitiatePayment = async () => {
    if (!user) {
      toast.error('Please log in to make a purchase');
      return;
    }

    setError('');
    setStep('processing');

    try {
      const result = await SimpleCryptomusPayment.createPayment({
        productId: product.id,
        buyerId: user.id,
        currency: selectedCurrency,
      });

      if (result.success && result.paymentUrl && result.orderId) {
        setOrderId(result.orderId);
        setPaymentUrl(result.paymentUrl);
        
        // Close modal and redirect directly to Cryptomus
        onClose();
        toast.success('Redirecting to Cryptomus for secure payment...');
        
        // Redirect to Cryptomus payment page
        window.location.href = result.paymentUrl;
      } else {
        setError(result.error || 'Failed to initiate payment');
        setStep('failed');
      }
    } catch (error) {
      console.error('Payment initiation error:', error);
      setError('An unexpected error occurred');
      setStep('failed');
    }
  };

  const handlePaymentComplete = () => {
    setStep('confirming');
    toast.info('Payment submitted! Waiting for blockchain confirmation...');
  };

  const handleClose = () => {
    onClose();
  };

  const renderStep = () => {
    switch (step) {
      case 'currency':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Select Payment Currency</h3>
              <p className="text-muted-foreground">
                Choose your preferred cryptocurrency for payment
              </p>
            </div>

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

            <div className="space-y-3">
              <label className="text-sm font-medium">Payment Currency</label>
              <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_CURRENCIES.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      <div className="flex items-center gap-2">
                        <span>{currency.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {currency.network}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleInitiatePayment} className="flex-1">
                Continue to Payment
              </Button>
            </div>
          </div>
        );

      case 'processing':
        return (
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <h3 className="text-lg font-semibold">Setting up secure payment...</h3>
            <p className="text-muted-foreground">
              Connecting to Cryptomus payment gateway via secure server
            </p>
          </div>
        );

      case 'payment':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Complete Payment</h3>
              <p className="text-muted-foreground">
                Click the button below to complete your payment with {selectedCurrency}
              </p>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">Product:</span>
                <span>{product.title}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">Amount:</span>
                <span className="text-lg font-bold">${product.price}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Currency:</span>
                <Badge>{selectedCurrency}</Badge>
              </div>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={() => window.open(paymentUrl, '_blank')} 
                className="w-full"
                size="lg"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Pay with {selectedCurrency}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handlePaymentComplete}
                className="w-full"
              >
                I've completed the payment
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              You will be redirected to Cryptomus to complete the payment securely
            </p>
          </div>
        );

      case 'confirming':
        return (
          <div className="text-center space-y-4">
            <Clock className="h-12 w-12 mx-auto text-yellow-500" />
            <h3 className="text-lg font-semibold">Confirming Payment</h3>
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
                  <Badge variant="outline">{paymentStatus || 'Pending'}</Badge>
                </div>
              </div>
            </div>
          </div>
        );

      case 'success':
        return (
          <div className="text-center space-y-4">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
            <h3 className="text-lg font-semibold">Payment Successful!</h3>
            <p className="text-muted-foreground">
              Your payment has been confirmed. You can now download your product.
            </p>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <p className="text-sm text-green-700 dark:text-green-300">
                A download link has been sent to your email and is available in your order history.
              </p>
            </div>
            <Button onClick={handleClose} className="w-full">
              Continue
            </Button>
          </div>
        );

      case 'failed':
        return (
          <div className="text-center space-y-4">
            <XCircle className="h-12 w-12 mx-auto text-red-500" />
            <h3 className="text-lg font-semibold">Payment Failed</h3>
            <p className="text-muted-foreground">
              {error || 'Your payment could not be processed. Please try again.'}
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Close
              </Button>
              <Button onClick={() => setStep('currency')} className="flex-1">
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cryptocurrency Payment</DialogTitle>
        </DialogHeader>
        {renderStep()}
      </DialogContent>
    </Dialog>
  );
}