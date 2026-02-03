import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Smartphone, 
  CheckCircle, 
  AlertTriangle, 
  DollarSign,
  Clock,
  Shield,
  Phone,
  Wallet,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/clients';
import { toast } from 'sonner';

interface PayoutStats {
  pendingAmount: number;
  totalPayouts: number;
  lastPayoutDate: string | null;
  nextPayoutDate: string;
}

export function MobileMoneyPayoutSetup() {
  const { profile, refreshProfile } = useAuth();
  const { toast: toastHook } = useToast();
  const [mobileNumber, setMobileNumber] = useState('');
  const [provider, setProvider] = useState('');
  const [loading, setLoading] = useState(false);
  const [payoutStats, setPayoutStats] = useState<PayoutStats>({
    pendingAmount: 0,
    totalPayouts: 0,
    lastPayoutDate: null,
    nextPayoutDate: 'Setup mobile money to enable payouts'
  });

  useEffect(() => {
    if (profile?.mobile_money_number) {
      setMobileNumber(profile.mobile_money_number);
      // Extract provider from number format
      if (profile.mobile_money_number.includes('77') || profile.mobile_money_number.includes('78')) {
        setProvider('mtn');
      } else if (profile.mobile_money_number.includes('70') || profile.mobile_money_number.includes('75')) {
        setProvider('airtel');
      }
    }
    fetchPayoutStats();
  }, [profile]);

  const fetchPayoutStats = async () => {
    if (!profile?.user_id) return;

    try {
      // Fetch seller earnings from orders
      const { data: orders } = await supabase
        .from('orders')
        .select('seller_earnings, created_at, status')
        .eq('seller_id', profile.user_id)
        .eq('status', 'paid');

      // Fetch completed payouts
      const { data: payouts } = await supabase
        .from('seller_payouts')
        .select('amount, created_at, status')
        .eq('seller_id', profile.user_id)
        .eq('status', 'completed');

      const totalEarnings = orders?.reduce((sum, order) => sum + (order.seller_earnings || 0), 0) || 0;
      const totalPayouts = payouts?.reduce((sum, payout) => sum + (payout.amount || 0), 0) || 0;
      const pendingAmount = totalEarnings - totalPayouts;

      const lastPayout = payouts?.[0];
      const nextPayoutDate = profile.mobile_money_number 
        ? (pendingAmount >= 10 ? 'Available now' : 'When balance reaches $10')
        : 'Setup mobile money first';

      setPayoutStats({
        pendingAmount,
        totalPayouts: payouts?.length || 0,
        lastPayoutDate: lastPayout?.created_at || null,
        nextPayoutDate
      });
    } catch (error) {
      console.error('Error fetching payout stats:', error);
    }
  };

  const handleSave = async () => {
    if (!mobileNumber || !provider) {
      toast.error('Please enter your mobile number and select provider');
      return;
    }

    // Validate Uganda mobile number format
    const ugandaNumberRegex = /^(\+256|0)(7[0-9]{8})$/;
    if (!ugandaNumberRegex.test(mobileNumber)) {
      toast.error('Please enter a valid Uganda mobile number (e.g., +256700123456 or 0700123456)');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          mobile_money_number: mobileNumber,
          mobile_money_provider: provider,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', profile?.user_id);

      if (error) throw error;

      await refreshProfile();
      toast.success('Mobile money details saved successfully!');
      fetchPayoutStats();
    } catch (error: any) {
      console.error('Error saving mobile money details:', error);
      toast.error(error.message || 'Failed to save mobile money details');
    } finally {
      setLoading(false);
    }
  };

  const requestPayout = async () => {
    if (payoutStats.pendingAmount < 10) {
      toast.error('Minimum payout amount is $10 USD');
      return;
    }

    if (!profile?.mobile_money_number) {
      toast.error('Please setup your mobile money number first');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('seller_payouts')
        .insert({
          seller_id: profile.user_id,
          amount: payoutStats.pendingAmount,
          currency: 'USD',
          mobile_number: profile.mobile_money_number,
          provider: provider,
          status: 'pending',
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      toast.success('Payout request submitted! You will receive payment within 24 hours.');
      fetchPayoutStats();
    } catch (error: any) {
      console.error('Error requesting payout:', error);
      toast.error(error.message || 'Failed to request payout');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatUGX = (amount: number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount * 3700);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Mobile Money Payouts</h2>
          <p className="text-muted-foreground">
            Setup your mobile money account to receive seller payouts
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchPayoutStats}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Payout Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Balance</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(payoutStats.pendingAmount)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatUGX(payoutStats.pendingAmount)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Wallet className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Payouts</p>
                <p className="text-2xl font-bold text-blue-600">{payoutStats.totalPayouts}</p>
                <p className="text-xs text-muted-foreground">
                  {payoutStats.lastPayoutDate 
                    ? `Last: ${new Date(payoutStats.lastPayoutDate).toLocaleDateString()}`
                    : 'No payouts yet'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Next Payout</p>
                <p className="text-lg font-bold text-yellow-600">{payoutStats.nextPayoutDate}</p>
                {payoutStats.pendingAmount >= 10 && profile?.mobile_money_number && (
                  <Button
                    size="sm"
                    className="mt-2 h-6 text-xs"
                    onClick={requestPayout}
                    disabled={loading}
                  >
                    Request Now
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Setup Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Mobile Money Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {profile?.mobile_money_number ? (
            <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                <strong>Mobile Money Active!</strong> You're all set to receive payouts.
                <div className="mt-2 flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span className="font-mono">{profile.mobile_money_number}</span>
                  <Badge variant="outline" className="ml-2">
                    {provider === 'mtn' ? 'MTN Mobile Money' : 'Airtel Money'}
                  </Badge>
                </div>
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                <strong>Setup Required!</strong> Add your mobile money number to receive payouts.
                You have {formatCurrency(payoutStats.pendingAmount)} waiting for payout.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="provider">Mobile Money Provider</Label>
                <Select value={provider} onValueChange={setProvider}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mtn">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                        MTN Mobile Money
                      </div>
                    </SelectItem>
                    <SelectItem value="airtel">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                        Airtel Money
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobile_number">Mobile Number</Label>
                <Input
                  id="mobile_number"
                  type="tel"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  placeholder="+256700123456 or 0700123456"
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Enter your Uganda mobile number for {provider === 'mtn' ? 'MTN Mobile Money' : 'Airtel Money'}
                </p>
              </div>

              <Button 
                onClick={handleSave} 
                disabled={loading || !mobileNumber || !provider}
                className="w-full"
              >
                {loading ? 'Saving...' : profile?.mobile_money_number ? 'Update Mobile Number' : 'Save Mobile Number'}
              </Button>
            </div>

            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  How Payouts Work
                </h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2"></div>
                    <span>You earn 90% of each sale automatically</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2"></div>
                    <span>Minimum payout is $10 USD (≈ UGX 37,000)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2"></div>
                    <span>Payouts processed within 24 hours</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2"></div>
                    <span>Direct to your mobile money account</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2"></div>
                    <span>No additional fees or charges</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h4 className="font-semibold mb-2 text-blue-800 dark:text-blue-200">
                  Supported Providers
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span>MTN Mobile Money (077x, 078x)</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span>Airtel Money (070x, 075x)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payout History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Payouts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No payouts yet</p>
            <p className="text-sm">Your payout history will appear here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}