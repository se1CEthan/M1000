import { supabase } from '@/integrations/supabase/clients';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface AdminRealtimeData {
  pendingApplications: number;
  pendingProducts: number;
  totalRevenue: number;
  activeSellers: number;
  recentActivity: any[];
  notifications: AdminNotification[];
}

export interface AdminNotification {
  id: string;
  type: 'new_application' | 'new_product' | 'new_order' | 'system_alert';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  created_at: string;
}

export interface AdminStats {
  applications: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    todayCount: number;
  };
  products: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    todayCount: number;
  };
  orders: {
    total: number;
    todayCount: number;
    todayRevenue: number;
    totalRevenue: number;
  };
  users: {
    total: number;
    sellers: number;
    buyers: number;
    todaySignups: number;
  };
}

class AdminRealtimeService {
  private channel: RealtimeChannel | null = null;
  private listeners: Map<string, (data: any) => void> = new Map();
  private statsCache: AdminStats | null = null;
  private lastFetch: number = 0;
  private readonly CACHE_DURATION = 30000; // 30 seconds

  constructor() {
    this.setupRealtimeSubscription();
  }

  private setupRealtimeSubscription() {
    // Subscribe to real-time changes
    this.channel = supabase
      .channel('admin-dashboard')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'products' },
        (payload) => this.handleProductChange(payload)
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => this.handleOrderChange(payload)
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        (payload) => this.handleProfileChange(payload)
      )
      .subscribe();

    // Set up periodic stats refresh
    setInterval(() => {
      this.refreshStats();
    }, 30000); // Refresh every 30 seconds
  }

  private handleProductChange(payload: any) {
    console.log('Product change detected:', payload);
    this.invalidateCache();
    this.notifyListeners('product_change', payload);
    
    if (payload.eventType === 'INSERT') {
      this.createNotification({
        type: 'new_product',
        title: 'New Product Submission',
        message: `New product "${payload.new.title}" submitted for review`,
        data: payload.new
      });
    }
  }

  private handleOrderChange(payload: any) {
    console.log('Order change detected:', payload);
    this.invalidateCache();
    this.notifyListeners('order_change', payload);
    
    if (payload.eventType === 'INSERT') {
      this.createNotification({
        type: 'new_order',
        title: 'New Order Received',
        message: `New order for $${payload.new.total_amount}`,
        data: payload.new
      });
    }
  }

  private handleProfileChange(payload: any) {
    console.log('Profile change detected:', payload);
    this.invalidateCache();
    this.notifyListeners('profile_change', payload);
  }

  private async createNotification(notification: Omit<AdminNotification, 'id' | 'read' | 'created_at'>) {
    const newNotification: AdminNotification = {
      id: crypto.randomUUID(),
      read: false,
      created_at: new Date().toISOString(),
      ...notification
    };

    this.notifyListeners('new_notification', newNotification);
  }

  private invalidateCache() {
    this.statsCache = null;
    this.lastFetch = 0;
  }

  private notifyListeners(event: string, data: any) {
    this.listeners.forEach((callback, listenerId) => {
      try {
        callback({ event, data });
      } catch (error) {
        console.error(`Error in listener ${listenerId}:`, error);
      }
    });
  }

  public subscribe(listenerId: string, callback: (data: any) => void) {
    this.listeners.set(listenerId, callback);
    
    return () => {
      this.listeners.delete(listenerId);
    };
  }

  public async getStats(forceRefresh = false): Promise<AdminStats> {
    const now = Date.now();
    
    if (!forceRefresh && this.statsCache && (now - this.lastFetch) < this.CACHE_DURATION) {
      return this.statsCache;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch all data in parallel
      const [
        productsResult,
        ordersResult,
        profilesResult
      ] = await Promise.all([
        this.fetchProductStats(today),
        this.fetchOrderStats(today),
        this.fetchUserStats(today)
      ]);

      this.statsCache = {
        applications: {
          total: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
          todayCount: 0
        },
        products: productsResult,
        orders: ordersResult,
        users: profilesResult
      };

      this.lastFetch = now;
      return this.statsCache;
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      
      // Return default stats on error
      return {
        applications: { total: 0, pending: 0, approved: 0, rejected: 0, todayCount: 0 },
        products: { total: 0, pending: 0, approved: 0, rejected: 0, todayCount: 0 },
        orders: { total: 0, todayCount: 0, todayRevenue: 0, totalRevenue: 0 },
        users: { total: 0, sellers: 0, buyers: 0, todaySignups: 0 }
      };
    }
  }

  private async fetchProductStats(today: string) {
    const { data: products } = await supabase
      .from('products')
      .select('status, created_at, price');

    const todayProducts = products?.filter(p => 
      p.created_at.startsWith(today)
    ) || [];

    return {
      total: products?.length || 0,
      pending: products?.filter(p => p.status === 'pending').length || 0,
      approved: products?.filter(p => p.status === 'approved').length || 0,
      rejected: products?.filter(p => p.status === 'rejected').length || 0,
      todayCount: todayProducts.length
    };
  }

  private async fetchOrderStats(today: string) {
    const { data: orders } = await supabase
      .from('orders')
      .select('created_at, total_amount, status');

    const todayOrders = orders?.filter(o => 
      o.created_at.startsWith(today)
    ) || [];

    const totalRevenue = orders?.reduce((sum, order) => 
      sum + (order.total_amount || 0), 0
    ) || 0;

    const todayRevenue = todayOrders.reduce((sum, order) => 
      sum + (order.total_amount || 0), 0
    );

    return {
      total: orders?.length || 0,
      todayCount: todayOrders.length,
      todayRevenue,
      totalRevenue
    };
  }

  private async fetchUserStats(today: string) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('role, created_at');

    const todayProfiles = profiles?.filter(p => 
      p.created_at.startsWith(today)
    ) || [];

    return {
      total: profiles?.length || 0,
      sellers: profiles?.filter(p => p.role === 'seller').length || 0,
      buyers: profiles?.filter(p => p.role === 'buyer').length || 0,
      todaySignups: todayProfiles.length
    };
  }

  public async refreshStats() {
    await this.getStats(true);
    this.notifyListeners('stats_updated', this.statsCache);
  }

  public disconnect() {
    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
    }
    this.listeners.clear();
  }
}

// Singleton instance
export const adminRealtimeService = new AdminRealtimeService();

// React hook for using the service
export function useAdminRealtime() {
  return adminRealtimeService;
}