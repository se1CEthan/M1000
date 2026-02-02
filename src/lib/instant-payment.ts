/**
 * INSTANT Payment Service - Zero Delays
 * Eliminates all waiting time for lightning-fast payments
 */

interface InstantPaymentData {
  productId: string;
  buyerId: string;
  productPrice: number;
  productTitle: string;
  sellerId: string;
}

export class InstantPayment {
  private static widgetBaseUrl = 'https://pay.cryptomus.com/widget/1135f505-133e-474f-b56f-0f56ad44158d';
  
  /**
   * INSTANT payment creation - no delays, no database calls
   */
  static createInstantPayment(data: InstantPaymentData): string {
    // Generate order ID instantly (no async needed)
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    
    // Generate widget URL instantly
    const widgetUrl = this.generateWidgetUrl(orderId, data.productPrice);
    
    // Store order data in localStorage for later database sync
    this.storeOrderForLaterSync(data, orderId);
    
    return widgetUrl;
  }
  
  /**
   * Generate widget URL instantly - no async operations
   */
  private static generateWidgetUrl(orderId: string, amount: number): string {
    const params = new URLSearchParams({
      order_id: orderId,
      amount: amount.toString(),
      currency: 'USD',
      to_currency: 'USDT',
      url_success: `https://seltech.online/order-success?order=${orderId}`,
      url_return: 'https://seltech.online/marketplace',
      url_callback: 'https://rtsaarapvlzzinmpjdys.supabase.co/functions/v1/cryptomus-webhook',
      is_payment_multiple: 'false',
      lifetime: '3600'
    });
    
    return `${this.widgetBaseUrl}?${params.toString()}`;
  }
  
  /**
   * Store order data locally for background sync
   */
  private static storeOrderForLaterSync(data: InstantPaymentData, orderId: string): void {
    const orderData = {
      orderId,
      productId: data.productId,
      buyerId: data.buyerId,
      sellerId: data.sellerId,
      price: data.productPrice,
      platformFee: data.productPrice * 0.1,
      sellerEarnings: data.productPrice * 0.9,
      timestamp: Date.now()
    };
    
    // Store in localStorage for background processing
    const pendingOrders = JSON.parse(localStorage.getItem('pendingOrders') || '[]');
    pendingOrders.push(orderData);
    localStorage.setItem('pendingOrders', JSON.stringify(pendingOrders));
  }
  
  /**
   * Detect mobile device instantly
   */
  static isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           window.innerWidth <= 768 ||
           'ontouchstart' in window;
  }
  
  /**
   * Instant redirect to payment - no delays
   */
  static instantRedirect(widgetUrl: string): void {
    // Immediate redirect - no timeouts or delays
    window.location.href = widgetUrl;
  }
}