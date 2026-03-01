import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Wallet, 
  Plus, 
  Trash2, 
  Star, 
  CheckCircle, 
  AlertTriangle, 
  Copy,
  ExternalLink,
  Zap,
  Shield,
  Clock,
  DollarSign
} from 'lucide-react';
import { LiveCryptoPayout, CryptoWallet } from '@/lib/live-crypto-payout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/clients';
import { toast } from 'sonner';

export function CryptoWalletSetup() {
  const { profile } = useAuth();
  const [wallets, setWallets] = useState<CryptoWallet[]>([]);
  const [loading, setLoading] = useState(false);
  const [pendingBalance, setPendingBalance] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form state for adding new wallet
  const [newWallet, setNewWallet] = useState({
    currency: 'USDT',
    network: 'TRC20',
    address: '',
    label: ''
  });

  const supportedCurrencies = LiveCryptoPayout.getSupportedCurrencies();

  useEffect(() => {
    if (profile) {
      fetchWallets();
      fetchStats();
    }
  }, [profile]);

  const fetchWallets = async () => {
    try {
      // Use the existing wallet_address field from profiles table
      if (profile?.wallet_address) {
        const cryptoWallets: CryptoWallet[] = [{
          id: 'profile-wallet',
          sellerId: profile.user_id,
          currency: 'USDT',
          network: 'TRC20',
          address: profile.wallet_address,
          isDefault: true,
          isVerified: true,
          label: 'Main Wallet'
        }];
        setWallets(cryptoWallets);
      } else {
        setWallets([]);
      }
    } catch (error) {
      console.error('Error fetching wallets:', error);
      toast.error('Failed to load crypto wallets');
    }
  };

  const fetchStats = async () => {
    try {
      // Calculate stats from existing orders and payouts
      const [ordersResult, payoutsResult] = await Promise.all([
        supabase
          .from('orders')
          .select('seller_earnings, status')
          .eq('seller_id', profile?.user_id),
        supabase
          .from('payouts')
          .select('amount, status')
          .eq('seller_id', profile?.user_id)
      ]);

      const totalEarnings = (ordersResult.data || [])
        .filter(o => o.status === 'paid')
        .reduce((sum, o) => sum + (o.seller_earnings || 0), 0);

      const totalPayouts = (payoutsResult.data || [])
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + (p.amount || 0), 0);

      const pendingBalance = Math.max(0, totalEarnings - totalPayouts);

      setPendingBalance(pendingBalance);
      setTotalEarnings(profile?.total_earnings || totalEarnings);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const addWallet = async () => {
    if (!newWallet.address.trim()) {
      toast.error('Please enter a valid wallet address');
      return;
    }

    // Validate wallet address
    if (!LiveCryptoPayout.validateWalletAddress(newWallet.address, newWallet.currency, newWallet.network)) {
      toast.error(`Invalid ${newWallet.currency} (${newWallet.network}) wallet address`);
      return;
    }

    setLoading(true);
    try {
      // Update the profile's wallet_address field
      const { error } = await supabase
        .from('profiles')
        .update({ wallet_address: newWallet.address.trim() })
        .eq('user_id', profile?.user_id);

      if (error) throw error;

      toast.success('Crypto wallet added successfully! 🎉');
      setNewWallet({
        currency: 'USDT',
        network: 'TRC20',
        address: '',
        label: ''
      });
      setShowAddForm(false);
      
      await fetchWallets();
    } catch (error: any) {
      console.error('Error adding wallet:', error);
      toast.error('Failed to add crypto wallet');
    } finally {
      setLoading(false);
    }
  };

  const setDefaultWallet = async (walletId: string) => {
    // Since we only have one wallet in profile, this is already default
    toast.success('This is your default wallet');
  };

  const deleteWallet = async (walletId: string) => {
    try {
      // Clear the wallet_address from profile
      await supabase
        .from('profiles')
        .update({ wallet_address: null })
        .eq('user_id', profile?.user_id);

      toast.success('Crypto wallet deleted');
      await fetchWallets();
    } catch (error) {
      console.error('Error deleting wallet:', error);
      toast.error('Failed to delete wallet');
    }
  };

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast.success('Address copied to clipboard');
  };

  const getCurrencyInfo = (currency: string, network: string) => {
    return supportedCurrencies.find(c => c.currency === currency && c.network === network);
  };

  const formatAddress = (address: string) => {
    if (address.length <= 20) return address;
    return `${address.substring(0, 10)}...${address.substring(address.length - 10)}`;
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
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
                <Wallet className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Crypto Wallets</p>
                <p className="text-2xl font-bold">{wallets.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Balance Alert */}
      {pendingBalance >= 10 && (
        <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
          <Zap className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            <div className="flex items-center justify-between">
              <span>You have ${pendingBalance.toFixed(2)} ready for payout!</span>
              <Badge className="bg-green-600 text-white">Ready</Badge>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Crypto Wallets
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Receive 90% of your sales automatically in cryptocurrency
              </p>
            </div>
            <Button onClick={() => setShowAddForm(true)} disabled={showAddForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Wallet
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Add Wallet Form */}
          {showAddForm && (
            <Card className="border-2 border-dashed border-primary/20">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Add New Crypto Wallet</h3>
                  <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
                    ✕
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cryptocurrency</Label>
                    <Select 
                      value={newWallet.currency} 
                      onValueChange={(value) => {
                        const currency = supportedCurrencies.find(c => c.currency === value);
                        setNewWallet({ 
                          ...newWallet, 
                          currency: value,
                          network: currency?.network || 'TRC20'
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {supportedCurrencies.map((currency) => (
                          <SelectItem key={`${currency.currency}_${currency.network}`} value={currency.currency}>
                            <div className="flex items-center gap-2">
                              <span>{currency.name}</span>
                              {currency.recommended && (
                                <Badge variant="secondary" className="text-xs">Recommended</Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Network</Label>
                    <Input 
                      value={newWallet.network} 
                      disabled 
                      className="bg-muted"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Wallet Address</Label>
                  <Input
                    placeholder={`Enter your ${newWallet.currency} (${newWallet.network}) wallet address`}
                    value={newWallet.address}
                    onChange={(e) => setNewWallet({ ...newWallet, address: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Label (Optional)</Label>
                  <Input
                    placeholder="e.g., My Main USDT Wallet"
                    value={newWallet.label}
                    onChange={(e) => setNewWallet({ ...newWallet, label: e.target.value })}
                  />
                </div>

                {/* Currency Info */}
                {(() => {
                  const currencyInfo = getCurrencyInfo(newWallet.currency, newWallet.network);
                  return currencyInfo && (
                    <div className="bg-muted/50 rounded-lg p-4">
                      <h4 className="font-medium mb-2">Payout Details:</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Minimum:</span>
                          <p className="font-medium">${currencyInfo.minAmount}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Processing:</span>
                          <p className="font-medium">{currencyInfo.processingTime}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Fees:</span>
                          <p className="font-medium">{currencyInfo.fees}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Auto Payout:</span>
                          <p className="font-medium text-green-600">Yes</p>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                <div className="flex gap-2">
                  <Button 
                    onClick={addWallet} 
                    disabled={loading || !newWallet.address.trim()}
                    className="flex-1"
                  >
                    {loading ? 'Adding...' : 'Add Wallet'}
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Wallets List */}
          {wallets.length === 0 ? (
            <div className="text-center py-12">
              <Wallet className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Crypto Wallets</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Add your crypto wallet to receive 90% of your sales automatically. 
                Payouts arrive in 10-30 minutes!
              </p>
              {!showAddForm && (
                <Button onClick={() => setShowAddForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Wallet
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {wallets.map((wallet) => {
                const currencyInfo = getCurrencyInfo(wallet.currency, wallet.network);
                return (
                  <div key={wallet.id} className="border rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Wallet className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold">{wallet.label}</h4>
                          <p className="text-sm text-muted-foreground">
                            {wallet.currency} ({wallet.network})
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {wallet.isDefault && (
                          <Badge className="bg-primary text-primary-foreground">
                            <Star className="h-3 w-3 mr-1" />
                            Default
                          </Badge>
                        )}
                        <Badge variant="secondary" className="text-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      </div>
                    </div>

                    {/* Wallet Address */}
                    <div className="bg-muted/50 rounded-lg p-3 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sm">{formatAddress(wallet.address)}</span>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyAddress(wallet.address)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(`https://tronscan.org/#/address/${wallet.address}`, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Wallet Details */}
                    {currencyInfo && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                        <div>
                          <span className="text-muted-foreground">Minimum:</span>
                          <p className="font-medium">${currencyInfo.minAmount}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Processing:</span>
                          <p className="font-medium">{currencyInfo.processingTime}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Fees:</span>
                          <p className="font-medium">{currencyInfo.fees}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Status:</span>
                          <p className="font-medium text-green-600">Active</p>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      {!wallet.isDefault && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setDefaultWallet(wallet.id)}
                        >
                          <Star className="h-4 w-4 mr-1" />
                          Set as Default
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => deleteWallet(wallet.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Security Notice */}
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <strong>Security Notice:</strong> Double-check your wallet address before adding. 
              Incorrect addresses will result in lost funds. We recommend testing with a small amount first.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}