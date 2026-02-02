/**
 * Secure Crypto Payment Component
 * Custom implementation without widgets - pure API integration
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Loader2, 
  ExternalLink, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Shield, 
  Zap,
  CreditCard,
  ArrowRight
} from 'lucide-react';
import { SUPPORTED_CURRENCIES } from '@/lib/cryptomus';
import { SimpleCryptomusPayment } from '@/lib/simple-cryptomus-payment';
import { Product } from '@/types/database';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface SecureCryptoPaymentProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onSuccess?: (orderId: string) => void;
}

type PaymentStep = 'select' | 'processing' | 'redirect' | 'confirming' | 'success' | 'failed';

interface PaymentData {
  paymentId: string;
  orderId: string;
  paymentUrl: string;
  amount: string;
  currency: string;
  toCurrency: string;
  expiresAt: number;
}

export function SecureCryptoPayment({ isOpen, onClose, product, onSuccess }: SecureCryptoPaymentProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<PaymentStep>('select');
  const [selectedCurrency, setSelectedCurrency] = useState('USDT');
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [error, setError] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(0);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('select');
      setSelectedCurrency('USDT');
      setPaymentData(null);
      setError('');
      setTimeRemaining(0);
    }
  }, [isOpen]);

  // Countdown timer for payment expiry
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (paymentData && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setStep('failed');
            setError('Payment expired. Please try again.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [paymentData, timeRemaining]);

  // Poll payment status when confirming
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (step === 'confirming' && paymentData) {
      interval = setInterval(async () => {
        try {
          const result = await SimpleCryptomusPayment.checkPaymentStatus(paymentData.orderId);
          
          if (result.success && result.status) {
            if (result.status === 'paid') {
              setStep('success');
              toast.success('Payment confirmed! Your download is ready.');
              onSuccess?.(paymentData.orderId);
            } else if (result.status === 'failed') {
              setStep('failed');
              setError('Payment failed or was cancelled');
            }
          }
        } catch (error) {
          console.error('Error checking payment status:', error);
        }
      }, 10000); // Check every 10 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, paymentData, onSuccess]);

  const handleCreatePayment = async () => {
    if (!user) {
      toast.error('Please log in to make a purchase');
      return;
    }

    setError('');
    setStep('processing');

    try {
      // Use the simple direct Cryptomus integration
      const result = await SimpleCryptomusPayment.createPayment({
        productId: product.id,
        buyerId: user.id,
        currency: selectedCurrency,
      });

      if (result.success && result.paymentUrl && result.orderId) {
        setPaymentData({
          paymentId: result.orderId,
          orderId: result.orderId,
          paymentUrl: result.paymentUrl,
          amount: product.price.toString(),
          currency: 'USD',
          toCurrency: selectedCurrency,
          expiresAt: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
        });
        setTimeRemaining(3600); // 1 hour
        setStep('redirect');
      } else {
        setError(result.error || 'Failed to create payment');
        setStep('failed');
      }
    } catch (error) {
      console.error('Payment creation error:', error);
      setError('An unexpected error occurred');
      setStep('failed');
    }
  };

  const handleRedirectToPayment = () => {
    if (paymentData) {
      // Open Cryptomus payment page in new tab
      window.open(paymentData.paymentUrl, '_blank');
      setStep('confirming');
      toast.info('Complete your payment on Cryptomus and return here for confirmation');
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const selectedCrypto = SUPPORTED_CURRENCIES.find(c => c.code === selectedCurrency);

  const renderStep = () => {
    switch (step) {
      case 'select':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <CreditCard className="h-12 w-12 mx-auto text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Secure Crypto Payment</h3>
              <p className="text-muted-foreground">
                Choose your preferred cryptocurrency for secure payment
              </p>
            </div>

            {/* Product Summary */}
            <Card>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-semibold">{product.title}</h4>
                    <p className="text-sm text-muted-foreground">Digital Product</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">${product.price}</div>
                    <div className="text-xs text-muted-foreground">USD</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm border-t pt-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Platform fee (10%):</span>
                    <span>${(product.price * 0.1).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Seller receives (90%):</span>
                    <span>${(product.price * 0.9).toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Currency Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Payment Currency</label>
              <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_CURRENCIES.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{currency.code}</span>
                        <span className="text-sm text-muted-foreground">{currency.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {currency.network}
                        </Badge>
                        {currency.recommended && (
                          <Badge className="text-xs bg-green-100 text-green-800">
                            Recommended
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {selectedCrypto && (
                <div className="text-xs text-muted-foreground">
                  Network: {selectedCrypto.network} • 
                  {selectedCrypto.recommended ? ' Fast & Low Fees' : ' Standard Fees'}
                </div>
              )}
            </div>

            {/* Security Notice */}
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Your payment is secured by Cryptomus with blockchain technology. 
                All transactions are verified and encrypted.
              </AlertDescription>
            </Alert>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleCreatePayment} className="flex-1">
                <Zap className="h-4 w-4 mr-2" />
                Pay with {selectedCurrency}
              </Button>
            </div>
          </div>
        );

      case 'processing':
        return (
          <div className="text-center space-y-4 py-8">
            <Loader2 className="h-16 w-16 animate-spin mx-auto text-primary" />
            <h3 className="text-xl font-semibold">Creating Payment...</h3>
            <p className="text-muted-foreground">
              Setting up your secure cryptocurrency payment with Cryptomus
            </p>
          </div>
        );

      case 'redirect':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <ExternalLink className="h-12 w-12 mx-auto text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Payment Ready</h3>
              <p className="text-muted-foreground">
                Your payment is ready. Click below to complete the transaction.
              </p>
            </div>

            {paymentData && (
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Amount:</span>
                    <span className="font-bold">${paymentData.amount} USD</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Currency:</span>
                    <Badge>{paymentData.toCurrency}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Expires in:</span>
                    <span className="font-mono text-orange-600">
                      {formatTime(timeRemaining)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                You will be redirected to Cryptomus to complete your payment. 
                The payment link expires in {formatTime(timeRemaining)}.
              </AlertDescription>
            </Alert>

            <Button 
              onClick={handleRedirectToPayment} 
              className="w-full" 
              size="lg"
            >
              <ExternalLink className="h-5 w-5 mr-2" />
              Complete Payment on Cryptomus
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        );

      case 'confirming':
        return (
          <div className="text-center space-y-6 py-8">
            <Clock className="h-16 w-16 mx-auto text-yellow-500 animate-pulse" />
            <h3 className="text-xl font-semibold">Confirming Payment</h3>
            <p className="text-muted-foreground">
              We're waiting for blockchain confirmation. This usually takes 1-10 minutes.
            </p>
            
            {paymentData && (
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span>Order ID:</span>
                      <span className="font-mono">{paymentData.orderId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Payment ID:</span>
                      <span className="font-mono text-xs">{paymentData.paymentId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <Badge variant="outline">Confirming</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Alert>
              <AlertDescription>
                This page will automatically update when your payment is confirmed. 
                Please keep this window open.
              </AlertDescription>
            </Alert>
          </div>
        );

      case 'success':
        return (
          <div className="text-center space-y-6 py-8">
            <CheckCircle className="h-16 w-16 mx-auto text-green-500" />
            <h3 className="text-xl font-semibold text-green-700">Payment Successful!</h3>
            <p className="text-muted-foreground">
              Your cryptocurrency payment has been confirmed. You can now download your product.
            </p>
            
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                A download link has been sent to your email and is available in your order history.
              </AlertDescription>
            </Alert>

            <Button onClick={onClose} className="w-full" size="lg">
              Continue to Download
            </Button>
          </div>
        );

      case 'failed':
        return (
          <div className="text-center space-y-6 py-8">
            <XCircle className="h-16 w-16 mx-auto text-red-500" />
            <h3 className="text-xl font-semibold text-red-700">Payment Failed</h3>
            <p className="text-muted-foreground">
              {error || 'Your payment could not be processed. Please try again.'}
            </p>
            
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                If you made a payment, please wait a few minutes for confirmation or contact support.
              </AlertDescription>
            </Alert>

            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Close
              </Button>
              <Button onClick={() => setStep('select')} className="flex-1">
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Secure Cryptocurrency Payment
          </DialogTitle>
        </DialogHeader>
        {renderStep()}
      </DialogContent>
    </Dialog>
  );
}