import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, ExternalLink, AlertCircle, Wallet, Shield, Zap, Copy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createProductionPayment, PRODUCTION_CRYPTO_CURRENCIES, calculateProductionRevenueSplit } from '@/lib/production-crypto-payment';
import { supabase } from '@/integrations/supabase/clients';
import { Product } from '@/types/database';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface CryptomusWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onSuccess?: (orderId: string) => void;
}

export function CryptomusWidget({ isOpen, onClose, product, onSuccess }: CryptomusWidgetProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');
  const [orderId, setOrderId] = useState('');
  const [error, setError] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('USDT');
  const [showPayment, setShowPayment] = useState(false);

  // Calculate revenue split for display
  const revenueSplit = calculateProductionRevenueSplit(product.price);
  const selectedCrypto = PRODUCTION_CRYPTO_CURRENCIES.find(c => c.code === selectedCurrency);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setLoading(false);
      setPaymentUrl('');
      setOrderId('');
      setError('');
      setShowPayment(false);
    }
  }, [isOpen]);

  const handleInitiatePayment = async () => {
    if (!user) {
      toast.error('Please log in to make a purchase');
      return;
    }

    // Validate product price
    if (typeof product.price !== 'number' || isNaN(product.price) || product.price <= 0) {
      toast.error('Invalid product price. Please contact support.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Use production crypto payment API
      const result = await createProductionPayment({
        productId: product.id,
        sellerId: product.seller_id,
        buyerId: user.id,
        amount: product.price,
        currency: selectedCurrency,
        productTitle: product.title,
        buyerEmail: user.email
      });

      if (result.success && result.paymentUrl && result.orderId) {
        setOrderId(result.orderId);
        setPaymentUrl(result.paymentUrl);
        
        // Store order info in localStorage for success page
        localStorage.setItem('pendingOrder', JSON.stringify({
          orderId: result.orderId,
          orderNumber: result.orderId,
          productTitle: product.title,
          amount: product.price,
          timestamp: Date.now()
        }));

        setShowPayment(true);
        toast.success('Payment ready! Complete your cryptocurrency payment.');
      } else {
        setError(result.error || 'Failed to initiate payment');
      }
    } catch (error) {
      console.error('Payment initiation error:', error);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentRedirect = () => {
    if (paymentUrl) {
      // Open Cryptomus payment in new window for better UX
      const paymentWindow = window.open(
        paymentUrl,
        'cryptomus_payment',
        'width=800,height=700,scrollbars=yes,resizable=yes,location=yes'
      );

      // Monitor payment window closure
      const checkClosed = setInterval(() => {
        if (paymentWindow?.closed) {
          clearInterval(checkClosed);
          toast.info('Payment window closed. Checking payment status...');
          // Redirect to success page to check status
          window.location.href = `https://seltech.online/order-success?order_id=${orderId}&status=success`;
        }
      }, 1000);
    }
  };

  const copyOrderId = () => {
    navigator.clipboard.writeText(orderId);
    toast.success('Order ID copied to clipboard');
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Cryptocurrency Payment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Product Info & Revenue Split */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">Product:</span>
              <span className="text-right">{product.title}</span>
            </div>
            <div className="flex justify-between items-center mb-3">
              <span className="font-medium">Total Price:</span>
              <span className="text-lg font-bold">${product.price}</span>
            </div>
            
            {/* Revenue Split Display */}
            <div className="border-t pt-3 space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Seller receives (90%):</span>
                <span className="font-semibold text-green-600">${revenueSplit.sellerEarnings}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Platform fee (10%):</span>
                <span className="font-semibold">${revenueSplit.platformFee}</span>
              </div>
            </div>
          </div>

          {/* Currency Selection */}
          {!showPayment && (
            <div className="space-y-3">
              <h4 className="font-medium">Select Cryptocurrency:</h4>
              <div className="grid gap-2">
                {PRODUCTION_CRYPTO_CURRENCIES.map((crypto) => (
                  <div
                    key={crypto.code}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedCurrency === crypto.code
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'border-border hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedCurrency(crypto.code)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                          {crypto.icon}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{crypto.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {crypto.network} • Min: ${crypto.minAmount}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">{crypto.fees}</div>
                        <div className="text-xs text-muted-foreground">{crypto.processingTime}</div>
                        {crypto.recommended && (
                          <Badge variant="secondary" className="text-xs mt-1">
                            <Zap className="w-3 h-3 mr-1" />
                            Recommended
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Payment Ready State */}
          {showPayment && paymentUrl && (
            <div className="space-y-4">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <strong>Payment Ready:</strong> Your Cryptomus payment has been created. 
                  Click below to complete your payment securely.
                </AlertDescription>
              </Alert>
              
              {/* Order ID Display */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Order ID</p>
                    <p className="text-xs text-blue-600 dark:text-blue-300 font-mono">{orderId}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyOrderId}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>
              </div>
              
              {/* Payment Action */}
              <Button
                onClick={handlePaymentRedirect}
                className="w-full"
                size="lg"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Complete Payment with {selectedCurrency}
              </Button>
              
              {/* Payment Instructions */}
              <Alert>
                <Zap className="h-4 w-4" />
                <AlertDescription>
                  <strong>Next Steps:</strong>
                  <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
                    <li>Click "Complete Payment" to open Cryptomus</li>
                    <li>Pay the exact amount shown in {selectedCurrency}</li>
                    <li>You'll be automatically redirected after payment</li>
                    <li>Download your product immediately</li>
                  </ol>
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Payment Initiation */}
          {!showPayment && (
            <div className="space-y-4">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <strong>Automatic Revenue Split:</strong> After payment confirmation, the seller automatically receives 
                  ${revenueSplit.sellerEarnings} (90%) directly to their crypto wallet, and the platform 
                  collects ${revenueSplit.platformFee} (10%).
                </AlertDescription>
              </Alert>

              <Button 
                onClick={handleInitiatePayment} 
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating payment...
                  </>
                ) : (
                  <>
                    <Wallet className="h-4 w-4 mr-2" />
                    Pay with {selectedCurrency}
                  </>
                )}
              </Button>
              
              <Button variant="outline" onClick={handleClose} className="w-full">
                Cancel
              </Button>
            </div>
          )}

          {/* Security & Info */}
          <div className="text-xs text-muted-foreground space-y-2">
            <div className="text-center space-y-1">
              <p>• Secure payment powered by Cryptomus API</p>
              <p>• Supports Bitcoin, Ethereum, USDT, and more</p>
              <p>• Automatic seller payouts within 10-30 minutes</p>
              <p>• Download available immediately after confirmation</p>
            </div>
          </div>

          {/* Close button for payment view */}
          {showPayment && (
            <Button variant="outline" onClick={handleClose} className="w-full">
              Close
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}