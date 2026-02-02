import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, CheckCircle, ExternalLink, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { DirectCryptomusService } from '@/lib/cryptomus-direct';

export default function ManualPayment() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);

  const orderId = searchParams.get('order');
  const amount = searchParams.get('amount');
  const currency = searchParams.get('currency');

  useEffect(() => {
    if (!orderId || !amount || !currency) {
      navigate('/marketplace');
    }
  }, [orderId, amount, currency, navigate]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCheckPayment = async () => {
    if (!orderId) return;
    
    setChecking(true);
    try {
      const result = await DirectCryptomusService.checkPaymentStatus(orderId);
      
      if (result.success && result.status === 'paid') {
        toast.success('Payment confirmed! Redirecting...');
        navigate(`/order-success?order=${orderId}`);
      } else {
        toast.info('Payment not yet confirmed. Please wait and try again.');
      }
    } catch (error) {
      toast.error('Error checking payment status');
    } finally {
      setChecking(false);
    }
  };

  // Sample wallet addresses for different currencies
  const walletAddresses = {
    USDT: 'TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE',
    BTC: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    ETH: '0x742d35Cc6634C0532925a3b8D4C9db96590b5c8e',
    LTC: 'ltc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
    TRX: 'TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE'
  };

  const walletAddress = walletAddresses[currency as keyof typeof walletAddresses] || walletAddresses.USDT;

  if (!orderId || !amount || !currency) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/marketplace')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Marketplace
          </Button>
          
          <h1 className="text-3xl font-bold mb-2">Complete Your Payment</h1>
          <p className="text-muted-foreground">
            Send the exact amount to the wallet address below to complete your purchase.
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge variant="outline">{currency}</Badge>
              Payment Instructions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Order ID:</span>
                  <div className="font-mono text-xs break-all">{orderId}</div>
                </div>
                <div>
                  <span className="font-medium">Amount:</span>
                  <div className="text-lg font-bold">${amount}</div>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Send {currency} to this address:
              </label>
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <code className="flex-1 text-sm font-mono break-all">
                  {walletAddress}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(walletAddress)}
                >
                  {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                Important Instructions:
              </h4>
              <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                <li>• Send the exact amount of ${amount} worth of {currency}</li>
                <li>• Use the correct network (TRC20 for USDT/TRX, ERC20 for ETH/USDC)</li>
                <li>• Payment will be confirmed automatically within 10-30 minutes</li>
                <li>• Do not send from an exchange - use a personal wallet</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleCheckPayment}
                disabled={checking}
                className="flex-1"
              >
                {checking ? 'Checking...' : 'Check Payment Status'}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => window.open(`https://tronscan.org/#/address/${walletAddress}`, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View Wallet
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-sm text-muted-foreground">
              <p className="mb-2">
                Having trouble? Contact support at{' '}
                <a href="mailto:support@seltech.online" className="text-primary hover:underline">
                  support@seltech.online
                </a>
              </p>
              <p>
                Include your Order ID: <code className="bg-muted px-1 rounded">{orderId}</code>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}