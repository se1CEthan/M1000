import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  Download, 
  DollarSign,
  Calendar,
  BarChart3,
  PieChart,
  RefreshCw
} from 'lucide-react';
import { useSellerStats } from '@/hooks/useSellerStats';
import { supabase } from '@/integrations/supabase/clients';
import { useAuth } from '@/hooks/useAuth';

interface AnalyticsData {
  dailyStats: Array<{
    date: string;
    views: number;
    sales: number;
    revenue: number;
  }>;
  productPerformance: Array<{
    id: string;
    title: string;
    views: number;
    sales: number;
    revenue: number;
    conversionRate: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    count: number;
    revenue: number;
  }>;
}

export function SellerAnalytics() {
  const { profile } = useAuth();
  const { stats, loading: statsLoading } = useSellerStats();
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    dailyStats: [],
    productPerformance: [],
    categoryBreakdown: []
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  const fetchAnalytics = async () => {
    if (!profile?.id) return;

    try {
      setLoading(true);

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      startDate.setDate(endDate.getDate() - days);

      // Fetch products and orders for analytics
      const [productsResult, ordersResult] = await Promise.all([
        supabase
          .from('products')
          .select('*')
          .eq('seller_id', profile.id),
        supabase
          .from('orders')
          .select('*')
          .eq('seller_id', profile.id)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString())
      ]);

      if (productsResult.error) throw productsResult.error;
      if (ordersResult.error) throw ordersResult.error;

      const products = productsResult.data || [];
      const orders = ordersResult.data || [];

      // Enrich orders with product information
      const enrichedOrders = await Promise.all(
        orders.map(async (order) => {
          if (order.product_id) {
            try {
              const productResult = await supabase
                .from('products')
                .select('title, category, price')
                .eq('id', order.product_id)
                .single();
              
              return {
                ...order,
                product: productResult.data || { title: 'Unknown', category: 'other', price: order.price }
              };
            } catch (error) {
              return {
                ...order,
                product: { title: 'Unknown', category: 'other', price: order.price }
              };
            }
          }
          return {
            ...order,
            product: { title: 'Unknown', category: 'other', price: order.price }
          };
        })
      );

      // Generate daily stats
      const dailyStats = [];
      for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayOrders = enrichedOrders.filter(o => 
          o.created_at.startsWith(dateStr)
        );
        
        const paidOrders = dayOrders.filter(o => o.status === 'paid');
        
        dailyStats.push({
          date: dateStr,
          views: 0, // Would need view tracking
          sales: paidOrders.length,
          revenue: paidOrders.reduce((sum, o) => sum + (o.seller_earnings || o.price * 0.9 || 0), 0)
        });
      }

      // Product performance analysis
      const productPerformance = products.map(product => {
        const productOrders = enrichedOrders.filter(o => o.product_id === product.id);
        const paidOrders = productOrders.filter(o => o.status === 'paid');
        const revenue = paidOrders.reduce((sum, o) => sum + (o.seller_earnings || o.price * 0.9 || 0), 0);
        const views = product.view_count || 0;
        const sales = paidOrders.length;
        
        return {
          id: product.id,
          title: product.title,
          views,
          sales,
          revenue,
          conversionRate: views > 0 ? (sales / views) * 100 : 0
        };
      }).sort((a, b) => b.revenue - a.revenue);

      // Category breakdown
      const categoryMap = new Map();
      products.forEach(product => {
        const category = product.category || 'other';
        const productOrders = enrichedOrders.filter(o => o.product_id === product.id && o.status === 'paid');
        const revenue = productOrders.reduce((sum, o) => sum + (o.seller_earnings || o.price * 0.9 || 0), 0);
        
        if (categoryMap.has(category)) {
          const existing = categoryMap.get(category);
          categoryMap.set(category, {
            count: existing.count + 1,
            revenue: existing.revenue + revenue
          });
        } else {
          categoryMap.set(category, { count: 1, revenue });
        }
      });

      const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, data]) => ({
        category,
        count: data.count,
        revenue: data.revenue
      })).sort((a, b) => b.revenue - a.revenue);

      setAnalytics({
        dailyStats,
        productPerformance,
        categoryBreakdown
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [profile?.id, timeRange]);

  const totalRevenue = analytics.dailyStats.reduce((sum, day) => sum + day.revenue, 0);
  const totalSales = analytics.dailyStats.reduce((sum, day) => sum + day.sales, 0);
  const avgDailyRevenue = analytics.dailyStats.length > 0 ? totalRevenue / analytics.dailyStats.length : 0;

  // Calculate trends (compare first half vs second half of period)
  const midPoint = Math.floor(analytics.dailyStats.length / 2);
  const firstHalf = analytics.dailyStats.slice(0, midPoint);
  const secondHalf = analytics.dailyStats.slice(midPoint);
  
  const firstHalfRevenue = firstHalf.reduce((sum, day) => sum + day.revenue, 0);
  const secondHalfRevenue = secondHalf.reduce((sum, day) => sum + day.revenue, 0);
  const revenueTrend = firstHalfRevenue > 0 ? ((secondHalfRevenue - firstHalfRevenue) / firstHalfRevenue) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-muted-foreground">Track your performance and growth</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-muted rounded-lg p-1">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTimeRange(range)}
                className="text-xs"
              >
                {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
              </Button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={fetchAnalytics} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Period Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {revenueTrend >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              {Math.abs(revenueTrend).toFixed(1)}% vs previous period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <Download className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSales}</div>
            <p className="text-xs text-muted-foreground">
              Avg {(totalSales / (analytics.dailyStats.length || 1)).toFixed(1)} per day
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Daily Revenue</CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${avgDailyRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Based on {analytics.dailyStats.length} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Product</CardTitle>
            <BarChart3 className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.productPerformance[0]?.sales || 0}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {analytics.productPerformance[0]?.title || 'No sales yet'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Daily Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading chart...</div>
              ) : analytics.dailyStats.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No data for selected period</div>
              ) : (
                <div className="space-y-2">
                  {analytics.dailyStats.slice(-7).map((day, index) => (
                    <div key={day.date} className="flex items-center justify-between p-2 bg-muted rounded">
                      <div className="text-sm">
                        {new Date(day.date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span>{day.sales} sales</span>
                        <span className="font-medium">${day.revenue.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Category Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading categories...</div>
              ) : analytics.categoryBreakdown.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No categories yet</div>
              ) : (
                <div className="space-y-3">
                  {analytics.categoryBreakdown.map((category) => (
                    <div key={category.category} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="capitalize">
                          {category.category}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {category.count} products
                        </span>
                      </div>
                      <div className="font-medium">${category.revenue.toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Product Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Product Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading products...</div>
            ) : analytics.productPerformance.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No products yet</div>
            ) : (
              <div className="space-y-2">
                {analytics.productPerformance.slice(0, 10).map((product, index) => (
                  <div key={product.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-primary/10 rounded flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{product.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {product.views} views • {product.conversionRate.toFixed(1)}% conversion
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">${product.revenue.toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">{product.sales} sales</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}