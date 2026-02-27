import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Store, DollarSign, Users, Shield } from 'lucide-react';

export default function UpgradeToSeller() {
  const { profile, updateProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    if (!profile) return;
    
    // Redirect to seller verification process
    navigate('/seller-verification');
  };

  if (!profile) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in first</h1>
          <Button asChild>
            <a href="/auth">Sign In</a>
          </Button>
        </div>
      </MainLayout>
    );
  }

  if (profile.role === 'seller' || profile.role === 'admin') {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">You're already a seller!</h1>
          <p className="text-muted-foreground mb-6">
            Start listing your products and earning money on Seltech.
          </p>
          <Button asChild>
            <a href="/marketplace">Go to Marketplace</a>
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold mb-4">Become a Seller</h1>
            <p className="text-lg text-muted-foreground">
              Join thousands of developers earning passive income on Seltech
            </p>
          </div>

          {/* Benefits */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <Card>
              <CardContent className="p-6 text-center">
                <DollarSign className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">90% Earnings</h3>
                <p className="text-sm text-muted-foreground">
                  Keep 90% of every sale - one of the highest rates in the industry
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <Store className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Easy Setup</h3>
                <p className="text-sm text-muted-foreground">
                  List your products in minutes with our simple upload process
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Global Reach</h3>
                <p className="text-sm text-muted-foreground">
                  Sell to developers worldwide with cryptocurrency payments (BTC, ETH, USDT)
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Secure Platform</h3>
                <p className="text-sm text-muted-foreground">
                  Your products and earnings are protected by enterprise security
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Upgrade Card */}
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle>Upgrade Your Account</CardTitle>
              <CardDescription>
                Complete our verification process to start selling
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  <strong>Current account:</strong> {profile.email}
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Current role:</strong> {profile.role}
                </p>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">What you'll get:</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>✅ Ability to list and sell products</li>
                  <li>✅ Access to seller dashboard</li>
                  <li>✅ 90% of all sales revenue</li>
                  <li>✅ Crypto payout options</li>
                  <li>✅ Product analytics and insights</li>
                </ul>
              </div>

              <Button 
                onClick={handleUpgrade} 
                className="w-full"
              >
                Start Verification Process
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Complete our verification process to become a seller
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}