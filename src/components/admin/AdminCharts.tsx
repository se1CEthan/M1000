import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  Package, 
  Users, 
  DollarSign,
  Calendar,
  PieChart
} from 'lucide-react';

interface ProductWithSeller {
  id: string;
  title: string;
  category: string;
  price: number;
  status: string;
  created_at: string;
  profiles: {
    full_name: string | null;
    email: string;
  };
}

interface AdminChartsProps {
  products: ProductWithSeller[];
}

export function AdminCharts({ products }: AdminChartsProps) {
  // Calculate data for charts
  const statusData = {
    pending: products.filter(p => p.status === 'pending').length,
    approved: products.filter(p => p.status === 'approved').length,
    rejected: products.filter(p => p.status === 'rejected').length,
  };

  const categoryData = products.reduce((acc, product) => {
    acc[product.category] = (acc[product.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const revenueByCategory = products
    .filter(p => p.status === 'approved')
    .reduce((acc, product) => {
      acc[product.category] = (acc[product.category] || 0) + (product.price || 0);
      return acc;
    }, {} as Record<string, number>);

  // Get last 7 days of submissions
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date.toISOString().split('T')[0];
  }).reverse();

  const submissionsByDay = last7Days.map(date => {
    const count = products.filter(p => 
      p.created_at.split('T')[0] === date
    ).length;
    return { date, count };
  });

  const maxSubmissions = Math.max(...submissionsByDay.map(d => d.count), 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {/* Product Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Product Status Distribution
          </CardTitle>
          <CardDescription>
            Breakdown of product review status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Status Bars */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm">Pending</span>
                </div>
                <Badge variant="outline">{statusData.pending}</Badge>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${products.length > 0 ? (statusData.pending / products.length) * 100 : 0}%` 
                  }}
                ></div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Approved</span>
                </div>
                <Badge variant="outline">{statusData.approved}</Badge>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${products.length > 0 ? (statusData.approved / products.length) * 100 : 0}%` 
                  }}
                ></div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm">Rejected</span>
                </div>
                <Badge variant="outline">{statusData.rejected}</Badge>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-red-500 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${products.length > 0 ? (statusData.rejected / products.length) * 100 : 0}%` 
                  }}
                ></div>
              </div>
            </div>

            <div className="pt-2 border-t">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Total Products</span>
                <span className="font-medium">{products.length}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Products by Category
          </CardTitle>
          <CardDescription>
            Distribution across product categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(categoryData)
              .sort(([,a], [,b]) => b - a)
              .map(([category, count]) => {
                const percentage = products.length > 0 ? (count / products.length) * 100 : 0;
                return (
                  <div key={category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm capitalize">{category}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            {Object.keys(categoryData).length === 0 && (
              <p className="text-muted-foreground text-center py-4">
                No products submitted yet
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Revenue by Category */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Revenue by Category
          </CardTitle>
          <CardDescription>
            Revenue from approved products
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(revenueByCategory)
              .sort(([,a], [,b]) => b - a)
              .map(([category, revenue]) => {
                const totalRevenue = Object.values(revenueByCategory).reduce((sum, val) => sum + val, 0);
                const percentage = totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0;
                return (
                  <div key={category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm capitalize">{category}</span>
                      <Badge variant="secondary">${revenue.toFixed(2)}</Badge>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            {Object.keys(revenueByCategory).length === 0 && (
              <p className="text-muted-foreground text-center py-4">
                No approved products yet
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Daily Submissions (Last 7 Days) */}
      <Card className="lg:col-span-2 xl:col-span-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Product Submissions (Last 7 Days)
          </CardTitle>
          <CardDescription>
            Daily product submission trends
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Chart */}
            <div className="flex items-end justify-between h-32 gap-2">
              {submissionsByDay.map((day, index) => (
                <div key={day.date} className="flex flex-col items-center flex-1">
                  <div className="flex-1 flex items-end w-full">
                    <div 
                      className="bg-blue-500 rounded-t w-full transition-all duration-300 hover:bg-blue-600 min-h-[4px]"
                      style={{ 
                        height: `${maxSubmissions > 0 ? (day.count / maxSubmissions) * 100 : 4}%` 
                      }}
                      title={`${day.count} submissions on ${new Date(day.date).toLocaleDateString()}`}
                    ></div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2 text-center">
                    {new Date(day.date).toLocaleDateString('en-US', { 
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                  <div className="text-xs font-medium">
                    {day.count}
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="flex justify-between items-center pt-4 border-t">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-muted-foreground">Total this week:</span>
                  <span className="font-medium">
                    {submissionsByDay.reduce((sum, day) => sum + day.count, 0)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  <span className="text-muted-foreground">Daily average:</span>
                  <span className="font-medium">
                    {(submissionsByDay.reduce((sum, day) => sum + day.count, 0) / 7).toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats Grid */}
      <Card className="lg:col-span-2 xl:col-span-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Platform Metrics
          </CardTitle>
          <CardDescription>
            Key performance indicators
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {((statusData.approved / (products.length || 1)) * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Approval Rate</div>
            </div>
            
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                ${Object.values(revenueByCategory).reduce((sum, val) => sum + val, 0).toFixed(0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Revenue</div>
            </div>
            
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {new Set(products.map(p => p.profiles.email)).size}
              </div>
              <div className="text-sm text-muted-foreground">Active Sellers</div>
            </div>
            
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {products.length > 0 ? (Object.values(revenueByCategory).reduce((sum, val) => sum + val, 0) / statusData.approved || 0).toFixed(0) : '0'}
              </div>
              <div className="text-sm text-muted-foreground">Avg Product Value</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}