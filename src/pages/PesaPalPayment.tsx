import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CreditCard, Smartphone, Building2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/clients';

export default function PesaPalPayment() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const orderId = searchParams.get('order_id');
  const productTitle = searchParams.get('product');
  const amount = searchParams.get('amount');

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

  const displayAmount = orderDetails?.price || amount || '0';
  const displayTitle = orderDetails?.products?.title || productTitle || 'Digital Product';
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
                <CreditCard className="h-5 w-5 mr-2" />
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
                  <span>UGX {displayAmount}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Platform Fee (10%):</span>
                  <span>UGX {Math.round(parseFloat(displayAmount) * 0.1)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Seller Earnings (90%):</span>
                  <span>UGX {Math.round(parseFloat(displayAmount) * 0.9)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>UGX {displayAmount}</span>
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
              <CardTitle>Choose Payment Method</CardTitle>
              <p className="text-gray-600">Select your preferred payment option</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Payment Method Options */}
              <div className="grid grid-cols-1 gap-4">
                <div className="border rounded-lg p-4 hover:border-green-500 transition-colors">
                  <div className="flex items-center space-x-3">
                    <Smartphone className="h-8 w-8 text-green-600" />
                    <div>
                      <h3 className="font-semibold">MTN Mobile Money</h3>
                      <p className="text-sm text-gray-600">Pay with MTN Mobile Money</p>
                      <p className="text-xs text-green-600">✓ Instant • ✓ Secure • ✓ Most Popular</p>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4 hover:border-purple-500 transition-colors">
                  <div className="flex items-center space-x-3">
                    <Smartphone className="h-8 w-8 text-purple-600" />
                    <div>
                      <h3 className="font-semibold">Airtel Money</h3>
                      <p className="text-sm text-gray-600">Pay with Airtel Money</p>
                      <p className="text-xs text-purple-600">✓ Instant • ✓ Secure • ✓ Popular</p>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4 hover:border-blue-500 transition-colors">
                  <div className="flex items-center space-x-3">
                    <CreditCard className="h-8 w-8 text-blue-600" />
                    <div>
                      <h3 className="font-semibold">Visa/Mastercard</h3>
                      <p className="text-sm text-gray-600">Pay with your debit or credit card</p>
                      <p className="text-xs text-blue-600">✓ International • ✓ 3D Secure</p>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4 hover:border-orange-500 transition-colors">
                  <div className="flex items-center space-x-3">
                    <Building2 className="h-8 w-8 text-orange-600" />
                    <div>
                      <h3 className="font-semibold">Bank Transfer</h3>
                      <p className="text-sm text-gray-600">Direct bank account transfer</p>
                      <p className="text-xs text-orange-600">✓ Low fees • ✓ Secure</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* PesaPal Payment Widget */}
              <div className="border-t pt-6">
                <h3 className="font-semibold mb-4">Complete Payment with PesaPal</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-4">
                    Click below to proceed to PesaPal's secure payment page where you can choose your preferred payment method.
                  </p>
                  
                  {/* PesaPal Embed */}
                  <div className="flex justify-center mb-4">
                    <iframe 
                      width="300" 
                      height="60" 
                      src="https://store.pesapal.com/embed-code?pageUrl=https://store.pesapal.com/seltech" 
                      frameBorder="0" 
                      allowFullScreen
                      className="border rounded-lg shadow-sm"
                      title="PesaPal Payment"
                    />
                  </div>

                  <div className="text-center">
                    <Button 
                      onClick={() => window.open('https://store.pesapal.com/seltech', '_blank')}
                      className="bg-green-600 hover:bg-green-700 text-white px-8 py-3"
                      size="lg"
                    >
                      Pay with PesaPal
                    </Button>
                  </div>
                </div>
              </div>

              {/* Security Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">🔒 Secure Payment</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Your payment is processed securely by PesaPal</li>
                  <li>• We never store your payment information</li>
                  <li>• 256-bit SSL encryption protects your data</li>
                  <li>• Instant confirmation and receipt</li>
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
                <h4 className="font-semibold mb-2">Choose Method</h4>
                <p className="text-sm text-gray-600">Select MTN Mobile Money, Airtel Money, Card, or Bank Transfer</p>
              </div>
              
              <div className="text-center">
                <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <span className="text-green-600 font-bold">2</span>
                </div>
                <h4 className="font-semibold mb-2">Secure Payment</h4>
                <p className="text-sm text-gray-600">Complete payment on PesaPal's secure platform</p>
              </div>
              
              <div className="text-center">
                <div className="bg-orange-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <span className="text-orange-600 font-bold">3</span>
                </div>
                <h4 className="font-semibold mb-2">Instant Confirmation</h4>
                <p className="text-sm text-gray-600">Receive immediate payment confirmation</p>
              </div>
              
              <div className="text-center">
                <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <span className="text-purple-600 font-bold">4</span>
                </div>
                <h4 className="font-semibold mb-2">Access Product</h4>
                <p className="text-sm text-gray-600">Download your digital product immediately</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}