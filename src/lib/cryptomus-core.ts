/**
 * Core Cryptomus API Integration
 * Production-ready implementation using only API keys
 * No widgets - pure API integration
 */

import CryptoJS from 'crypto-js';

// Production Cryptomus Configuration
export const CRYPTOMUS_CONFIG = {
  MERCHANT_UUID: '6e6c1018-48f4-49fd-a10d-36d6cd70eefe',
  PAYMENT_API_KEY: 'DSk5vMk3RIBhiQ3qGUw1pH1iYJI1hSSN8iTYmHpm3WpyTj9bsTtIlhadpiFKlK5aVUmpjHH8YoLV9dQsxLAPzpQOdiffl2hzJo0378ExFJB3HMSx49LjTfvnm9qHztoP',
  PAYOUT_API_KEY: '2nuhleS45ns1WTJDX1ZoRG8UAmDFDdahvMafGhU5knS5P3Ozn1Yx0tgRYCmjJpKvtNx0GVQ0FTLo0SNVw1ZM7Zy97fXSsbHX8SGbgGepEHCqwtxw3gIJ8LKDIMDJ3W4s',
  BASE_URL: 'https://api.cryptomus.com/v1',
  WEBHOOK_SECRET: 'seltech_webhook_secret_2024_production'
};

// Supported cryptocurrencies for payments
export const SUPPORTED_CRYPTOCURRENCIES = [
  { code: 'USDT', name: 'Tether USD', network: 'TRC20', recommended: true },
  { code: 'USDC', name: 'USD Coin', network: 'ERC20', recommended: true },
  { code: 'BTC', name: 'Bitcoin', network: 'BTC', recommended: false },
  { code: 'ETH', name: 'Ethereum', network: 'ERC20', recommended: false },
  { code: 'LTC', name: 'Litecoin', network: 'LTC', recommended: false },
  { code: 'TRX', name: 'TRON', network: 'TRC20', recommended: false },
  { code: 'BNB', name: 'Binance Coin', network: 'BSC', recommended: false },
  { code: 'MATIC', name: 'Polygon', network: 'POLYGON', recommended: false }
];

/**
 * Generate secure MD5 signature for Cryptomus API requests
 * This is the core security mechanism for API authentication
 */
export function generateCryptomusSignature(data: Record<string, any>, apiKey: string): string {
  try {
    // Step 1: Convert data to JSON string
    const jsonString = JSON.stringify(data);
    
    // Step 2: Encode to base64
    const base64Data = btoa(jsonString);
    
    // Step 3: Concatenate with API key
    const message = base64Data + apiKey;
    
    // Step 4: Generate MD5 hash
    const hash = CryptoJS.MD5(message);
    
    // Step 5: Return hex string
    return hash.toString(CryptoJS.enc.Hex);
  } catch (error) {
    console.error('Signature generation failed:', error);
    throw new Error('Failed to generate API signature');
  }
}

/**
 * Verify webhook signature for security
 */
export function verifyWebhookSignature(payload: string, receivedSignature: string): boolean {
  try {
    const message = payload + CRYPTOMUS_CONFIG.WEBHOOK_SECRET;
    const expectedSignature = CryptoJS.MD5(message).toString(CryptoJS.enc.Hex);
    return receivedSignature === expectedSignature;
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return false;
  }
}

// Type definitions for Cryptomus API
export interface CreatePaymentRequest {
  amount: string;
  currency: string;
  order_id: string;
  url_return?: string;
  url_success?: string;
  url_callback?: string;
  is_payment_multiple?: boolean;
  lifetime?: number;
  to_currency?: string;
  subtract?: string;
  accuracy_payment_percent?: string;
  additional_data?: string;
  currencies?: string[];
  except_currencies?: string[];
  course_source?: string;
  from_referral_code?: string;
  discount_percent?: string;
  is_refresh?: boolean;
}

export interface CreatePaymentResponse {
  state: number;
  result?: {
    uuid: string;
    order_id: string;
    amount: string;
    payment_amount: string;
    payer_amount: string;
    discount_percent: string;
    discount: string;
    payer_currency: string;
    currency: string;
    merchant_amount: string;
    network: string;
    address: string;
    from: string;
    txid: string;
    payment_status: string;
    url: string;
    expired_at: number;
    status: string;
    is_final: boolean;
    additional_data: string;
    created_at: string;
    updated_at: string;
  };
  message?: string;
}

export interface PaymentStatusResponse {
  state: number;
  result?: {
    uuid: string;
    order_id: string;
    amount: string;
    payment_amount: string;
    payer_amount: string;
    discount_percent: string;
    discount: string;
    payer_currency: string;
    currency: string;
    merchant_amount: string;
    network: string;
    address: string;
    from: string;
    txid: string;
    payment_status: string;
    url: string;
    expired_at: number;
    status: string;
    is_final: boolean;
    additional_data: string;
    created_at: string;
    updated_at: string;
  };
  message?: string;
}

export interface WebhookPayload {
  uuid: string;
  order_id: string;
  amount: string;
  payment_amount: string;
  payer_amount: string;
  discount_percent: string;
  discount: string;
  payer_currency: string;
  currency: string;
  merchant_amount: string;
  network: string;
  address: string;
  from: string;
  txid: string;
  payment_status: string;
  url: string;
  expired_at: number;
  status: string;
  is_final: boolean;
  additional_data: string;
  created_at: string;
  updated_at: string;
}

/**
 * Core Cryptomus API Client
 * Handles all direct API communication
 */
export class CryptomusAPIClient {
  private static async makeRequest<T>(
    endpoint: string,
    data: Record<string, any>,
    apiKey: string
  ): Promise<T> {
    try {
      // Add merchant UUID to all requests
      const requestData = {
        ...data,
        merchant: CRYPTOMUS_CONFIG.MERCHANT_UUID
      };

      // Generate signature
      const signature = generateCryptomusSignature(requestData, apiKey);

      // Make API request
      const response = await fetch(`${CRYPTOMUS_CONFIG.BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'merchant': CRYPTOMUS_CONFIG.MERCHANT_UUID,
          'sign': signature,
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.state !== 0) {
        throw new Error(result.message || 'Cryptomus API error');
      }

      return result as T;
    } catch (error) {
      console.error(`Cryptomus API request failed (${endpoint}):`, error);
      throw error;
    }
  }

  /**
   * Create a new payment invoice
   */
  static async createPayment(request: CreatePaymentRequest): Promise<CreatePaymentResponse> {
    return this.makeRequest<CreatePaymentResponse>(
      '/payment',
      request,
      CRYPTOMUS_CONFIG.PAYMENT_API_KEY
    );
  }

  /**
   * Check payment status
   */
  static async getPaymentStatus(uuid: string): Promise<PaymentStatusResponse> {
    return this.makeRequest<PaymentStatusResponse>(
      '/payment/info',
      { uuid },
      CRYPTOMUS_CONFIG.PAYMENT_API_KEY
    );
  }

  /**
   * Get payment history
   */
  static async getPaymentHistory(dateFrom?: string, dateTo?: string): Promise<any> {
    const data: any = {};
    if (dateFrom) data.date_from = dateFrom;
    if (dateTo) data.date_to = dateTo;

    return this.makeRequest<any>(
      '/payment/list',
      data,
      CRYPTOMUS_CONFIG.PAYMENT_API_KEY
    );
  }

  /**
   * Create payout to seller
   */
  static async createPayout(data: {
    amount: string;
    currency: string;
    network: string;
    address: string;
    order_id: string;
    url_callback?: string;
  }): Promise<any> {
    return this.makeRequest<any>(
      '/payout',
      data,
      CRYPTOMUS_CONFIG.PAYOUT_API_KEY
    );
  }

  /**
   * Get merchant balance
   */
  static async getBalance(): Promise<any> {
    return this.makeRequest<any>(
      '/balance',
      {},
      CRYPTOMUS_CONFIG.PAYMENT_API_KEY
    );
  }
}

/**
 * Payment status mapping
 */
export const PAYMENT_STATUS_MAP = {
  'paid': 'completed',
  'paid_over': 'completed',
  'process': 'pending',
  'confirm_check': 'pending',
  'wrong_amount': 'failed',
  'cancel': 'cancelled',
  'fail': 'failed',
  'system_fail': 'failed',
  'refund_process': 'refunding',
  'refund_fail': 'refund_failed',
  'refund_paid': 'refunded'
} as const;

/**
 * Get user-friendly payment status
 */
export function getPaymentStatusDisplay(cryptomusStatus: string): {
  status: string;
  label: string;
  color: string;
} {
  const mappedStatus = PAYMENT_STATUS_MAP[cryptomusStatus as keyof typeof PAYMENT_STATUS_MAP] || 'unknown';
  
  const statusConfig = {
    completed: { label: 'Payment Successful', color: 'green' },
    pending: { label: 'Payment Processing', color: 'yellow' },
    failed: { label: 'Payment Failed', color: 'red' },
    cancelled: { label: 'Payment Cancelled', color: 'gray' },
    refunding: { label: 'Refund Processing', color: 'blue' },
    refund_failed: { label: 'Refund Failed', color: 'red' },
    refunded: { label: 'Payment Refunded', color: 'blue' },
    unknown: { label: 'Unknown Status', color: 'gray' }
  };

  return {
    status: mappedStatus,
    ...statusConfig[mappedStatus as keyof typeof statusConfig]
  };
}

/**
 * Validate cryptocurrency address format
 */
export function validateCryptoAddress(address: string, currency: string): boolean {
  if (!address || address.length < 10) return false;

  const patterns = {
    BTC: /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/,
    ETH: /^0x[a-fA-F0-9]{40}$/,
    USDT: /^0x[a-fA-F0-9]{40}$|^T[A-Za-z1-9]{33}$/,
    USDC: /^0x[a-fA-F0-9]{40}$/,
    TRX: /^T[A-Za-z1-9]{33}$/,
    LTC: /^[LM3][a-km-zA-HJ-NP-Z1-9]{26,33}$|^ltc1[a-z0-9]{39,59}$/,
    BNB: /^0x[a-fA-F0-9]{40}$|^bnb[a-z0-9]{39,59}$/,
    MATIC: /^0x[a-fA-F0-9]{40}$/
  };

  const pattern = patterns[currency as keyof typeof patterns];
  return pattern ? pattern.test(address) : true;
}

/**
 * Calculate network fees (estimated)
 */
export function getEstimatedNetworkFee(currency: string): { fee: number; currency: string } {
  const fees = {
    BTC: { fee: 0.0001, currency: 'BTC' },
    ETH: { fee: 0.002, currency: 'ETH' },
    USDT: { fee: 1, currency: 'USDT' }, // TRC20
    USDC: { fee: 0.002, currency: 'ETH' }, // ERC20
    TRX: { fee: 1, currency: 'TRX' },
    LTC: { fee: 0.001, currency: 'LTC' },
    BNB: { fee: 0.0005, currency: 'BNB' },
    MATIC: { fee: 0.01, currency: 'MATIC' }
  };

  return fees[currency as keyof typeof fees] || { fee: 0, currency };
}