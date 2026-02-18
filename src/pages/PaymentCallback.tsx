import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/clients';
import { checkPesaPalPaymentStatus } from '@/lib/pesapal-payment';

export default function PaymentCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');
  const [message, setMessage] = useState('Verifying your payment...');

  useEffect(() => {
    verifyPayment();
  }, []);

  const verifyPayment = async () => {
    try {
      // Get parameters from PesaPal redirect
      const orderTrackingId = searchParams.get('OrderTrackingId');
      const orderMerchantReference = searchParams.get('OrderMerchantReference');
      
      console.log('Payment callback received:', {
        orderTrackingId,
        orderMerchantReference
      });

      if (!orderTrackingId && !orderMerchantReference) {
        throw new Error('Missing payment parameters');
      }

      // Verify payment status with PesaPal API
      let paymentStatus;
      if (orderTrackingId) {
        setMessage('Verifying payment with PesaPal...');
        paymentStatus = await checkPesaPalPaymentStatus(orderTrackingId);
        console.log('Payment status from PesaPal:', paymentStatus);
      }

      // Find the order in database
      const orderId = orderMerchantReference || orderTrackingId;
      
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderError || !order) {
        throw new Error('Order not found');
      }

      // Update order status if payment is confirmed
      if (paymentStatus?.isPaid) {
        setMessage('Payment confirmed! Updating order...');
        
        const { error: updateError } = await supabase
          .from('orders')
          .update({
            status: 'paid',
            payment_id: orderTrackingId,
            completed_at: new Date().toISOString()
          })
          .eq('id', order.id);

        if (updateError) {
          console.error('Error updating order:', updateError);
        }

        // Update product download count
        await supabase.rpc('increment_download_count', {
          product_id: order.product_id
        });

        setStatus('success');
        setMessage('Payment successful! Redirecting...');
        
        // Redirect to success page with order ID
        setTimeout(() => {
          navigate(`/order-success?order_id=${order.id}`);
        }, 2000);
      } else {
        // Payment not confirmed yet or failed
        setStatus('failed');
        setMessage('Payment verification failed. Please contact support.');
        
        setTimeout(() => {
          navigate(`/order-success?order_id=${order.id}`);
        }, 3000);
      }

    } catch (error: any) {
      console.error('Payment verification error:', error);
      setStatus('failed');
      setMessage(error.message || 'Payment verification failed');
      
      // Still redirect to order success page after delay
      setTimeout(() => {
        navigate('/order-success');
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
        {status === 'verifying' && (
          <>
            <Loader2 className="h-16 w-16 text-blue-600 animate-spin mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying Payment</h2>
            <p className="text-gray-600">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
            <p className="text-gray-600">{message}</p>
          </>
        )}

        {status === 'failed' && (
          <>
            <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h2>
            <p className="text-gray-600">{message}</p>
          </>
        )}
      </div>
    </div>
  );
}
