import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, DollarSign, Eye, Download, Star, TrendingUp } from 'lucide-react';
import { Profile, Product } from '@/types/database';
import { supabase } from '@/integrations/supabase/clients';

interface SellerStatsProps {
  profile: Profile;
  products: Product[];
}

interface StatsData {
  totalViews: number;
  totalDownloads: number;
  averageRating: number;
  totalReviews: number;
  pendingProducts: number;
  approvedProducts: number;
  thisMonthEarnings: number;
  thisMonthSales: number;
}

export function SellerStats({ profile, products }: SellerStatsProps) {
  const [stats, setStats] = useState<StatsData>({
    totalViews: 0,
    totalDownloads: 0,
    averageRating: 0,
    totalReviews: 0,
    pendingProducts: 0,
    approvedProducts: 0,
    thisMonthEarnings: 0,
    thisMonthSales: 0,
  });

  useEffect(() => {
    calculateStats();
    fetchMonthlyStats();
  }, [products, profile]);

  const calculateStats = () => {
    const totalViews = products.reduce((sum, product) => sum + product.view_count, 0);
    const totalDownloads = products.reduce((sum, product) => sum + product.download_count, 0);
    const totalReviews = products.reduce((sum, product) => sum + product.review_count, 0);
    const totalRatingSum = products.reduce((sum, product) => sum + (product.average_rating * product.review_count), 0);
    const averageRating = totalReviews > 0 ? totalRatingSum / totalReviews : 0;
    const pendingProducts = products.filter(p => p.status === 'pending').length;
    const approvedProducts = products.filter(p => p.status === 'approved').length;

    setStats(prev => ({
      ...prev,
      totalViews,
      totalDownloads,
      averageRating,
      totalReviews,
      pendingProducts,
      approvedProducts,
    }));
  };

  const fetchMonthlyStats = async () => {
    try {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: monthlyOrders, error } = await supabase
        .from('orders')
        .select('seller_earnings')
        .eq('seller_id', profile.id)
        .eq('status', 'completed')
        .gte('completed_at', startOfMonth.toISOString());

      if (error) throw error;

      const thisMonthEarnings = monthlyOrders?.reduce((sum, order) => sum + order.seller_earnings, 0) || 0;
      const thisMonthSales = monthlyOrders?.length || 0;

      setStats(prev => ({
        ...prev,
        thisMonthEarnings,
        thisMonthSales,
      }));
    } catch (error) {
      console.error('Error fetching monthly stats:', error);
    }
  };

  const statCards = [
    {
      title: 'Total Products',
      value: products.length,
      description: `${stats.approvedProducts} approved, ${stats.pendingProducts} pending`,
      icon: Package,
      color: 'text-blue-600',
    },
    {
      title: 'Total Earnings',
      value: `$${profile.total_earnings?.toFixed(2) || '0.00'}`,
      description: `$${stats.thisMonthEarnings.toFixed(2)} this month`,
      icon: DollarSign,
      color: 'text-green-600',
    },
    {
      title: 'Total Views',
      value: stats.totalViews.toLocaleString(),
      description: 'Across all products',
      icon: Eye,
      color: 'text-purple-600',
    },
    {
      title: 'Total Downloads',
      value: stats.totalDownloads.toLocaleString(),
      description: `${stats.thisMonthSales} this month`,
      icon: Download,
      color: 'text-orange-600',
    },
    {
      title: 'Average Rating',
      value: stats.averageRating.toFixed(1),
      description: `${stats.totalReviews} total reviews`,
      icon: Star,
      color: 'text-yellow-600',
    },
    {
      title: 'Total Sales',
      value: profile.total_sales || 0,
      description: `${stats.thisMonthSales} this month`,
      icon: TrendingUp,
      color: 'text-indigo-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Seller Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Seller Status</CardTitle>
              <CardDescription>Your current seller verification status</CardDescription>
            </div>
            <Badge 
              variant={profile.is_verified_seller ? "default" : "secondary"}
              className={profile.is_verified_seller ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}
            >
              {profile.is_verified_seller ? 'Verified Seller' : 'Pending Verification'}
            </Badge>
          </div>
        </CardHeader>
        {!profile.is_verified_seller && (
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Complete your seller verification to unlock all features and increase buyer trust.
            </p>
          </CardContent>
        )}
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      {products.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
            <CardDescription>Welcome to your seller dashboard!</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              You haven't uploaded any products yet. Start by uploading your first digital product to the marketplace.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full" />
                <span>Upload high-quality products with detailed descriptions</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full" />
                <span>Set competitive pricing for your target market</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full" />
                <span>Add relevant tags and categories for better discoverability</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full" />
                <span>Provide live preview links and documentation when available</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}