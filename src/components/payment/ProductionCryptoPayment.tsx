/**
 * Production-Ready Crypto Payment Component
 * Handles real crypto transactions with automatic 90/10 split
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCard, 
  Wallet, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Copy,
  ExternalLink,
  Shield,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  createProductionPayment,
  checkProductionPaymentStatus,
  calculateProductionRevenueSplit,
  PRODUCTION_CRYPTO_CURRENCIES,
  type ProductionPaymentRequest
} from '@/lib/production-crypto-payment';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface ProductionCryptoPaymentProps {
  productId: string;
  sellerId: string;
  amount: number;
  productTitle: string;
  onSuccess?: (orderId: string) => void;
  onCancel?: () => void;
}

export function ProductionCryptoPayment({
  productId,
  sellerId,
  amount,
  productTitle,
  onSuccess,
  onCancel
}: ProductionCryptoPaymentProps) {
  const { user } = useAuth();
  const [selectedCurrency, setSelectedCurrency] = useState('USDT');
  const [paymentState, setPaymentState] = useState<'select' | 'processing' | 'waiting' | 'success' | 'failed'>('select');
  const [paymentData, setPaymentData] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [statusChecking, setStatusChecking] = useState(false);

  // Calculate revenue split
  const revenueSplit = calculateProductionRevenueSplit(amount);
  const selectedCrypto = PRODUCTION_CRYPTO_CURRENCIES.find(c => c.code === selectedCurrency);

  // Timer for payment expiry
  useEffect(() => {
    if (paymentData?.expiresAt && paymentState === 'waiting') {
      const interval = setInterval(() => {
        const now = new Date().getTime();
        const expiry = new Date(paymentData.expiresAt).getTime();
        const remaining = Math.max(0, expiry - now);
        
        setTimeLeft(Math.floor(remaining / 1000));
        
        if (remaining <= 0) {
          setPaymentState('failed');
          clearInterval(interval);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [paymentData, paymentState]);

  // Auto-check payment status
  useEffect(() => {
    if (paymentState === 'waiting' && paymentData?.paymentId) {
      const checkStatus = async () => {
        if (statusChecking) return;
        
        setStatusChecking(true);
        try {
          const status = await checkProductionPaymentStatus(paymentData.paymentId);
          
          if (status.isPaid) {
            setPaymentState('success');
            toast.success('Payment confirmed! Processing your order...');
            onSuccess?.(paymentData.orderId);
          }
        } catch (error) {
          console.error('Status check error:', error);
        } finally {
          setStatusChecking(false);
        }
      };

      // Check immediately, then every 10 seconds
      checkStatus();
      const interval = setInterval(checkStatus, 10000);
      
      return () => clearInterval(interval);
    }
  }, [paymentState, paymentData, statusChecking, onSuccess]);

  const handleCreatePayment = async () => {
    if (!user) {
      toast.error('Please sign in to make a purchase');
      return;
    }

    setPaymentState('processing');

    try {
      const request: ProductionPaymentRequest = {
        productId,
        sellerId,
        buyerId: user.id,
        amount,
        currency: selectedCurrency,
        productTitle,
        buyerEmail: user.email
      };

      const result = await createProductionPayment(request);

      if (result.success && result.paymentUrl) {
        setPaymentData(result);
        
        // Open payment in new window
        const paymentWindow = window.open(
          result.paymentUrl,
          'cryptomus_payment',
          'width=800,height=600,scrollbars=yes,resizable=yes'
        );

        // Monitor payment window
        const checkClosed = setInterval(() => {
          if (paymentWindow?.closed) {
            clearInterval(checkClosed);
            setPaymentState('waiting');
            toast.info('Continue payment monitoring...');
          }
        }, 1000);

        setPaymentState('waiting');
      } else {
        throw new Error(result.error || 'Payment creation failed');
      }
    } catch (error) {
      console.error('Payment creation error:', error);
      setPaymentState('failed');
      toast.error(error instanceof Error ? error.message : 'Payment failed');
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  if (paymentState === 'success') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-6"
      >
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-green-600 mb-2">Payment Confirmed!</h3>
          <p className="text-muted-foreground">
            Your crypto payment has been confirmed. The seller will receive their 90% share automatically.
          </p>
        </div>
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>Automatic Payout:</strong> The seller will receive ${revenueSplit.sellerEarnings} 
            (90%) directly to their crypto wallet within 10-30 minutes.
          </AlertDescription>
        </Alert>
      </motion.div>
    );
  }

  if (paymentState === 'failed') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-6"
      >
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-red-600 mb-2">Payment Failed</h3>
          <p className="text-muted-foreground">
            Your payment could not be processed or has expired.
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => setPaymentState('select')} variant="outline">
            Try Again
          </Button>
          <Button onClick={onCancel} variant="ghost">
            Cancel
          </Button>
        </div>
      </motion.div>
    );
  }

  if (paymentState === 'waiting') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-blue-600 animate-pulse" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Waiting for Payment</h3>
          <p className="text-muted-foreground">
            Complete your payment in the opened window or scan the QR code
          </p>
        </div>

        {timeLeft > 0 && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              Payment expires in: <strong>{formatTime(timeLeft)}</strong>
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Payment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span>Amount:</span>
              <span className="font-semibold">${amount}</span>
            </div>
            <div className="flex justify-between">
              <span>Currency:</span>
              <span className="font-semibold">{selectedCurrency}</span>
            </div>
            <div className="flex justify-between">
              <span>Order ID:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm">{paymentData?.orderId}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(paymentData?.orderId)}
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </div>
            {paymentData?.paymentUrl && (
              <Button
                onClick={() => window.open(paymentData.paymentUrl, '_blank')}
                className="w-full"
                variant="outline"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Payment Window
              </Button>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button 
            onClick={() => setPaymentState('select')} 
            variant="outline"
            className="flex-1"
          >
            Change Currency
          </Button>
          <Button onClick={onCancel} variant="ghost" className="flex-1">
            Cancel
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Revenue Split Info */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Automatic Split:</strong> Seller receives ${revenueSplit.sellerEarnings} (90%), 
          Platform fee: ${revenueSplit.platformFee} (10%)
        </AlertDescription>
      </Alert>

      {/* Payment Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Payment Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <span>Product:</span>
            <span className="font-semibold">{productTitle}</span>
          </div>
          <div className="flex justify-between">
            <span>Total Amount:</span>
            <span className="font-semibold">${amount}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Seller Earnings (90%):</span>
            <span>${revenueSplit.sellerEarnings}</span>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Platform Fee (10%):</span>
            <span>${revenueSplit.platformFee}</span>
          </div>
        </CardContent>
      </Card>

      {/* Currency Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Cryptocurrency</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {PRODUCTION_CRYPTO_CURRENCIES.map((crypto) => (
              <motion.div
                key={crypto.code}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card
                  className={`cursor-pointer transition-all ${
                    selectedCurrency === crypto.code
                      ? 'ring-2 ring-primary bg-primary/5'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedCurrency(crypto.code)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                          {crypto.icon}
                        </div>
                        <div>
                          <div className="font-semibold">{crypto.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {crypto.network} • Min: ${crypto.minAmount}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">
                          {crypto.fees}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {crypto.processingTime}
                        </div>
                        {crypto.recommended && (
                          <Badge variant="secondary" className="mt-1">
                            <Zap className="w-3 h-3 mr-1" />
                            Recommended
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Secure Payment:</strong> All transactions are processed through Cryptomus, 
          a trusted crypto payment gateway. Your funds are protected.
        </AlertDescription>
      </Alert>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={handleCreatePayment}
          disabled={paymentState === 'processing' || !selectedCrypto}
          className="flex-1"
          size="lg"
        >
          {paymentState === 'processing' ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Creating Payment...
            </>
          ) : (
            <>
              <Wallet className="w-4 h-4 mr-2" />
              Pay with {selectedCurrency}
            </>
          )}
        </Button>
        <Button onClick={onCancel} variant="outline" size="lg">
          Cancel
        </Button>
      </div>

      {/* Additional Info */}
      <div className="text-center text-sm text-muted-foreground">
        <p>
          After payment confirmation, the seller will automatically receive 90% 
          of the payment directly to their crypto wallet.
        </p>
      </div>
    </motion.div>
  );
}