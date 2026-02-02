import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wallet, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { PaymentService } from '@/lib/payment-service';
import { SUPPORTED_CURRENCIES } from '@/lib/cryptomus';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export function WalletConfiguration() {
  const { profile, updateProfile } = useAuth();
  const [walletAddress, setWalletAddress] = useState(profile?.wallet_address || '');
  const [selectedCurrency, setSelectedCurrency] = useState('USDT');
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState('');

  const handleSaveWallet = async () => {
    if (!walletAddress.trim()) {
      setValidationError('Wallet address is required');
      return;
    }

    // Validate wallet address format
    if (!PaymentService.validateWalletAddress(walletAddress, selectedCurrency)) {
      setValidationError(`Invalid ${selectedCurrency} wallet address format`);
      return;
    }

    setLoading(true);
    setValidationError('');

    try {
      const { error } = await updateProfile({
        wallet_address: walletAddress.trim(),
      });

      if (error) {
        toast.error('Failed to update wallet address');
      } else {
        toast.success('Wallet address updated successfully');
      }
    } catch (error) {
      console.error('Error updating wallet:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleAddressChange = (value: string) => {
    setWalletAddress(value);
    setValidationError('');
  };

  const isValidAddress = walletAddress && PaymentService.validateWalletAddress(walletAddress, selectedCurrency);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Payout Wallet Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Configure your cryptocurrency wallet to receive automatic payouts when customers purchase your products. 
            You'll receive 90% of each sale directly to your wallet.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currency">Preferred Cryptocurrency</Label>
            <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_CURRENCIES.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    <div className="flex items-center gap-2">
                      <span>{currency.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {currency.network}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="wallet">Wallet Address</Label>
            <div className="relative">
              <Input
                id="wallet"
                placeholder={`Enter your ${selectedCurrency} wallet address`}
                value={walletAddress}
                onChange={(e) => handleAddressChange(e.target.value)}
                className={validationError ? 'border-red-500' : isValidAddress ? 'border-green-500' : ''}
              />
              {isValidAddress && (
                <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
              )}
            </div>
            {validationError && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {validationError}
              </p>
            )}
          </div>

          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <h4 className="font-medium text-sm">Wallet Address Requirements:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Must be a valid {selectedCurrency} address on {SUPPORTED_CURRENCIES.find(c => c.code === selectedCurrency)?.network} network</li>
              <li>• Double-check the address - incorrect addresses may result in lost funds</li>
              <li>• You can update this address anytime, but it only affects future payouts</li>
            </ul>
          </div>

          <Button 
            onClick={handleSaveWallet} 
            disabled={loading || !isValidAddress}
            className="w-full"
          >
            {loading ? 'Saving...' : 'Save Wallet Address'}
          </Button>
        </div>

        {profile?.wallet_address && (
          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">Current Configuration</h4>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                  Wallet Configured
                </span>
              </div>
              <p className="text-xs text-green-600 dark:text-green-400 font-mono break-all">
                {profile.wallet_address}
              </p>
            </div>
          </div>
        )}

        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">How Payouts Work</h4>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• Automatic payouts are processed when a customer completes payment</li>
            <li>• You receive 90% of the sale price in cryptocurrency</li>
            <li>• Payouts typically arrive within 10-30 minutes after payment confirmation</li>
            <li>• All transactions are recorded in your seller dashboard</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}