import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Package, 
  DollarSign, 
  TrendingUp, 
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Activity,
  ShoppingCart,
  UserPlus
} from 'lucide-react';
import { useAdminStats } from '@/hooks/useAdminStats';
import { formatDistanceToNow } from 'date-fns';

export function LiveAdminStats() {
  const { stats, loading, error, lastUpdated, refreshStats } = useAdminStats();

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-red-600">
            <XCircle className="h-5 w-5" />
            <span>Error loading stats: {error}</span>
            <Button variant="outline" size="sm" onClick={refreshStats}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Mobile-Responsive Header with refresh info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl sm:text-2xl font-bold">Live Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            Real-time platform statistics
            {lastUpdated && (
              <span className="ml-2">
                • Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
            <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
            <span>Live</span>
          </div>
          <Button variant="outline" size="sm" onClick={refreshStats} disabled={loading} className="text-xs sm:text-sm">
            <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Mobile-Responsive Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {/* Products Stats */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Products</CardTitle>
            <Package className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">{stats?.products.total || 0}</div>
            <div className="flex items-center gap-1 sm:gap-2 mt-2">
              <Badge variant="outline" className="text-xs">
                <Clock className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
                <span className="hidden sm:inline">{stats?.products.pending || 0} pending</span>
                <span className="sm:hidden">{stats?.products.pending || 0}</span>
              </Badge>
              {stats?.products.todayCount ? (
                <Badge variant="secondary" className="text-xs">
                  <span className="hidden sm:inline">+{stats.products.todayCount} today</span>
                  <span className="sm:hidden">+{stats.products.todayCount}</span>
                </Badge>
              ) : null}
            </div>
            <div className="flex gap-1 mt-2 text-xs">
              <div className="text-green-600">
                ✓ {stats?.products.approved || 0}
              </div>
              <div className="text-red-600">
                ✗ {stats?.products.rejected || 0}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders Stats */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Orders</CardTitle>
            <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">{stats?.orders.total || 0}</div>
            <div className="flex items-center gap-1 sm:gap-2 mt-2">
              <Badge variant="outline" className="text-xs">
                <DollarSign className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
                <span className="hidden sm:inline">${stats?.orders.totalRevenue.toFixed(2) || '0.00'}</span>
                <span className="sm:hidden">${stats?.orders.totalRevenue.toFixed(0) || '0'}</span>
              </Badge>
              {stats?.orders.todayCount ? (
                <Badge variant="secondary" className="text-xs">
                  <span className="hidden sm:inline">+{stats.orders.todayCount} today</span>
                  <span className="sm:hidden">+{stats.orders.todayCount}</span>
                </Badge>
              ) : null}
            </div>
            {stats?.orders.todayRevenue ? (
              <div className="text-xs text-green-600 mt-1">
                <span className="hidden sm:inline">${stats.orders.todayRevenue.toFixed(2)} today</span>
                <span className="sm:hidden">${stats.orders.todayRevenue.toFixed(0)} today</span>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Users Stats */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Users</CardTitle>
            <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">{stats?.users.total || 0}</div>
            <div className="flex items-center gap-1 sm:gap-2 mt-2">
              <Badge variant="outline" className="text-xs">
                <span className="hidden sm:inline">{stats?.users.sellers || 0} sellers</span>
                <span className="sm:hidden">{stats?.users.sellers || 0}S</span>
              </Badge>
              {stats?.users.todaySignups ? (
                <Badge variant="secondary" className="text-xs">
                  <UserPlus className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
                  <span className="hidden sm:inline">+{stats.users.todaySignups}</span>
                  <span className="sm:hidden">+{stats.users.todaySignups}</span>
                </Badge>
              ) : null}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              <span className="hidden sm:inline">{stats?.users.buyers || 0} buyers</span>
              <span className="sm:hidden">{stats?.users.buyers || 0}B</span>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Stats */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Revenue</CardTitle>
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">
              <span className="hidden sm:inline">${stats?.orders.totalRevenue.toFixed(2) || '0.00'}</span>
              <span className="sm:hidden">${stats?.orders.totalRevenue.toFixed(0) || '0'}</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 mt-2">
              <Badge variant="outline" className="text-xs">
                <span className="hidden sm:inline">{stats?.orders.total || 0} orders</span>
                <span className="sm:hidden">{stats?.orders.total || 0}</span>
              </Badge>
              {stats?.orders.todayRevenue ? (
                <Badge variant="secondary" className="text-xs text-green-600">
                  <span className="hidden sm:inline">+${stats.orders.todayRevenue.toFixed(2)}</span>
                  <span className="sm:hidden">+${stats.orders.todayRevenue.toFixed(0)}</span>
                </Badge>
              ) : null}
            </div>
            {stats?.orders.total && stats.orders.total > 0 ? (
              <div className="text-xs text-muted-foreground mt-1">
                <span className="hidden sm:inline">Avg: ${(stats.orders.totalRevenue / stats.orders.total).toFixed(2)}</span>
                <span className="sm:hidden">Avg: ${(stats.orders.totalRevenue / stats.orders.total).toFixed(0)}</span>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {/* Mobile-Responsive Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Button variant="outline" className="h-auto p-3 sm:p-4 flex flex-col items-center gap-2">
              <Clock className="h-4 w-4 sm:h-6 sm:w-6" />
              <span className="text-xs sm:text-sm text-center">
                <span className="hidden sm:inline">Pending Reviews</span>
                <span className="sm:hidden">Reviews</span>
              </span>
              <Badge className="text-xs">{(stats?.products.pending || 0)}</Badge>
            </Button>
            
            <Button variant="outline" className="h-auto p-3 sm:p-4 flex flex-col items-center gap-2">
              <Users className="h-4 w-4 sm:h-6 sm:w-6" />
              <span className="text-xs sm:text-sm text-center">
                <span className="hidden sm:inline">New Sellers</span>
                <span className="sm:hidden">Sellers</span>
              </span>
              <Badge className="text-xs">{stats?.users.todaySignups || 0}</Badge>
            </Button>
            
            <Button variant="outline" className="h-auto p-3 sm:p-4 flex flex-col items-center gap-2">
              <ShoppingCart className="h-4 w-4 sm:h-6 sm:w-6" />
              <span className="text-xs sm:text-sm text-center">
                <span className="hidden sm:inline">Today's Orders</span>
                <span className="sm:hidden">Orders</span>
              </span>
              <Badge className="text-xs">{stats?.orders.todayCount || 0}</Badge>
            </Button>
            
            <Button variant="outline" className="h-auto p-3 sm:p-4 flex flex-col items-center gap-2">
              <DollarSign className="h-4 w-4 sm:h-6 sm:w-6" />
              <span className="text-xs sm:text-sm text-center">
                <span className="hidden sm:inline">Today's Revenue</span>
                <span className="sm:hidden">Revenue</span>
              </span>
              <Badge className="text-xs">
                <span className="hidden sm:inline">${stats?.orders.todayRevenue.toFixed(2) || '0.00'}</span>
                <span className="sm:hidden">${stats?.orders.todayRevenue.toFixed(0) || '0'}</span>
              </Badge>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}