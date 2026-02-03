import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  Eye, 
  Download,
  Clock,
  Wallet,
  RefreshCw,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { useSellerStats } from '@/hooks/useSellerStats';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface LiveSellerStatsProps {
  onTabChange?: (tab: string) => void;
}

export function LiveSellerStats({ onTabChange }: LiveSellerStatsProps) {
  const { stats, loading, error, refetch } = useSellerStats();
  return (
    <div className="space-y-6">
      {/* Phone Number Setup Alert */}
      {!stats.hasWallet && stats.pendingBalance > 0 && (
        <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              <strong className="text-yellow-800 dark:text-yellow-200">
                UGX {stats.pendingBalance.toLocaleString()} Ready for Payout!
              </strong>
              <p className="text-yellow-700 dark:text-yellow-300">
                Add your mobile money number to receive payouts.
              </p>
            </div>
            <Button 
              onClick={() => onTabChange?.('profile')}
              className="bg-yellow-600 hover:bg-yellow-700 text-white ml-4"
              size="sm"
            >
              Add Phone Number
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Mobile Money Setup Alert */}
      {!stats.hasWallet && stats.pendingEarnings > 0 && (
        <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
          <Wallet className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              <strong className="text-yellow-800 dark:text-yellow-200">
                UGX {(stats.pendingEarnings * 3700).toLocaleString()} Ready for Payout!
              </strong>
              <p className="text-yellow-700 dark:text-yellow-300">
                Setup your mobile money number to receive automatic payouts.
              </p>
            </div>
            <Button 
              onClick={() => onTabChange?.('wallet')}
              className="bg-yellow-600 hover:bg-yellow-700 text-white ml-4"
              size="sm"
            >
              Setup Mobile Money
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onTabChange?.('analytics')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              UGX {loading ? '...' : (stats.totalRevenue * 3700).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              +UGX {(stats.thisMonthRevenue * 3700).toLocaleString()} this month
            </p>
          </CardContent>
        </Card>

        {/* Pending Earnings */}
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onTabChange?.('wallet')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Earnings</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              UGX {loading ? '...' : (stats.pendingEarnings * 3700).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.hasWallet ? 'Auto-payout enabled' : 'Setup mobile money for payout'}
            </p>
          </CardContent>
        </Card>

        {/* Total Sales */}
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onTabChange?.('orders')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {loading ? '...' : stats.totalSales}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.recentOrders.length} recent orders
            </p>
          </CardContent>
        </Card>

        {/* Products */}
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onTabChange?.('products')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
            <Package className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {loading ? '...' : stats.totalProducts}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.approvedProducts} approved
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.totalViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Product page views</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Downloads</CardTitle>
            <Download className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.totalDownloads.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Successful purchases</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Views to purchases</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
            <CheckCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.avgRating.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">Customer satisfaction</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Orders</CardTitle>
            <Button variant="outline" size="sm" onClick={() => onTabChange?.('orders')}>
              View All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-4 text-muted-foreground">Loading...</div>
              ) : stats.recentOrders.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">No orders yet</div>
              ) : (
                stats.recentOrders.slice(0, 5).map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{order.order_number}</div>
                      <div className="text-xs text-muted-foreground">
                        {order.product?.title || 'Unknown Product'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-sm">UGX {(order.seller_earnings * 3700)?.toLocaleString()}</div>
                      <Badge 
                        variant={order.status === 'paid' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Top Products</CardTitle>
            <Button variant="outline" size="sm" onClick={() => onTabChange?.('products')}>
              View All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-4 text-muted-foreground">Loading...</div>
              ) : stats.topProducts.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">No products yet</div>
              ) : (
                stats.topProducts.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 bg-background rounded overflow-hidden">
                        {product.thumbnail_url ? (
                          <img src={product.thumbnail_url} alt={product.title} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="h-6 w-6 text-muted-foreground m-2" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{product.title}</div>
                        <div className="text-xs text-muted-foreground">UGX {(product.price * 3700).toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-sm">{product.download_count || 0} sales</div>
                      <div className="text-xs text-muted-foreground">{product.view_count || 0} views</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Update Indicator */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span>Live updates every 30 seconds</span>
        <Button variant="ghost" size="sm" onClick={refetch} disabled={loading}>
          <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    </div>
  );
}