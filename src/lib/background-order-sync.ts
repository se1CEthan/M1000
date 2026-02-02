/**
 * Background Order Sync Service
 * Syncs orders to database after instant payment creation
 */

import { supabase } from '@/integrations/supabase/clients';

interface PendingOrder {
  orderId: string;
  productId: string;
  buyerId: string;
  sellerId: string;
  price: number;
  platformFee: number;
  sellerEarnings: number;
  timestamp: number;
}

export class BackgroundOrderSync {
  private static syncInProgress = false;
  
  /**
   * Initialize background sync service
   */
  static init(): void {
    // Sync pending orders on page load
    this.syncPendingOrders();
    
    // Set up periodic sync every 30 seconds
    setInterval(() => {
      this.syncPendingOrders();
    }, 30000);
    
    // Sync when page becomes visible
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.syncPendingOrders();
      }
    });
  }
  
  /**
   * Sync all pending orders to database
   */
  static async syncPendingOrders(): Promise<void> {
    if (this.syncInProgress) return;
    
    try {
      this.syncInProgress = true;
      
      const pendingOrders = this.getPendingOrders();
      if (pendingOrders.length === 0) return;
      
      console.log(`Syncing ${pendingOrders.length} pending orders...`);
      
      const syncPromises = pendingOrders.map(order => this.syncSingleOrder(order));
      const results = await Promise.allSettled(syncPromises);
      
      // Remove successfully synced orders
      const successfulOrders = results
        .map((result, index) => ({ result, order: pendingOrders[index] }))
        .filter(({ result }) => result.status === 'fulfilled')
        .map(({ order }) => order);
      
      if (successfulOrders.length > 0) {
        this.removeSyncedOrders(successfulOrders);
        console.log(`Successfully synced ${successfulOrders.length} orders`);
      }
      
    } catch (error) {
      console.error('Background sync error:', error);
    } finally {
      this.syncInProgress = false;
    }
  }
  
  /**
   * Sync a single order to database
   */
  private static async syncSingleOrder(order: PendingOrder): Promise<void> {
    const { error } = await supabase
      .from('orders')
      .insert({
        id: order.orderId,
        buyer_id: order.buyerId,
        seller_id: order.sellerId,
        product_id: order.productId,
        order_number: order.orderId,
        status: 'pending',
        price: order.price,
        platform_fee: order.platformFee,
        seller_earnings: order.sellerEarnings,
        payment_method: 'cryptocurrency',
        currency: 'USD',
        crypto_currency: 'USDT',
        created_at: new Date(order.timestamp).toISOString()
      });
    
    if (error) {
      // If order already exists, that's fine
      if (!error.message.includes('duplicate key')) {
        throw error;
      }
    }
  }
  
  /**
   * Get pending orders from localStorage
   */
  private static getPendingOrders(): PendingOrder[] {
    try {
      return JSON.parse(localStorage.getItem('pendingOrders') || '[]');
    } catch {
      return [];
    }
  }
  
  /**
   * Remove synced orders from localStorage
   */
  private static removeSyncedOrders(syncedOrders: PendingOrder[]): void {
    const pendingOrders = this.getPendingOrders();
    const syncedOrderIds = new Set(syncedOrders.map(o => o.orderId));
    
    const remainingOrders = pendingOrders.filter(order => !syncedOrderIds.has(order.orderId));
    
    localStorage.setItem('pendingOrders', JSON.stringify(remainingOrders));
  }
  
  /**
   * Clean up old pending orders (older than 24 hours)
   */
  static cleanupOldOrders(): void {
    const pendingOrders = this.getPendingOrders();
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    
    const recentOrders = pendingOrders.filter(order => order.timestamp > oneDayAgo);
    
    if (recentOrders.length !== pendingOrders.length) {
      localStorage.setItem('pendingOrders', JSON.stringify(recentOrders));
      console.log(`Cleaned up ${pendingOrders.length - recentOrders.length} old pending orders`);
    }
  }
}