import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wallet, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/clients';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const SUPPORTED_NETWORKS = [
  { value: 'TRC20', label: 'TRC20 (USDT - Tron)', recommended: true },
  { value: 'ERC20', label: 'ERC20 (USDT - Ethereum)' },
  { value: 'BEP20', label: 'BEP20 (USDT - BSC)' },
  { value: 'BTC', label: 'Bitcoin (BTC)' },
  { value: 'ETH', label: 'Ethereum (ETH)' },
  { value: 'LTC', label: 'Litecoin (LTC)' },
];

export function CryptoWalletSetup() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [network, setNetwork] = useState('TRC20');
  const [hasWallet, setHasWallet] = useState(false);

  useEffect(() => {
    if (user) {
      loadWalletInfo();
    }
  }, [user]);

  const loadWalletInfo = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('seller_profiles')
        .select('crypto_wallet_address, crypto_wallet_network, crypto_wallet_verified')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;

      if (data?.crypto_wallet_address) {
        setWalletAddress(data.crypto_wallet_address);
        setNetwork(data.crypto_wallet_network || 'TRC20');
        setHasWallet(true);
      }
    } catch (error: any) {
      console.error('Error loading wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateWalletAddress = (address: string, network: string): boolean => {
    if (!address || address.trim().length === 0) return false;

    // Basic validation based on network
    switch (network) {
      case 'TRC20':
        return address.startsWith('T') && address.length === 34;
      case 'ERC20':
      case 'BEP20':
      case 'ETH':
        return address.startsWith('0x') && address.length === 42;
      case 'BTC':
        return (address.startsWith('1') || address.startsWith('3') || address.startsWith('bc1')) && 
               address.length >= 26 && address.length <= 35;
      case 'LTC':
        return (address.startsWith('L') || address.startsWith('M') || address.startsWith('ltc1')) && 
               address.length >= 26 && address.length <= 35;
      default:
        return address.length > 20;
    }
  };

  const handleSave = async () => {
    if (!walletAddress.trim()) {
      toast.error('Please enter a wallet address');
      return;
    }

    if (!validateWalletAddress(walletAddress, network)) {
      toast.error(`Invalid ${network} wallet address format`);
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('seller_profiles')
        .update({
          crypto_wallet_address: walletAddress.trim(),
          crypto_wallet_network: network,
          crypto_wallet_verified: true,
          crypto_wallet_verified_at: new Date().toISOString(),
        })
        .eq('user_id', user?.id);

      if (error) throw error;

      setHasWallet(true);
      toast.success('Crypto wallet saved successfully!');
    } catch (error: any) {
      console.error('Error saving wallet:', error);
      toast.error('Failed to save wallet: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!confirm('Are you sure you want to remove your crypto wallet? You will not receive automatic payouts.')) {
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('seller_profiles')
        .update({
          crypto_wallet_address: null,
          crypto_wallet_network: null,
          crypto_wallet_verified: false,
          crypto_wallet_verified_at: null,
        })
        .eq('user_id', user?.id);

      if (error) throw error;

      setWalletAddress('');
      setNetwork('TRC20');
      setHasWallet(false);
      toast.success('Crypto wallet removed');
    } catch (error: any) {
      console.error('Error removing wallet:', error);
      toast.error('Failed to remove wallet: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">Loading wallet info...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          <CardTitle>Crypto Wallet for Payouts</CardTitle>
        </div>
        <CardDescription>
          Set up your crypto wallet to receive 90% of sales automatically. If no wallet is set, 100% goes to platform.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Info Alert */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>How it works:</strong> When a customer buys your product, 90% is automatically sent to your crypto wallet, 
            and 10% goes to the platform. Without a wallet, 100% goes to the platform and you'll need to request manual payouts.
          </AlertDescription>
        </Alert>

        {/* Status */}
        {hasWallet && (
          <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              Wallet configured! You'll receive 90% of sales automatically.
            </AlertDescription>
          </Alert>
        )}

        {!hasWallet && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No wallet configured. 100% of sales will go to the platform until you add a wallet.
            </AlertDescription>
          </Alert>
        )}

        {/* Network Selection */}
        <div className="space-y-2">
          <Label htmlFor="network">Blockchain Network</Label>
          <Select value={network} onValueChange={setNetwork}>
            <SelectTrigger id="network">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_NETWORKS.map((net) => (
                <SelectItem key={net.value} value={net.value}>
                  {net.label} {net.recommended && '(Recommended)'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            TRC20 (USDT on Tron) is recommended for lowest fees
          </p>
        </div>

        {/* Wallet Address */}
        <div className="space-y-2">
          <Label htmlFor="wallet">Wallet Address</Label>
          <Input
            id="wallet"
            placeholder={`Enter your ${network} wallet address`}
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            disabled={saving}
          />
          <p className="text-xs text-muted-foreground">
            Make sure this address is correct. Payments cannot be reversed.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving || !walletAddress.trim()}>
            {saving ? 'Saving...' : hasWallet ? 'Update Wallet' : 'Save Wallet'}
          </Button>
          {hasWallet && (
            <Button variant="outline" onClick={handleRemove} disabled={saving}>
              Remove Wallet
            </Button>
          )}
        </div>

        {/* Warning */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <strong>Important:</strong> Double-check your wallet address. Sending crypto to the wrong address 
            will result in permanent loss of funds. We recommend testing with a small amount first.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
