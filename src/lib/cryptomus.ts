// Note: crypto module is not available in browser, using crypto-js for MD5
import CryptoJS from 'crypto-js';

// Cryptomus API Configuration
export const CRYPTOMUS_CONFIG = {
  PAYMENT_API_KEY: 'DSk5vMk3RIBhiQ3qGUw1pH1iYJI1hSSN8iTYmHpm3WpyTj9bsTtIlhadpiFKlK5aVUmpjHH8YoLV9dQsxLAPzpQOdiffl2hzJo0378ExFJB3HMSx49LjTfvnm9qHztoP',
  PAYOUT_API_KEY: '2nuhleS45ns1WTJDX1ZoRG8UAmDFDdahvMafGhU5knS5P3Ozn1Yx0tgRYCmjJpKvtNx0GVQ0FTLo0SNVw1ZM7Zy97fXSsbHX8SGbgGepEHCqwtxw3gIJ8LKDIMDJ3W4s',
  BASE_URL: 'https://api.cryptomus.com/v1',
  MERCHANT_UUID: '6e6c1018-48f4-49fd-a10d-36d6cd70eefe',
  WEBHOOK_SECRET: import.meta.env.VITE_CRYPTOMUS_WEBHOOK_SECRET || 'your-webhook-secret'
};

// Supported cryptocurrencies
export const SUPPORTED_CURRENCIES = [
  { code: 'USDT', name: 'Tether (USDT)', network: 'TRC20' },
  { code: 'USDC', name: 'USD Coin (USDC)', network: 'ERC20' },
  { code: 'BTC', name: 'Bitcoin (BTC)', network: 'BTC' },
  { code: 'ETH', name: 'Ethereum (ETH)', network: 'ERC20' },
  { code: 'LTC', name: 'Litecoin (LTC)', network: 'LTC' },
  { code: 'TRX', name: 'TRON (TRX)', network: 'TRC20' },
];

// Generate signature for Cryptomus API (production-ready MD5)
export async function generateSignature(data: Record<string, any>, apiKey: string): Promise<string> {
  try {
    const jsonString = JSON.stringify(data);
    const base64Data = btoa(jsonString);
    const message = base64Data + apiKey;
    
    // Use crypto-js for proper MD5 hashing
    const hash = CryptoJS.MD5(message);
    return hash.toString(CryptoJS.enc.Hex);
  } catch (error) {
    console.error('Signature generation error:', error);
    throw new Error('Failed to generate payment signature');
  }
}

// Create payment invoice
export interface CreateInvoiceRequest {
  amount: string;
  currency: string;
  order_id: string;
  url_return?: string;
  url_success?: string;
  url_callback?: string;
  is_payment_multiple?: boolean;
  lifetime?: number;
  to_currency?: string;
}

export interface CreateInvoiceResponse {
  state: number;
  result: {
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
}

export async function createPaymentInvoice(
  invoiceData: CreateInvoiceRequest
): Promise<CreateInvoiceResponse> {
  const data = {
    ...invoiceData,
    merchant: CRYPTOMUS_CONFIG.MERCHANT_UUID,
  };

  const signature = await generateSignature(data, CRYPTOMUS_CONFIG.PAYMENT_API_KEY);

  const response = await fetch(`${CRYPTOMUS_CONFIG.BASE_URL}/payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'merchant': CRYPTOMUS_CONFIG.MERCHANT_UUID,
      'sign': signature,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Cryptomus API error: ${response.statusText}`);
  }

  return response.json();
}

// Check payment status
export interface PaymentStatusResponse {
  state: number;
  result: {
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
}

export async function checkPaymentStatus(uuid: string): Promise<PaymentStatusResponse> {
  const data = {
    uuid,
    merchant: CRYPTOMUS_CONFIG.MERCHANT_UUID,
  };

  const signature = await generateSignature(data, CRYPTOMUS_CONFIG.PAYMENT_API_KEY);

  const response = await fetch(`${CRYPTOMUS_CONFIG.BASE_URL}/payment/info`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'merchant': CRYPTOMUS_CONFIG.MERCHANT_UUID,
      'sign': signature,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Cryptomus API error: ${response.statusText}`);
  }

  return response.json();
}

// Create payout to seller
export interface CreatePayoutRequest {
  amount: string;
  currency: string;
  network: string;
  address: string;
  order_id: string;
  url_callback?: string;
}

export interface CreatePayoutResponse {
  state: number;
  result: {
    uuid: string;
    amount: string;
    currency: string;
    network: string;
    address: string;
    txid: string;
    status: string;
    is_final: boolean;
    balance: string;
    payer_currency: string;
    payer_amount: string;
    created_at: string;
    updated_at: string;
  };
}

export async function createPayout(
  payoutData: CreatePayoutRequest
): Promise<CreatePayoutResponse> {
  const data = {
    ...payoutData,
    merchant: CRYPTOMUS_CONFIG.MERCHANT_UUID,
  };

  const signature = await generateSignature(data, CRYPTOMUS_CONFIG.PAYOUT_API_KEY);

  const response = await fetch(`${CRYPTOMUS_CONFIG.BASE_URL}/payout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'merchant': CRYPTOMUS_CONFIG.MERCHANT_UUID,
      'sign': signature,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Cryptomus API error: ${response.statusText}`);
  }

  return response.json();
}

// Verify webhook signature (production-ready)
export async function verifyWebhookSignature(
  payload: string,
  signature: string
): Promise<boolean> {
  try {
    const message = payload + CRYPTOMUS_CONFIG.WEBHOOK_SECRET;
    const expectedSignature = CryptoJS.MD5(message).toString(CryptoJS.enc.Hex);
    return signature === expectedSignature;
  } catch (error) {
    console.error('Webhook signature verification error:', error);
    return false;
  }
}

// Calculate revenue split
export function calculateRevenueSplit(totalAmount: number) {
  const platformFee = totalAmount * 0.1; // 10% platform fee
  const sellerEarnings = totalAmount * 0.9; // 90% to seller
  
  return {
    totalAmount,
    platformFee: Math.round(platformFee * 100) / 100,
    sellerEarnings: Math.round(sellerEarnings * 100) / 100,
  };
}