import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Wallet, Shield, Clock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/clients';
import { SUPPORTED_CURRENCIES } from '@/lib/cryptomus';

export default function CryptomusPayment() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const orderId = searchParams.get('order_id');

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    } else {
      setLoading(false);
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      const { data: order, error } = await supabase
        .from('orders')
        .select(`
          *,
          products (title, price, description),
          profiles!orders_seller_id_fkey (username, full_name)
        `)
        .eq('id', orderId)
        .single();

      if (error) throw error;
      setOrderDetails(order);
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = () => {
    if (orderDetails?.payment_url) {
      window.location.href = orderDetails.payment_url;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payment details...</p>
        </div>
      </div>
    );
  }

  const displayAmount = orderDetails?.price || '0';
  const displayTitle = orderDetails?.products?.title || 'Digital Product';
  const sellerName = orderDetails?.profiles?.full_name || orderDetails?.profiles?.username || 'Seller';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Complete Your Payment</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Wallet className="h-5 w-5 mr-2" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-b pb-4">
                <h3 className="font-semibold text-lg">{displayTitle}</h3>
                <p className="text-gray-600">by {sellerName}</p>
                {orderDetails?.products?.description && (
                  <p className="text-sm text-gray-500 mt-2">
                    {orderDetails.products.description}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Product Price:</span>
                  <span>${displayAmount}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Platform Fee (10%):</span>
                  <span>${(parseFloat(displayAmount) * 0.1).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Seller Earnings (90%):</span>
                  <span>${(parseFloat(displayAmount) * 0.9).toFixed(2)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>${displayAmount}</span>
                </div>
              </div>

              {orderId && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">Order ID: {orderId}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <Card>
            <CardHeader>
              <CardTitle>Cryptocurrency Payment</CardTitle>
              <p className="text-gray-600">Pay securely with cryptocurrency</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Supported Cryptocurrencies */}
              <div className="grid grid-cols-2 gap-4">
                {SUPPORTED_CURRENCIES.map((crypto) => (
                  <div key={crypto.code} className="border rounded-lg p-3 text-center">
                    <div className="text-2xl mb-1">💰</div>
                    <h4 className="font-semibold text-sm">{crypto.code}</h4>
                    <p className="text-xs text-gray-600">{crypto.network}</p>
                  </div>
                ))}
              </div>

              {/* Cryptomus Payment Button */}
              <div className="border-t pt-6">
                <h3 className="font-semibold mb-4">Complete Payment with Cryptomus</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-4">
                    Click below to proceed to Cryptomus secure payment page where you can pay with your preferred cryptocurrency.
                  </p>
                  
                  <div className="text-center">
                    <Button 
                      onClick={handlePayment}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 w-full"
                      size="lg"
                    >
                      Pay with Cryptocurrency
                    </Button>
                  </div>
                </div>
              </div>

              {/* Security Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
                  <Shield className="h-4 w-4 mr-2" />
                  Secure Payment
                </h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Your payment is processed securely by Cryptomus</li>
                  <li>• We never store your wallet information</li>
                  <li>• 256-bit SSL encryption protects your data</li>
                  <li>• Instant confirmation after blockchain verification</li>
                </ul>
              </div>

              {/* Support */}
              <div className="text-center text-sm text-gray-600">
                <p>Need help? Contact our support team</p>
                <Button variant="link" className="text-blue-600 p-0">
                  support@seltech.online
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Process Steps */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>How it works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
                <h4 className="font-semibold mb-2">Choose Crypto</h4>
                <p className="text-sm text-gray-600">Select BTC, ETH, USDT, or other supported cryptocurrencies</p>
              </div>
              
              <div className="text-center">
                <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <span className="text-green-600 font-bold">2</span>
                </div>
                <h4 className="font-semibold mb-2">Send Payment</h4>
                <p className="text-sm text-gray-600">Send crypto to the provided address or scan QR code</p>
              </div>
              
              <div className="text-center">
                <div className="bg-orange-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <Clock className="h-6 w-6 text-orange-600 mx-auto" />
                </div>
                <h4 className="font-semibold mb-2">Blockchain Confirmation</h4>
                <p className="text-sm text-gray-600">Wait for blockchain confirmation (usually 5-15 minutes)</p>
              </div>
              
              <div className="text-center">
                <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <span className="text-purple-600 font-bold">4</span>
                </div>
                <h4 className="font-semibold mb-2">Access Product</h4>
                <p className="text-sm text-gray-600">Download your digital product immediately after confirmation</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
