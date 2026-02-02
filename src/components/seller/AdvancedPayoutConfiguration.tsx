import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { 
  Wallet, 
  CreditCard, 
  Building2, 
  Zap, 
  CheckCircle, 
  AlertTriangle, 
  Info,
  Plus,
  Trash2,
  Star,
  Clock,
  DollarSign
} from 'lucide-react';
import { LivePayoutSystem, PayoutMethod } from '@/lib/payout-system';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/clients';
import { toast } from 'sonner';

export function AdvancedPayoutConfiguration() {
  const { profile } = useAuth();
  const [payoutMethods, setPayoutMethods] = useState<PayoutMethod[]>([]);
  const [availableMethods] = useState(LivePayoutSystem.getAvailablePayoutMethods());
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('methods');
  const [pendingBalance, setPendingBalance] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [recentPayouts, setRecentPayouts] = useState([]);

  // Form states for adding new payout method
  const [newMethod, setNewMethod] = useState({
    type: 'crypto',
    currency: 'USDT',
    network: 'TRC20',
    address: '',
    accountDetails: '',
  });

  useEffect(() => {
    if (profile) {
      fetchPayoutMethods();
      fetchPayoutStats();
    }
  }, [profile]);

  const fetchPayoutMethods = async () => {
    try {
      const { data, error } = await supabase
        .from('seller_payout_methods')
        .select('*')
        .eq('seller_id', profile?.user_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const methods: PayoutMethod[] = (data || []).map(method => ({
        id: method.id,
        type: method.method_type,
        name: method.method_name,
        address: method.method_address,
        currency: method.currency,
        network: method.network,
        isDefault: method.is_default,
        isVerified: method.is_verified,
        minimumAmount: method.minimum_amount || 10,
        processingTime: method.processing_time || '1-3 days',
        fees: method.fees || 'Varies',
      }));

      setPayoutMethods(methods);
    } catch (error) {
      console.error('Error fetching payout methods:', error);
    }
  };

  const fetchPayoutStats = async () => {
    try {
      // Get pending balance
      const { data: balance } = await supabase
        .from('seller_pending_balances')
        .select('amount')
        .eq('seller_id', profile?.user_id)
        .single();

      setPendingBalance(balance?.amount || 0);

      // Get total earnings from profile
      setTotalEarnings(profile?.total_earnings || 0);

      // Get recent payouts
      const { data: payouts } = await supabase
        .from('payouts')
        .select('*')
        .eq('seller_id', profile?.user_id)
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentPayouts(payouts || []);
    } catch (error) {
      console.error('Error fetching payout stats:', error);
    }
  };

  const addPayoutMethod = async () => {
    if (!newMethod.address.trim()) {
      toast.error('Please enter a valid address/account details');
      return;
    }

    setLoading(true);
    try {
      const methodData = {
        seller_id: profile?.user_id,
        method_type: newMethod.type,
        method_name: getMethodName(newMethod.type, newMethod.currency),
        method_address: newMethod.address.trim(),
        currency: newMethod.currency,
        network: newMethod.network,
        is_default: payoutMethods.length === 0, // First method is default
        is_verified: newMethod.type === 'crypto', // Auto-verify crypto addresses
        minimum_amount: getMinimumAmount(newMethod.type),
        processing_time: getProcessingTime(newMethod.type),
        fees: getFees(newMethod.type),
      };

      const { error } = await supabase
        .from('seller_payout_methods')
        .insert(methodData);

      if (error) throw error;

      toast.success('Payout method added successfully!');
      setNewMethod({
        type: 'crypto',
        currency: 'USDT',
        network: 'TRC20',
        address: '',
        accountDetails: '',
      });
      
      await fetchPayoutMethods();
    } catch (error) {
      console.error('Error adding payout method:', error);
      toast.error('Failed to add payout method');
    } finally {
      setLoading(false);
    }
  };

  const setDefaultMethod = async (methodId: string) => {
    try {
      // Remove default from all methods
      await supabase
        .from('seller_payout_methods')
        .update({ is_default: false })
        .eq('seller_id', profile?.user_id);

      // Set new default
      await supabase
        .from('seller_payout_methods')
        .update({ is_default: true })
        .eq('id', methodId);

      toast.success('Default payout method updated');
      await fetchPayoutMethods();
    } catch (error) {
      console.error('Error setting default method:', error);
      toast.error('Failed to update default method');
    }
  };

  const deletePayoutMethod = async (methodId: string) => {
    try {
      await supabase
        .from('seller_payout_methods')
        .delete()
        .eq('id', methodId);

      toast.success('Payout method deleted');
      await fetchPayoutMethods();
    } catch (error) {
      console.error('Error deleting payout method:', error);
      toast.error('Failed to delete payout method');
    }
  };

  const requestPendingPayout = async () => {
    if (pendingBalance < 10) {
      toast.error('Minimum payout amount is $10');
      return;
    }

    setLoading(true);
    try {
      const result = await LivePayoutSystem.processPendingBalancePayout(profile?.user_id || '');
      
      if (result.success) {
        toast.success('Payout request submitted successfully!');
        await fetchPayoutStats();
      } else {
        toast.error(result.error || 'Failed to process payout');
      }
    } catch (error) {
      console.error('Error requesting payout:', error);
      toast.error('Failed to request payout');
    } finally {
      setLoading(false);
    }
  };

  const getMethodName = (type: string, currency: string) => {
    switch (type) {
      case 'crypto': return `${currency} Wallet`;
      case 'paypal': return 'PayPal Account';
      case 'bank': return 'Bank Account';
      case 'wise': return 'Wise Account';
      default: return 'Payment Method';
    }
  };

  const getMinimumAmount = (type: string) => {
    switch (type) {
      case 'crypto': return 10;
      case 'paypal': return 25;
      case 'bank': return 50;
      case 'wise': return 30;
      default: return 10;
    }
  };

  const getProcessingTime = (type: string) => {
    switch (type) {
      case 'crypto': return '10-30 minutes';
      case 'paypal': return '1-3 business days';
      case 'bank': return '3-5 business days';
      case 'wise': return '1-2 business days';
      default: return '1-3 days';
    }
  };

  const getFees = (type: string) => {
    switch (type) {
      case 'crypto': return '~$1-3';
      case 'paypal': return '2.9% + $0.30';
      case 'bank': return '$5-15';
      case 'wise': return '0.5-2%';
      default: return 'Varies';
    }
  };

  const getMethodIcon = (type: string) => {
    switch (type) {
      case 'crypto': return <Wallet className="h-5 w-5" />;
      case 'paypal': return <CreditCard className="h-5 w-5" />;
      case 'bank': return <Building2 className="h-5 w-5" />;
      case 'wise': return <Zap className="h-5 w-5" />;
      default: return <DollarSign className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Earnings Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Earnings</p>
                <p className="text-2xl font-bold">${totalEarnings.toFixed(2)}</p>
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
                <p className="text-sm text-muted-foreground">Pending Balance</p>
                <p className="text-2xl font-bold">${pendingBalance.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Zap className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Payout Methods</p>
                <p className="text-2xl font-bold">{payoutMethods.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Balance Action */}
      {pendingBalance >= 10 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>You have ${pendingBalance.toFixed(2)} ready for payout!</span>
            <Button 
              onClick={requestPendingPayout} 
              disabled={loading}
              size="sm"
            >
              Request Payout
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="methods">Payout Methods</TabsTrigger>
          <TabsTrigger value="add">Add Method</TabsTrigger>
          <TabsTrigger value="history">Payout History</TabsTrigger>
        </TabsList>

        <TabsContent value="methods" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Payout Methods</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {payoutMethods.length === 0 ? (
                <div className="text-center py-8">
                  <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Payout Methods</h3>
                  <p className="text-muted-foreground mb-4">
                    Add a payout method to receive your earnings automatically
                  </p>
                  <Button onClick={() => setActiveTab('add')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Payout Method
                  </Button>
                </div>
              ) : (
                payoutMethods.map((method) => (
                  <div key={method.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getMethodIcon(method.type)}
                        <div>
                          <h4 className="font-semibold">{method.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {method.address.length > 20 
                              ? `${method.address.substring(0, 20)}...` 
                              : method.address}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {method.isDefault && (
                          <Badge variant="default">
                            <Star className="h-3 w-3 mr-1" />
                            Default
                          </Badge>
                        )}
                        {method.isVerified ? (
                          <Badge variant="secondary" className="text-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-yellow-600">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Currency:</span>
                        <p className="font-medium">{method.currency}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Min Amount:</span>
                        <p className="font-medium">${method.minimumAmount}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Processing:</span>
                        <p className="font-medium">{method.processingTime}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Fees:</span>
                        <p className="font-medium">{method.fees}</p>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      {!method.isDefault && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setDefaultMethod(method.id)}
                        >
                          Set as Default
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => deletePayoutMethod(method.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="add" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add New Payout Method</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Payment Method Type</Label>
                <Select value={newMethod.type} onValueChange={(value) => 
                  setNewMethod({ ...newMethod, type: value })
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="crypto">
                      <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4" />
                        Cryptocurrency (Fastest)
                      </div>
                    </SelectItem>
                    <SelectItem value="paypal">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        PayPal
                      </div>
                    </SelectItem>
                    <SelectItem value="bank">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Bank Transfer
                      </div>
                    </SelectItem>
                    <SelectItem value="wise">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        Wise Transfer
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newMethod.type === 'crypto' && (
                <div className="space-y-2">
                  <Label>Cryptocurrency</Label>
                  <Select value={newMethod.currency} onValueChange={(value) => 
                    setNewMethod({ ...newMethod, currency: value })
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USDT">USDT (TRC20) - Recommended</SelectItem>
                      <SelectItem value="USDC">USDC (ERC20)</SelectItem>
                      <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                      <SelectItem value="ETH">Ethereum (ETH)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>
                  {newMethod.type === 'crypto' ? 'Wallet Address' : 
                   newMethod.type === 'paypal' ? 'PayPal Email' :
                   newMethod.type === 'bank' ? 'Account Number' : 'Account Details'}
                </Label>
                <Input
                  placeholder={
                    newMethod.type === 'crypto' ? 'Enter your wallet address' :
                    newMethod.type === 'paypal' ? 'Enter your PayPal email' :
                    newMethod.type === 'bank' ? 'Enter your account number' :
                    'Enter account details'
                  }
                  value={newMethod.address}
                  onChange={(e) => setNewMethod({ ...newMethod, address: e.target.value })}
                />
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium mb-2">Method Details:</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Minimum Amount:</span>
                    <p className="font-medium">${getMinimumAmount(newMethod.type)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Processing Time:</span>
                    <p className="font-medium">{getProcessingTime(newMethod.type)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Fees:</span>
                    <p className="font-medium">{getFees(newMethod.type)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Auto Payout:</span>
                    <p className="font-medium">Yes</p>
                  </div>
                </div>
              </div>

              <Button 
                onClick={addPayoutMethod} 
                disabled={loading || !newMethod.address.trim()}
                className="w-full"
              >
                {loading ? 'Adding...' : 'Add Payout Method'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Payouts</CardTitle>
            </CardHeader>
            <CardContent>
              {recentPayouts.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Payouts Yet</h3>
                  <p className="text-muted-foreground">
                    Your payout history will appear here once you start receiving payments
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentPayouts.map((payout: any) => (
                    <div key={payout.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-semibold">${payout.amount}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(payout.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge 
                          variant={
                            payout.status === 'completed' ? 'default' :
                            payout.status === 'processing' ? 'secondary' : 'destructive'
                          }
                        >
                          {payout.status}
                        </Badge>
                      </div>
                      {payout.transaction_id && (
                        <p className="text-xs text-muted-foreground font-mono">
                          TX: {payout.transaction_id}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}