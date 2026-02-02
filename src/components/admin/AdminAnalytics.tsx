import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, DollarSign, Users, Package, ShoppingCart, Calendar, BarChart3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/clients';
import { useToast } from '@/hooks/use-toast';

interface AnalyticsData {
  totalRevenue: number;
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  revenueGrowth: number;
  userGrowth: number;
  productGrowth: number;
  orderGrowth: number;
  topCategories: Array<{ category: string; count: number; revenue: number }>;
  recentActivity: Array<{ date: string; revenue: number; orders: number; users: number }>;
}

export function AdminAnalytics() {
  const { toast } = useToast();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      startDate.setDate(endDate.getDate() - days);

      // Fetch total counts
      const [usersResult, productsResult, ordersResult] = await Promise.all([
        supabase.from('profiles').select('id, created_at, total_earnings'),
        supabase.from('products').select('id, created_at, category, price'),
        supabase.from('orders').select('id, created_at, price, status')
      ]);

      if (usersResult.error) throw usersResult.error;
      if (productsResult.error) throw productsResult.error;
      if (ordersResult.error) throw ordersResult.error;

      const users = usersResult.data || [];
      const products = productsResult.data || [];
      const orders = ordersResult.data || [];

      // Calculate metrics
      const totalRevenue = orders
        .filter(order => order.status === 'completed')
        .reduce((sum, order) => sum + (order.price || 0), 0);

      const totalUsers = users.length;
      const totalProducts = products.length;
      const totalOrders = orders.length;

      // Calculate growth (comparing to previous period)
      const previousStartDate = new Date(startDate);
      previousStartDate.setDate(previousStartDate.getDate() - days);

      const previousUsers = users.filter(user => 
        new Date(user.created_at) >= previousStartDate && 
        new Date(user.created_at) < startDate
      ).length;

      const previousProducts = products.filter(product => 
        new Date(product.created_at) >= previousStartDate && 
        new Date(product.created_at) < startDate
      ).length;

      const previousOrders = orders.filter(order => 
        new Date(order.created_at) >= previousStartDate && 
        new Date(order.created_at) < startDate
      ).length;

      const previousRevenue = orders
        .filter(order => 
          order.status === 'completed' &&
          new Date(order.created_at) >= previousStartDate && 
          new Date(order.created_at) < startDate
        )
        .reduce((sum, order) => sum + (order.price || 0), 0);

      const currentUsers = users.filter(user => 
        new Date(user.created_at) >= startDate
      ).length;

      const currentProducts = products.filter(product => 
        new Date(product.created_at) >= startDate
      ).length;

      const currentOrders = orders.filter(order => 
        new Date(order.created_at) >= startDate
      ).length;

      const currentRevenue = orders
        .filter(order => 
          order.status === 'completed' &&
          new Date(order.created_at) >= startDate
        )
        .reduce((sum, order) => sum + (order.price || 0), 0);

      // Calculate growth percentages
      const userGrowth = previousUsers > 0 ? ((currentUsers - previousUsers) / previousUsers) * 100 : 0;
      const productGrowth = previousProducts > 0 ? ((currentProducts - previousProducts) / previousProducts) * 100 : 0;
      const orderGrowth = previousOrders > 0 ? ((currentOrders - previousOrders) / previousOrders) * 100 : 0;
      const revenueGrowth = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;

      // Calculate top categories
      const categoryStats = products.reduce((acc, product) => {
        const category = product.category || 'uncategorized';
        if (!acc[category]) {
          acc[category] = { count: 0, revenue: 0 };
        }
        acc[category].count++;
        
        // Calculate revenue for this category from orders
        const categoryRevenue = orders
          .filter(order => {
            // This is a simplified approach - in reality you'd join with products
            return order.status === 'completed';
          })
          .reduce((sum, order) => sum + (order.price || 0), 0);
        
        acc[category].revenue += categoryRevenue / products.length; // Simplified distribution
        return acc;
      }, {} as Record<string, { count: number; revenue: number }>);

      const topCategories = Object.entries(categoryStats)
        .map(([category, stats]) => ({ category, ...stats }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Generate recent activity (simplified)
      const recentActivity = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayOrders = orders.filter(order => 
          order.created_at.startsWith(dateStr)
        );
        
        const dayRevenue = dayOrders
          .filter(order => order.status === 'completed')
          .reduce((sum, order) => sum + (order.price || 0), 0);
        
        const dayUsers = users.filter(user => 
          user.created_at.startsWith(dateStr)
        ).length;

        recentActivity.push({
          date: dateStr,
          revenue: dayRevenue,
          orders: dayOrders.length,
          users: dayUsers
        });
      }

      setAnalytics({
        totalRevenue,
        totalUsers,
        totalProducts,
        totalOrders,
        revenueGrowth,
        userGrowth,
        productGrowth,
        orderGrowth,
        topCategories,
        recentActivity
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load analytics data',
        variant: 'destructive',
      });
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

  const formatGrowth = (growth: number) => {
    const isPositive = growth >= 0;
    return (
      <div className={`flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        <span className="text-xs font-medium">
          {isPositive ? '+' : ''}{growth.toFixed(1)}%
        </span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div>Loading analytics...</div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center p-8">
        <div>Failed to load analytics data</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Analytics Dashboard</h2>
          <p className="text-muted-foreground">
            Platform performance and key metrics
          </p>
        </div>
        
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analytics.totalRevenue)}</div>
            {formatGrowth(analytics.revenueGrowth)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalUsers.toLocaleString()}</div>
            {formatGrowth(analytics.userGrowth)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalProducts.toLocaleString()}</div>
            {formatGrowth(analytics.productGrowth)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalOrders.toLocaleString()}</div>
            {formatGrowth(analytics.orderGrowth)}
          </CardContent>
        </Card>
      </div>

      {/* Charts and Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Top Categories
            </CardTitle>
            <CardDescription>
              Best performing product categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.topCategories.map((category, index) => (
                <div key={category.category} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium capitalize">{category.category}</p>
                      <p className="text-xs text-muted-foreground">
                        {category.count} products
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(category.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Daily activity over the selected period
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.recentActivity.slice(-7).map((day) => (
                <div key={day.date} className="flex items-center justify-between text-sm">
                  <div className="font-medium">
                    {new Date(day.date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </div>
                  <div className="flex gap-4 text-muted-foreground">
                    <span>{formatCurrency(day.revenue)}</span>
                    <span>{day.orders} orders</span>
                    <span>{day.users} users</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}