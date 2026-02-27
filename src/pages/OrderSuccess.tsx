import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, Download, ArrowRight, Clock, AlertCircle, Shield, Copy, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { MainLayout } from '@/components/layout/MainLayout';
import { checkProductionPaymentStatus, calculateProductionRevenueSplit } from '@/lib/production-crypto-payment';
import { supabase } from '@/integrations/supabase/clients';
import { Order, Product } from '@/types/database';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { error } from 'console';

export default function OrderSuccess() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  // Handle multiple parameter formats:
  // - order_id: Our standard format
  // - order: Alternative format
  // - product: Product ID (fallback)
  // - reference: Cryptomus reference (our order ID)
  const orderId = searchParams.get('order_id') || 
                  searchParams.get('order') || 
                  searchParams.get('reference') ||
                  searchParams.get('product');
  const cryptomusPaymentId = searchParams.get('payment_id') || searchParams.get('uuid');
  const status = searchParams.get('status');
  
  const [order, setOrder] = useState<Order | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);

  useEffect(() => {
    console.log('OrderSuccess mounted');
    console.log('User:', user);
    console.log('Order ID from URL:', orderId);
    console.log('Cryptomus Payment ID:', cryptomusPaymentId);
    console.log('All URL params:', Object.fromEntries(searchParams.entries()));
    
    if (user) {
      // If we have an order ID, fetch that specific order
      if (orderId) {
        console.log('Fetching order details for:', orderId);
        fetchOrderDetails();
      } else {
        // If no order ID, get the most recent pending/completed order for this user
        console.log('No order ID, fetching latest order');
        fetchLatestOrder();
      }
      
      // Poll payment status every 10 seconds for pending payments
      const interval = setInterval(() => {
        if (paymentStatus === 'pending' || paymentStatus === '') {
          checkPaymentStatus();
        }
      }, 10000);
      return () => clearInterval(interval);
    } else {
      console.log('No user logged in');
      setError('Please log in to view your order');
      setLoading(false);
    }
  }, [orderId, user, paymentStatus]);

  const fetchLatestOrder = async () => {
    if (!user) return;

    try {
      // Get user's profile ID first
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profileData) {
        setError('User profile not found');
        setLoading(false);
        return;
      }

      // First check localStorage for pending order info
      const pendingOrderStr = localStorage.getItem('pendingOrder');
      if (pendingOrderStr) {
        const pendingOrder = JSON.parse(pendingOrderStr);
        console.log('Found pending order in localStorage:', pendingOrder);
        
        // Check if it's recent (within last 2 hours)
        if (Date.now() - pendingOrder.timestamp < 2 * 60 * 60 * 1000) {
          // Try to fetch this specific order
          const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .select(`
              *,
              product:products(*),
              seller:profiles!seller_id(*)
            `)
            .eq('id', pendingOrder.orderId)
            .eq('buyer_id', profileData.id)
            .single();

          if (!orderError && orderData) {
            console.log('Order found from localStorage:', orderData);
            setOrder(orderData as unknown as Order);
            setProduct(orderData.product as Product);
            setPaymentStatus(orderData.status);
            setLoading(false);
            
            // Clear localStorage if order is completed
            if (orderData.status === 'paid' || orderData.status === 'completed') {
              localStorage.removeItem('pendingOrder');
            }
            return;
          }
        } else {
          // Remove old pending order info
          localStorage.removeItem('pendingOrder');
        }
      }

      // Fallback: Get the most recent order for this user (within last hour)
      console.log('Fetching most recent order for profile:', profileData.id);
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          product:products(*),
          seller:profiles!seller_id(*)
        `)
        .eq('buyer_id', profileData.id)
        .gte('created_at', oneHourAgo)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (orderError || !orderData) {
        console.error('No recent order found:', orderError);
        setError('No recent order found. Please check your order history.');
        setLoading(false);
        return;
      }

      console.log('Found recent order:', orderData);
      setOrder(orderData as unknown as Order);
      setProduct(orderData.product as Product);
      setPaymentStatus(orderData.status);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching latest order:', error);
      setError('Failed to load order details');
      setLoading(false);
    }
  };

  const fetchOrderDetails = async () => {
    if (!user) return;
    
    // If we don't have an order ID but have a Cryptomus payment ID, look up by payment ID
    if (!orderId && cryptomusPaymentId) {
      try {
        // First, get the user's profile ID
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (!profileData) {
          setError('User profile not found');
          setLoading(false);
          return;
        }

        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select(`
            *,
            product:products(*),
            seller:profiles!seller_id(*)
          `)
          .eq('payment_id', cryptomusPaymentId)
          .eq('buyer_id', profileData.id)
          .single();

        if (orderError || !orderData) {
          setError('Order not found. Please check your email for order details.');
          setLoading(false);
          return;
        }

        setOrder(orderData as unknown as Order);
        setProduct(orderData.product as Product);
        setPaymentStatus(orderData.status);
        setLoading(false);
        return;
      } catch (error) {
        console.error('Error fetching order by payment ID:', error);
        setError('Failed to load order details');
        setLoading(false);
        return;
      }
    }

    if (!orderId) {
      console.log('No order ID provided');
      return;
    }

    try {
      console.log('Fetching profile for user:', user.id);
      // First, get the user's profile ID
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        setError('User profile not found. Please contact support.');
        setLoading(false);
        return;
      }

      if (!profileData) {
        console.error('No profile data returned');
        setError('User profile not found');
        setLoading(false);
        return;
      }

      console.log('Profile found:', profileData.id);
      console.log('Looking up order:', orderId, 'for buyer:', profileData.id);

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          product:products(*),
          seller:profiles!seller_id(*)
        `)
        .eq('id', orderId)
        .eq('buyer_id', profileData.id)
        .single();

      if (orderError) {
        console.error('Order fetch error:', orderError);
        
        // Try without buyer_id check (maybe it's someone else's order or admin viewing)
        console.log('Trying to fetch order without buyer_id check...');
        const { data: orderData2, error: orderError2 } = await supabase
          .from('orders')
          .select(`
            *,
            product:products(*),
            seller:profiles!seller_id(*)
          `)
          .eq('id', orderId)
          .single();

        if (orderError2 || !orderData2) {
          console.error('Order not found even without buyer check:', orderError2);
          setError(`Order not found. Order ID: ${orderId}. Please check your email or contact support.`);
          setLoading(false);
          return;
        }

        console.log('Order found (without buyer check):', orderData2);
        setOrder(orderData2 as unknown as Order);
        setProduct(orderData2.product as Product);
        setPaymentStatus(orderData2.status);
        setLoading(false);
        return;
      }

      if (!orderData) {
        console.error('No order data returned');
        setError('Order not found or access denied');
        setLoading(false);
        return;
      }

      console.log('Order found:', orderData);
      setOrder(orderData as unknown as Order);
      setProduct(orderData.product as Product);
      setPaymentStatus(orderData.status);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching order:', error);
      setError('Failed to load order details: ' + (error as Error).message);
      setLoading(false);
    }
  };

  const checkPaymentStatus = async (silent = false) => {
    if (!order?.payment_id || paymentStatus === 'paid' || paymentStatus === 'completed') return;

    if (!silent) setRefreshing(true);

    try {
      const result = await checkProductionPaymentStatus(order.payment_id);
      
      if (result.isPaid) {
        setPaymentStatus('paid');
        setPaymentDetails(result);
        
        // Update order status in database
        await supabase
          .from('orders')
          .update({ 
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', orderId);
        
        // Refresh order details to get download URL
        await fetchOrderDetails();
        
        toast.success('Payment confirmed! Your download is ready.');
      } else {
        setPaymentDetails(result);
        if (result.status === 'failed' || result.status === 'cancelled') {
          setPaymentStatus('failed');
        }
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
    } finally {
      if (!silent) setRefreshing(false);
    }
  };

  const handleDownload = () => {
    if (order?.download_url) {
      window.open(order.download_url, '_blank');
      toast.success('Download started!');
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  // Calculate revenue split for display
  const revenueSplit = order ? calculateProductionRevenueSplit(order.total_amount || order.price) : null;

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading order details...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !order || !product) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Order Not Found</h1>
            <p className="text-muted-foreground mb-6">
              {error || 'The order you\'re looking for doesn\'t exist or you don\'t have access to it.'}
            </p>
            <Button asChild>
              <Link to="/marketplace">Browse Marketplace</Link>
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  const getStatusIcon = () => {
    switch (paymentStatus) {
      case 'paid':
        return <CheckCircle className="h-16 w-16 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-16 w-16 text-red-500" />;
      default:
        return <Clock className="h-16 w-16 text-yellow-500" />;
    }
  };

  const getStatusMessage = () => {
    switch (paymentStatus) {
      case 'paid':
      case 'completed':
        return {
          title: 'Payment Confirmed!',
          description: 'Your cryptocurrency payment has been confirmed and your download is ready.',
          color: 'text-green-600'
        };
      case 'failed':
        return {
          title: 'Payment Failed',
          description: 'Your payment could not be processed or has expired. Please try again.',
          color: 'text-red-600'
        };
      default:
        return {
          title: 'Payment Processing',
          description: 'We\'re waiting for blockchain confirmation. This usually takes 5-30 minutes.',
          color: 'text-yellow-600'
        };
    }
  };

  const statusInfo = getStatusMessage();

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          {/* Status Header */}
          <div className="text-center mb-8">
            {getStatusIcon()}
            <h1 className={`text-3xl font-bold mt-4 mb-2 ${statusInfo.color}`}>
              {statusInfo.title}
            </h1>
            <p className="text-muted-foreground text-lg">
              {statusInfo.description}
            </p>
          </div>

          {/* Order Details */}
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Order Details</CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => checkPaymentStatus()}
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Product Info */}
              <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                {product?.thumbnail_url && (
                  <img 
                    src={product.thumbnail_url} 
                    alt={product.title}
                    className="w-16 h-16 rounded object-cover"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold">{product?.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    by {order.seller?.full_name || 'Seller'}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline">{order.order_number}</Badge>
                    <Badge variant={paymentStatus === 'paid' || paymentStatus === 'completed' ? 'default' : 'secondary'}>
                      {paymentStatus === 'paid' || paymentStatus === 'completed' ? 'Completed' : 
                       paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1)}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold">${order.total_amount || order.price}</div>
                  {paymentDetails?.amount && (
                    <div className="text-sm text-muted-foreground">
                      ≈ {paymentDetails.amount} UGX
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Revenue Split Display */}
              {revenueSplit && (
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Revenue Distribution</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                      <span className="text-muted-foreground">Seller Earnings (90%):</span>
                      <p className="font-semibold text-green-600">${revenueSplit.sellerEarnings}</p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                      <span className="text-muted-foreground">Platform Fee (10%):</span>
                      <p className="font-semibold text-blue-600">${revenueSplit.platformFee}</p>
                    </div>
                  </div>
                </div>
              )}

              <Separator />

              {/* Payment Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div>
                    <span className="text-muted-foreground">Order ID:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs">{order.order_number}</span>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => copyToClipboard(order.order_number, 'Order ID')}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-muted-foreground">Payment Method:</span>
                    <p className="capitalize">{order.payment_method}</p>
                  </div>
                  
                  {order.crypto_currency && (
                    <div>
                      <span className="text-muted-foreground">Currency:</span>
                      <p>{order.crypto_currency}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div>
                    <span className="text-muted-foreground">Date:</span>
                    <p>{new Date(order.created_at).toLocaleString()}</p>
                  </div>
                  
                  {order.payment_id && (
                    <div>
                      <span className="text-muted-foreground">Payment ID:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs">{order.payment_id.substring(0, 16)}...</span>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => copyToClipboard(order.payment_id, 'Payment ID')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {paymentDetails?.transactionHash && (
                    <div>
                      <span className="text-muted-foreground">Transaction:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs">{paymentDetails.transactionHash.substring(0, 16)}...</span>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => copyToClipboard(paymentDetails.transactionHash, 'Transaction Hash')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Download Section */}
          {(paymentStatus === 'paid' || paymentStatus === 'completed') && order.download_url && (
            <Card className="mb-6 border-green-200 bg-green-50 dark:bg-green-900/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Download className="h-10 w-10 text-green-600" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-green-800 dark:text-green-200 text-lg">
                      Your Download is Ready!
                    </h3>
                    <p className="text-sm text-green-600 dark:text-green-300">
                      Download expires on {order.download_expires_at ? 
                        new Date(order.download_expires_at).toLocaleDateString() : 
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
          {paymentStatus === 'pending' && (
            <Alert className="mb-6">
              <Clock className="h-4 w-4" />
              <AlertDescription>
                Your cryptocurrency payment is being processed. This typically takes 5-15 minutes 
                depending on blockchain confirmation. This page will automatically update when confirmed.
              </AlertDescription>
            </Alert>
          )}

          {/* Failed Payment Info */}
          {paymentStatus === 'failed' && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your payment could not be processed or has expired. This could be due to insufficient funds, 
                network issues, or payment timeout. Please try purchasing again or contact support.
              </AlertDescription>
            </Alert>
          )}

          {/* Revenue Split Information */}
          {revenueSplit && (paymentStatus === 'paid' || paymentStatus === 'completed') && (
            <Alert className="mb-6">
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong>Automatic Revenue Split Complete:</strong> The seller has automatically received 
                ${revenueSplit.sellerEarnings} (90%) directly to their crypto wallet, and the platform 
                has collected ${revenueSplit.platformFee} (10%) as processing fee.
              </AlertDescription>
            </Alert>
          )}

          {/* Security Notice */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-primary" />
                <div className="text-sm">
                  <p className="font-medium">Secure Cryptocurrency Payment</p>
                  <p className="text-muted-foreground">
                    This payment was processed securely through Cryptomus with blockchain verification 
                    and automatic revenue splitting.
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
            
            {paymentStatus === 'failed' && product && (
              <Button asChild className="flex-1">
                <Link to={`/product/${product.slug}`}>
                  Try Again
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            )}

            {(paymentStatus === 'paid' || paymentStatus === 'completed') && (
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