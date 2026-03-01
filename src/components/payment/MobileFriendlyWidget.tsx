import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, AlertCircle, ExternalLink, Smartphone } from 'lucide-react';
import { Product } from '@/types/database';
import { useAuth } from '@/hooks/useAuth';
import { UltraFastPayment } from '@/lib/ultra-fast-payment';
import { toast } from 'sonner';

interface MobileFriendlyWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onSuccess?: (orderId: string) => void;
}

export function MobileFriendlyWidget({ isOpen, onClose, product, onSuccess }: MobileFriendlyWidgetProps) {
  const { user } = useAuth();
  const [widgetUrl, setWidgetUrl] = useState('');
  const [orderId, setOrderId] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const mobileKeywords = ['mobile', 'android', 'iphone', 'ipad', 'ipod', 'blackberry', 'windows phone'];
      const isMobileUserAgent = mobileKeywords.some(keyword => userAgent.includes(keyword));
      const isMobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isMobileWidth = window.innerWidth <= 768;
      const hasTouchScreen = 'ontouchstart' in window;
      
      // More comprehensive mobile detection
      const isMobileDevice = isMobileUserAgent || isMobileRegex || (isMobileWidth && hasTouchScreen);
      
      setIsMobile(isMobileDevice);
      console.log('Mobile detection:', { 
        isMobileDevice, 
        isMobileUserAgent,
        isMobileRegex,
        isMobileWidth,
        hasTouchScreen,
        userAgent, 
        width: window.innerWidth 
      });
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Ultra-fast payment initiation
  const initiatePayment = useCallback(async () => {
    if (!user) {
      setError('Please log in to make a purchase');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Check if user can purchase (fast)
      const canPurchase = await UltraFastPayment.canPurchase(product.id, user.id);
      if (!canPurchase) {
        setError('You already own this product');
        setIsLoading(false);
        return;
      }

      // Create payment instantly
      const result = await UltraFastPayment.createPayment({
        productId: product.id,
        buyerId: user.id,
        productPrice: product.price,
        productTitle: product.title,
        sellerId: product.seller_id
      });

      if (result.success && result.widgetUrl && result.orderId) {
        setWidgetUrl(result.widgetUrl);
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

  // Handle mobile redirect
  const handleMobilePayment = useCallback(() => {
    if (widgetUrl) {
      console.log('Redirecting to payment URL:', widgetUrl);
      
      // Close modal first
      onClose();
      
      // Small delay to ensure modal closes properly
      setTimeout(() => {
        // For mobile, use direct navigation to avoid popup blockers
        // This is the most reliable method for mobile browsers
        try {
          window.location.assign(widgetUrl);
        } catch (error) {
          console.error('Direct navigation failed, trying window.open:', error);
          // Fallback to window.open if assign fails
          const newWindow = window.open(widgetUrl, '_self');
          if (!newWindow) {
            // If popup is blocked, show user instruction
            toast.error('Please allow popups and try again, or copy the payment link');
          }
        }
      }, 100);
    }
  }, [widgetUrl, onClose]);

  // Handle desktop iframe
  const handleDesktopPayment = useCallback(() => {
    // Desktop users can use the iframe normally
    return null;
  }, []);

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
            {/* Mobile Payment Flow */}
            {isMobile ? (
              <div className="p-6 space-y-6">
                {/* Mobile header */}
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <Smartphone className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">Mobile Payment</h3>
                  <p className="text-sm text-muted-foreground">
                    Complete your payment securely with Crypto (Cryptomus)
                  </p>
                </div>

                {/* Payment details */}
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Product:</span>
                    <span className="text-right text-sm">{product.title}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Amount:</span>
                    <span className="text-lg font-bold text-primary">${product.price}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span>Order ID:</span>
                    <span className="font-mono">#{orderId.slice(-8)}</span>
                  </div>
                </div>

                {/* Mobile payment button */}
                <div className="space-y-3">
                  <Button 
                    onClick={() => {
                      handleMobilePayment();
                    }}
                    className="w-full h-12 text-base font-medium"
                    size="lg"
                  >
                    <ExternalLink className="h-5 w-5 mr-2" />
                    Pay ${product.price} with Crypto
                  </Button>
                  
                  {/* Backup copy link button */}
                  <Button 
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(widgetUrl);
                      toast.success('Payment link copied! Open in your browser to pay.');
                    }}
                    className="w-full text-sm"
                    size="sm"
                  >
                    Copy Payment Link (Backup)
                  </Button>
                </div>

                {/* Mobile info */}
                <div className="text-xs text-muted-foreground text-center space-y-1">
                  <p>• You'll be redirected to Cryptomus payment page</p>
                  <p>• Complete payment and return to get your download</p>
                  <p>• Secure cryptocurrency payment processing</p>
                  <p className="text-orange-600 dark:text-orange-400">
                    • If redirect doesn't work, use "Copy Payment Link" above
                  </p>
                </div>
              </div>
            ) : (
              /* Desktop iframe */
              <div className="w-full relative">
                <iframe
                  src={widgetUrl}
                  className="w-full border-0 block"
                  style={{ 
                    height: 'clamp(400px, 60vh, 600px)',
                    minHeight: '400px',
                    maxHeight: '600px'
                  }}
                  title={`Pay $${product.price} - ${product.title}`}
                  allow="payment *; clipboard-write *; web-share *"
                  loading="eager"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation allow-popups-to-escape-sandbox"
                />
              </div>
            )}
          </div>
        )}

        {/* Loading placeholder */}
        {isLoading && !widgetUrl && !error && (
          <div className="flex items-center justify-center p-8 min-h-[300px]">
            <div className="text-center space-y-3">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-sm font-medium">Setting up payment...</p>
              <p className="text-xs text-muted-foreground">
                Amount: ${product.price} • {product.title}
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}