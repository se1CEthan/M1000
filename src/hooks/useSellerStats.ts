import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/clients';
import { useAuth } from '@/hooks/useAuth';

export interface SellerStats {
  totalRevenue: number;
  thisMonthRevenue: number;
  pendingEarnings: number;
  totalSales: number;
  totalProducts: number;
  approvedProducts: number;
  totalViews: number;
  totalDownloads: number;
  conversionRate: number;
  avgRating: number;
  monthlyGrowth: number;
  hasWallet: boolean;
  pendingBalance: number;
  recentOrders: any[];
  topProducts: any[];
}

export function useSellerStats() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<SellerStats>({
    totalRevenue: 0,
    thisMonthRevenue: 0,
    pendingEarnings: 0,
    totalSales: 0,
    totalProducts: 0,
    approvedProducts: 0,
    totalViews: 0,
    totalDownloads: 0,
    conversionRate: 0,
    avgRating: 0,
    monthlyGrowth: 0,
    hasWallet: false,
    pendingBalance: 0,
    recentOrders: [],
    topProducts: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    if (!profile?.user_id) return;

    try {
      setError(null);
      
      // Fetch data separately to avoid relationship issues
      const [productsResult, ordersResult] = await Promise.all([
        supabase
          .from('products')
          .select('*')
          .eq('seller_id', profile.user_id),
        supabase
          .from('orders')
          .select('*')
          .eq('seller_id', profile.user_id)
          .order('created_at', { ascending: false })
      ]);

      if (productsResult.error) throw productsResult.error;
      if (ordersResult.error) throw ordersResult.error;

      const products = productsResult.data || [];
      const orders = ordersResult.data || [];

      // Fetch payouts separately (might not exist)
      let payouts = [];
      try {
        const payoutsResult = await supabase
          .from('payouts')
          .select('*')
          .eq('seller_id', profile.user_id)
          .eq('status', 'completed');
        
        if (!payoutsResult.error) {
          payouts = payoutsResult.data || [];
        }
      } catch (payoutError) {
        console.log('Payouts table not available, continuing without it');
      }

      // Calculate metrics
      const paidOrders = orders.filter(o => o.status === 'paid');
      const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.seller_earnings || o.price * 0.9 || 0), 0);
      
      // This month's revenue
      const thisMonth = new Date();
      thisMonth.setDate(1);
      const thisMonthOrders = paidOrders.filter(o => 
        new Date(o.completed_at || o.created_at) >= thisMonth
      );
      const thisMonthRevenue = thisMonthOrders.reduce((sum, o) => sum + (o.seller_earnings || o.price * 0.9 || 0), 0);
      
      // Calculate pending balance
      const totalPayouts = payouts.reduce((sum, p) => sum + (p.amount || 0), 0);
      const pendingBalance = Math.max(0, totalRevenue - totalPayouts);
      
      // Product metrics
      const totalViews = products.reduce((sum, p) => sum + (p.view_count || 0), 0);
      const totalDownloads = products.reduce((sum, p) => sum + (p.download_count || 0), 0);
      const avgRating = products.length > 0 
        ? products.reduce((sum, p) => sum + (p.average_rating || 0), 0) / products.length 
        : 0;
      
      // Top performing products
      const topProducts = products
        .sort((a, b) => (b.download_count || 0) - (a.download_count || 0))
        .slice(0, 5);

      // Recent orders (last 10) - enrich with product data
      const recentOrdersWithProducts = await Promise.all(
        orders.slice(0, 10).map(async (order) => {
          if (order.product_id) {
            try {
              const productResult = await supabase
                .from('products')
                .select('title, thumbnail_url, price')
                .eq('id', order.product_id)
                .single();
              
              return {
                ...order,
                product: productResult.data
              };
            } catch (error) {
              return {
                ...order,
                product: { title: 'Unknown Product', thumbnail_url: null, price: order.price }
              };
            }
          }
          return order;
        })
      );

      setStats({
        totalRevenue,
        thisMonthRevenue,
        pendingEarnings: pendingBalance,
        totalSales: paidOrders.length,
        totalProducts: products.length,
        approvedProducts: products.filter(p => p.status === 'approved').length,
        totalViews,
        totalDownloads,
        conversionRate: totalViews > 0 ? (totalDownloads / totalViews) * 100 : 0,
        avgRating,
        monthlyGrowth: 12, // Could be calculated from historical data
        hasWallet: !!profile.mobile_money_number,
        pendingBalance,
        recentOrders: recentOrdersWithProducts,
        topProducts
      });

    } catch (err: any) {
      console.error('Error fetching seller stats:', err);
      setError(err.message || 'Failed to fetch seller statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Set up real-time updates every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    
    // Set up real-time subscriptions for immediate updates
    const ordersSubscription = supabase
      .channel('seller-orders')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'orders',
          filter: `seller_id=eq.${profile?.user_id}`
        }, 
        () => {
          fetchStats();
        }
      )
      .subscribe();

    const productsSubscription = supabase
      .channel('seller-products')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'products',
          filter: `seller_id=eq.${profile?.user_id}`
        }, 
        () => {
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      ordersSubscription.unsubscribe();
      productsSubscription.unsubscribe();
    };
  }, [profile?.user_id]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  };
}