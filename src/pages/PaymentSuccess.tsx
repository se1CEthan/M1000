/**
 * Custom Payment Success Page
 * Displays payment confirmation and download options
 */

import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { 
  CheckCircle, 
  Download, 
  ArrowRight, 
  Clock, 
  AlertCircle, 
  Shield,
  ExternalLink,
  RefreshCw,
  Copy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface PaymentStatusData {
  orderId: string;
  paymentId: string;
  status: string;
  statusLabel: string;
  statusColor: string;
  amount: string;
  paidAmount: string;
  currency: string;
  toCurrency: string;
  network: string;
  address: string;
  txid: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: number;
  isFinal: boolean;
}

interface OrderData {
  id: string;
  order_number: string;
  status: string;
  price: number;
  download_url?: string;
  download_expires_at?: string;
  completed_at?: string;
  product?: {
    id: string;
    title: string;
    slug: string;
    thumbnail_url?: string;
  };
  seller?: {
    full_name?: string;
    avatar_url?: string;
  };
}

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const orderId = searchParams.get('order');
  const paymentId = searchParams.get('payment');
  
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatusData | null>(null);
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if ((orderId || paymentId) && user) {
      fetchPaymentStatus();
      
      // Auto-refresh every 10 seconds for pending payments
      const interval = setInterval(() => {
        if (paymentStatus?.status === 'pending') {
          fetchPaymentStatus(true);
        }
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [orderId, paymentId, user]);

  const fetchPaymentStatus = async (silent = false) => {
    if (!silent) setLoading(true);
    if (silent) setRefreshing(true);
    
    try {
      const response = await fetch('/api/payments/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          orderId: orderId || undefined,
          paymentId: paymentId || undefined
        })
      });

      const result = await response.json();

      if (result.success && result.data) {
        setPaymentStatus(result.data);
        await fetchOrderData(result.data.orderId);
      } else {
        setError(result.error || 'Payment not found');
      }
    } catch (error) {
      console.error('Error fetching payment status:', error);
      setError('Failed to load payment information');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchOrderData = async (orderIdToFetch: string) => {
    try {
      // This would be your order API endpoint
      const response = await fetch(`/api/orders/${orderIdToFetch}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        setOrderData(result.data);
      }
    } catch (error) {
      console.error('Error fetching order data:', error);
    }
  };

  const handleDownload = () => {
    if (orderData?.download_url) {
      window.open(orderData.download_url, '_blank');
      toast.success('Download started!');
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const getStatusIcon = () => {
    if (!paymentStatus) return <Clock className="h-16 w-16 text-gray-400" />;
    
    switch (paymentStatus.status) {
      case 'completed':
        return <CheckCircle className="h-16 w-16 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-16 w-16 text-red-500" />;
      case 'pending':
        return <Clock className="h-16 w-16 text-yellow-500 animate-pulse" />;
      default:
        return <Clock className="h-16 w-16 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (paymentStatus?.statusColor) {
      case 'green': return 'text-green-600 bg-green-50 border-green-200';
      case 'red': return 'text-red-600 bg-red-50 border-red-200';
      case 'yellow': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading payment information...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !paymentStatus) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Payment Not Found</h1>
            <p className="text-muted-foreground mb-6">
              {error || 'The payment you\'re looking for doesn\'t exist or you don\'t have access to it.'}
            </p>
            <Button asChild>
              <Link to="/marketplace">Browse Marketplace</Link>
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          {/* Status Header */}
          <div className="text-center mb-8">
            {getStatusIcon()}
            <h1 className={`text-3xl font-bold mt-4 mb-2 ${getStatusColor()}`}>
              {paymentStatus.statusLabel}
            </h1>
            <p className="text-muted-foreground text-lg">
              {paymentStatus.status === 'completed' && 'Your cryptocurrency payment has been confirmed'}
              {paymentStatus.status === 'pending' && 'We\'re waiting for blockchain confirmation'}
              {paymentStatus.status === 'failed' && 'Your payment could not be processed'}
            </p>
          </div>

          {/* Payment Details */}
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Payment Details</CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => fetchPaymentStatus()}
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Order Information */}
              {orderData && (
                <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                  {orderData.product?.thumbnail_url && (
                    <img 
                      src={orderData.product.thumbnail_url} 
                      alt={orderData.product.title}
                      className="w-16 h-16 rounded object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold">{orderData.product?.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      by {orderData.seller?.full_name || 'Seller'}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline">{orderData.order_number}</Badge>
                      <Badge className={getStatusColor()}>
                        {paymentStatus.statusLabel}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold">${paymentStatus.amount}</div>
                    <div className="text-sm text-muted-foreground">
                      ≈ {paymentStatus.paidAmount} {paymentStatus.toCurrency}
                    </div>
                  </div>
                </div>
              )}

              <Separator />

              {/* Transaction Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-3">
                  <div>
                    <span className="text-muted-foreground">Payment ID:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs">{paymentStatus.paymentId}</span>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => copyToClipboard(paymentStatus.paymentId, 'Payment ID')}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-muted-foreground">Currency:</span>
                    <p>{paymentStatus.toCurrency} ({paymentStatus.network})</p>
                  </div>
                  
                  <div>
                    <span className="text-muted-foreground">Amount Paid:</span>
                    <p className="font-semibold">{paymentStatus.paidAmount} {paymentStatus.toCurrency}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="text-muted-foreground">Created:</span>
                    <p>{new Date(paymentStatus.createdAt).toLocaleString()}</p>
                  </div>
                  
                  {paymentStatus.txid && (
                    <div>
                      <span className="text-muted-foreground">Transaction:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs">{paymentStatus.txid.substring(0, 16)}...</span>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => copyToClipboard(paymentStatus.txid, 'Transaction ID')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <span className="text-muted-foreground">Network:</span>
                    <p>{paymentStatus.network}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Download Section */}
          {paymentStatus.status === 'completed' && orderData?.download_url && (
            <Card className="mb-6 border-green-200 bg-green-50 dark:bg-green-900/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Download className="h-10 w-10 text-green-600" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-green-800 dark:text-green-200 text-lg">
                      Your Download is Ready!
                    </h3>
                    <p className="text-sm text-green-600 dark:text-green-300">
                      Download expires on {orderData.download_expires_at ? 
                        new Date(orderData.download_expires_at).toLocaleDateString() : 
                        'Never'
                      }
                    </p>
                  </div>
                  <Button 
                    onClick={handleDownload} 
                    className="bg-green-600 hover:bg-green-700"
                    size="lg"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    Download Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pending Payment Info */}
          {paymentStatus.status === 'pending' && (
            <Alert className="mb-6">
              <Clock className="h-4 w-4" />
              <AlertDescription>
                Your payment is being processed on the blockchain. This typically takes 1-10 minutes 
                depending on network congestion. This page will automatically update when confirmed.
              </AlertDescription>
            </Alert>
          )}

          {/* Failed Payment Info */}
          {paymentStatus.status === 'failed' && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your payment could not be processed. This could be due to insufficient funds, 
                network issues, or payment timeout. Please try purchasing again or contact support.
              </AlertDescription>
            </Alert>
          )}

          {/* Security Notice */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-primary" />
                <div className="text-sm">
                  <p className="font-medium">Secure Payment</p>
                  <p className="text-muted-foreground">
                    This payment was processed securely through Cryptomus with blockchain verification.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button asChild variant="outline" className="flex-1">
              <Link to="/marketplace">
                Continue Shopping
              </Link>
            </Button>
            
            {paymentStatus.status === 'failed' && orderData?.product && (
              <Button asChild className="flex-1">
                <Link to={`/product/${orderData.product.slug}`}>
                  Try Again
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            )}

            {paymentStatus.status === 'completed' && (
              <Button asChild className="flex-1">
                <Link to="/dashboard/orders">
                  View All Orders
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            )}
          </div>

          {/* Support Info */}
          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>
              Need help? Contact our support team at{' '}
              <a href="mailto:support@seltech.online" className="text-primary hover:underline">
                support@seltech.online
              </a>
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}