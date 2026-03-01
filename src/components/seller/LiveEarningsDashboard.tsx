import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  DollarSign, 
  Clock, 
  Zap, 
  ArrowUpRight, 
  ArrowDownRight,
  Wallet,
  CreditCard,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/clients';
import { useAuth } from '@/hooks/useAuth';
import { LivePayoutSystem } from '@/lib/payout-system';
import { toast } from 'sonner';

interface EarningsData {
  totalEarnings: number;
  pendingBalance: number;
  thisMonthEarnings: number;
  lastMonthEarnings: number;
  totalSales: number;
  averageOrderValue: number;
  nextPayoutAmount: number;
  nextPayoutDate: string;
}

interface RecentTransaction {
  id: string;
  type: 'sale' | 'payout';
  amount: number;
  status: string;
  description: string;
  created_at: string;
  transaction_id?: string;
}

export function LiveEarningsDashboard() {
  const { profile } = useAuth();
  const [earnings, setEarnings] = useState<EarningsData>({
    totalEarnings: 0,
    pendingBalance: 0,
    thisMonthEarnings: 0,
    lastMonthEarnings: 0,
    totalSales: 0,
    averageOrderValue: 0,
    nextPayoutAmount: 0,
    nextPayoutDate: '',
  });
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (profile) {
      fetchEarningsData();
      subscribeToRealTimeUpdates();
    }
  }, [profile]);

  const fetchEarningsData = async () => {
    try {
      setLoading(true);

      // Get current month date range
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      // Fetch earnings from orders
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('seller_earnings, created_at, status')
        .eq('seller_id', profile?.user_id)
        .eq('status', 'paid');

      if (ordersError) throw ordersError;

      // Calculate earnings metrics
      const totalEarnings = orders?.reduce((sum, order) => sum + order.seller_earnings, 0) || 0;
      const totalSales = orders?.length || 0;
      const averageOrderValue = totalSales > 0 ? totalEarnings / totalSales : 0;

      const thisMonthEarnings = orders?.filter(order => 
        new Date(order.created_at) >= startOfMonth
      ).reduce((sum, order) => sum + order.seller_earnings, 0) || 0;

      const lastMonthEarnings = orders?.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate >= startOfLastMonth && orderDate <= endOfLastMonth;
      }).reduce((sum, order) => sum + order.seller_earnings, 0) || 0;

      // Get pending balance
      const { data: balance } = await supabase
        .from('seller_pending_balances')
        .select('amount')
        .eq('seller_id', profile?.user_id)
        .single();

      const pendingBalance = balance?.amount || 0;

      // Get recent transactions (orders + payouts)
      const { data: payouts } = await supabase
        .from('payouts')
        .select('*')
        .eq('seller_id', profile?.user_id)
        .order('created_at', { ascending: false })
        .limit(10);

      // Combine and sort transactions
      const transactions: RecentTransaction[] = [
        ...(orders?.slice(-10).map(order => ({
          id: order.id,
          type: 'sale' as const,
          amount: order.seller_earnings,
          status: order.status,
          description: 'Product sale',
          created_at: order.created_at,
        })) || []),
        ...(payouts?.map(payout => ({
          id: payout.id,
          type: 'payout' as const,
          amount: payout.amount,
          status: payout.status,
          description: payout.description || 'Payout',
          created_at: payout.created_at,
          transaction_id: payout.transaction_id,
        })) || [])
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setEarnings({
        totalEarnings,
        pendingBalance,
        thisMonthEarnings,
        lastMonthEarnings,
        totalSales,
        averageOrderValue,
        nextPayoutAmount: pendingBalance >= 10 ? pendingBalance : 0,
        nextPayoutDate: pendingBalance >= 10 ? 'Available now' : 'When balance reaches $10',
      });

      setRecentTransactions(transactions.slice(0, 10));

    } catch (error) {
      console.error('Error fetching earnings data:', error);
      toast.error('Failed to load earnings data');
    } finally {
      setLoading(false);
    }
  };

  const subscribeToRealTimeUpdates = () => {
    // Subscribe to orders updates
    const ordersChannel = supabase
      .channel('seller-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `seller_id=eq.${profile?.user_id}`,
        },
        () => {
          fetchEarningsData();
        }
      )
      .subscribe();

    // Subscribe to payouts updates
    const payoutsChannel = supabase
      .channel('seller-payouts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payouts',
          filter: `seller_id=eq.${profile?.user_id}`,
        },
        () => {
          fetchEarningsData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(payoutsChannel);
    };
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchEarningsData();
    setRefreshing(false);
    toast.success('Earnings data refreshed');
  };

  const requestPayout = async () => {
    if (earnings.pendingBalance < 10) {
      toast.error('Minimum payout amount is $10');
      return;
    }

    try {
      const result = await LivePayoutSystem.processPendingBalancePayout(profile?.user_id || '');
      
      if (result.success) {
        toast.success('Payout request submitted successfully!');
        await fetchEarningsData();
      } else {
        toast.error(result.error || 'Failed to process payout');
      }
    } catch (error) {
      console.error('Error requesting payout:', error);
      toast.error('Failed to request payout');
    }
  };

  const getGrowthPercentage = () => {
    if (earnings.lastMonthEarnings === 0) return earnings.thisMonthEarnings > 0 ? 100 : 0;
    return ((earnings.thisMonthEarnings - earnings.lastMonthEarnings) / earnings.lastMonthEarnings) * 100;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
      case 'completed':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'pending':
      case 'processing':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'failed':
        return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const growthPercentage = getGrowthPercentage();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="h-8 bg-muted rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Live Earnings Dashboard</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Earnings Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Earnings</p>
                <p className="text-2xl font-bold">{formatCurrency(earnings.totalEarnings)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold">{formatCurrency(earnings.thisMonthEarnings)}</p>
                <div className="flex items-center gap-1 mt-1">
                  {growthPercentage >= 0 ? (
                    <ArrowUpRight className="h-3 w-3 text-green-500" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-red-500" />
                  )}
                  <span className={`text-xs ${growthPercentage >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {Math.abs(growthPercentage).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Balance</p>
                <p className="text-2xl font-bold">{formatCurrency(earnings.pendingBalance)}</p>
                {earnings.pendingBalance >= 10 && (
                  <Button
                    size="sm"
                    className="mt-2 h-6 text-xs"
                    onClick={requestPayout}
                  >
                    Request Payout
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Zap className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Sales</p>
                <p className="text-2xl font-bold">{earnings.totalSales}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Avg: {formatCurrency(earnings.averageOrderValue)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payout Progress */}
      {earnings.pendingBalance > 0 && earnings.pendingBalance < 10 && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Next Payout Progress</h3>
              <span className="text-sm text-muted-foreground">
                {formatCurrency(earnings.pendingBalance)} / $10.00
              </span>
            </div>
            <Progress value={(earnings.pendingBalance / 10) * 100} className="mb-2" />
            <p className="text-sm text-muted-foreground">
              {formatCurrency(10 - earnings.pendingBalance)} more needed for automatic payout
            </p>
          </CardContent>
        </Card>
      )}

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {recentTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      {transaction.type === 'sale' ? (
                        <DollarSign className="h-4 w-4" />
                      ) : (
                        <Wallet className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(transaction.created_at)}
                      </p>
                      {transaction.transaction_id && (
                        <p className="text-xs font-mono text-muted-foreground">
                          {transaction.transaction_id.substring(0, 16)}...
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {transaction.type === 'sale' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </p>
                    <Badge variant="outline" className={getStatusColor(transaction.status)}>
                      {transaction.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}