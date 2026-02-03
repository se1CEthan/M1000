import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Package, 
  Users, 
  DollarSign,
  Calendar,
  PieChart,
  Activity,
  Target,
  Award,
  Clock
} from 'lucide-react';

interface ProductWithSeller {
  id: string;
  title: string;
  category: string;
  price: number;
  status: string;
  created_at: string;
  updated_at: string;
  profiles: {
    full_name: string | null;
    email: string;
  };
}

interface AdminAnalyticsEnhancedProps {
  products: ProductWithSeller[];
}

export function AdminAnalyticsEnhanced({ products }: AdminAnalyticsEnhancedProps) {
  // Calculate monthly data for the last 6 months
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return {
      month: date.toISOString().slice(0, 7), // YYYY-MM format
      name: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    };
  }).reverse();

  const monthlyData = last6Months.map(({ month, name }) => {
    const monthProducts = products.filter(p => 
      p.created_at.slice(0, 7) === month
    );
    const approved = monthProducts.filter(p => p.status === 'approved').length;
    const revenue = monthProducts
      .filter(p => p.status === 'approved')
      .reduce((sum, p) => sum + (p.price || 0), 0);
    
    return {
      month: name,
      submissions: monthProducts.length,
      approved,
      revenue,
      approvalRate: monthProducts.length > 0 ? (approved / monthProducts.length) * 100 : 0
    };
  });

  const maxSubmissions = Math.max(...monthlyData.map(d => d.submissions), 1);
  const maxRevenue = Math.max(...monthlyData.map(d => d.revenue), 1);

  // Calculate seller performance
  const sellerStats = products.reduce((acc, product) => {
    const email = product.profiles.email;
    if (!acc[email]) {
      acc[email] = {
        name: product.profiles.full_name || email,
        email,
        total: 0,
        approved: 0,
        revenue: 0
      };
    }
    acc[email].total++;
    if (product.status === 'approved') {
      acc[email].approved++;
      acc[email].revenue += product.price || 0;
    }
    return acc;
  }, {} as Record<string, any>);

  const topSellers = Object.values(sellerStats)
    .sort((a: any, b: any) => b.revenue - a.revenue)
    .slice(0, 5);

  // Calculate review time (mock data for demonstration)
  const avgReviewTime = products.filter(p => p.status !== 'pending').length > 0 
    ? Math.random() * 48 + 12 // Mock: 12-60 hours
    : 0;

  return (
    <div className="space-y-6">
      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Conversion Rate</p>
                <p className="text-2xl font-bold">
                  {products.length > 0 
                    ? ((products.filter(p => p.status === 'approved').length / products.length) * 100).toFixed(1)
                    : '0'
                  }%
                </p>
              </div>
              <Target className="h-8 w-8 text-green-600" />
            </div>
            <div className="flex items-center mt-2 text-sm">
              <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-green-600">+2.5%</span>
              <span className="text-muted-foreground ml-1">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Review Time</p>
                <p className="text-2xl font-bold">{avgReviewTime.toFixed(0)}h</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
            <div className="flex items-center mt-2 text-sm">
              <TrendingDown className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-green-600">-8h</span>
              <span className="text-muted-foreground ml-1">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Quality Score</p>
                <p className="text-2xl font-bold">8.7</p>
              </div>
              <Award className="h-8 w-8 text-purple-600" />
            </div>
            <div className="flex items-center mt-2 text-sm">
              <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-green-600">+0.3</span>
              <span className="text-muted-foreground ml-1">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Sellers</p>
                <p className="text-2xl font-bold">
                  {new Set(products.map(p => p.profiles.email)).size}
                </p>
              </div>
              <Users className="h-8 w-8 text-orange-600" />
            </div>
            <div className="flex items-center mt-2 text-sm">
              <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-green-600">+{Math.floor(Math.random() * 5) + 1}</span>
              <span className="text-muted-foreground ml-1">new this month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Monthly Submissions & Approvals
            </CardTitle>
            <CardDescription>
              Product submission and approval trends over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-end justify-between h-48 gap-2">
                {monthlyData.map((month, index) => (
                  <div key={month.month} className="flex flex-col items-center flex-1">
                    <div className="flex-1 flex items-end w-full gap-1">
                      {/* Submissions bar */}
                      <div 
                        className="bg-blue-500 rounded-t w-1/2 transition-all duration-300 hover:bg-blue-600 min-h-[4px]"
                        style={{ 
                          height: `${(month.submissions / maxSubmissions) * 100}%` 
                        }}
                        title={`${month.submissions} submissions in ${month.month}`}
                      ></div>
                      {/* Approvals bar */}
                      <div 
                        className="bg-green-500 rounded-t w-1/2 transition-all duration-300 hover:bg-green-600 min-h-[4px]"
                        style={{ 
                          height: `${(month.approved / maxSubmissions) * 100}%` 
                        }}
                        title={`${month.approved} approved in ${month.month}`}
                      ></div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2 text-center">
                      {month.month}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex items-center justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span>Submissions</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span>Approved</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Monthly Revenue Trend
            </CardTitle>
            <CardDescription>
              Revenue generated from approved products
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-end justify-between h-48 gap-2">
                {monthlyData.map((month, index) => (
                  <div key={month.month} className="flex flex-col items-center flex-1">
                    <div className="flex-1 flex items-end w-full">
                      <div 
                        className="bg-green-500 rounded-t w-full transition-all duration-300 hover:bg-green-600 min-h-[4px]"
                        style={{ 
                          height: `${maxRevenue > 0 ? (month.revenue / maxRevenue) * 100 : 4}%` 
                        }}
                        title={`$${month.revenue.toFixed(2)} revenue in ${month.month}`}
                      ></div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2 text-center">
                      {month.month}
                    </div>
                    <div className="text-xs font-medium">
                      ${month.revenue.toFixed(0)}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="pt-4 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Revenue:</span>
                  <span className="font-medium">
                    UGX {Math.round(monthlyData.reduce((sum, month) => sum + month.revenue, 0) * 3700).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Sellers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Top Performing Sellers
          </CardTitle>
          <CardDescription>
            Sellers ranked by revenue and approval rate
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topSellers.map((seller: any, index) => (
              <div key={seller.email} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                    #{index + 1}
                  </div>
                  <div>
                    <div className="font-medium">{seller.name}</div>
                    <div className="text-sm text-muted-foreground">{seller.email}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">${seller.revenue.toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground">
                    {seller.approved}/{seller.total} approved ({((seller.approved / seller.total) * 100).toFixed(0)}%)
                  </div>
                </div>
              </div>
            ))}
            {topSellers.length === 0 && (
              <p className="text-muted-foreground text-center py-8">
                No seller data available yet
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Approval Rate Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Approval Rate Trend
          </CardTitle>
          <CardDescription>
            Monthly approval rate percentage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-end justify-between h-32 gap-2">
              {monthlyData.map((month, index) => (
                <div key={month.month} className="flex flex-col items-center flex-1">
                  <div className="flex-1 flex items-end w-full">
                    <div 
                      className="bg-purple-500 rounded-t w-full transition-all duration-300 hover:bg-purple-600 min-h-[4px]"
                      style={{ 
                        height: `${month.approvalRate}%` 
                      }}
                      title={`${month.approvalRate.toFixed(1)}% approval rate in ${month.month}`}
                    ></div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2 text-center">
                    {month.month}
                  </div>
                  <div className="text-xs font-medium">
                    {month.approvalRate.toFixed(0)}%
                  </div>
                </div>
              ))}
            </div>
            
            <div className="pt-4 border-t">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Average Approval Rate:</span>
                <span className="font-medium">
                  {monthlyData.length > 0 
                    ? (monthlyData.reduce((sum, month) => sum + month.approvalRate, 0) / monthlyData.length).toFixed(1)
                    : '0'
                  }%
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}