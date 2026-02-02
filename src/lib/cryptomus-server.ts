// Server-side Cryptomus integration for real payment processing
// This handles the actual Cryptomus API calls from the server to avoid CORS issues

import CryptoJS from 'crypto-js';

// Cryptomus API Configuration (server-side)
const CRYPTOMUS_CONFIG = {
  PAYMENT_API_KEY: 'DSk5vMk3RIBhiQ3qGUw1pH1iYJI1hSSN8iTYmHpm3WpyTj9bsTtIlhadpiFKlK5aVUmpjHH8YoLV9dQsxLAPzpQOdiffl2hzJo0378ExFJB3HMSx49LjTfvnm9qHztoP',
  PAYOUT_API_KEY: '2nuhleS45ns1WTJDX1ZoRG8UAmDFDdahvMafGhU5knS5P3Ozn1Yx0tgRYCmjJpKvtNx0GVQ0FTLo0SNVw1ZM7Zy97fXSsbHX8SGbgGepEHCqwtxw3gIJ8LKDIMDJ3W4s',
  BASE_URL: 'https://api.cryptomus.com/v1',
  MERCHANT_UUID: '6e6c1018-48f4-49fd-a10d-36d6cd70eefe'
};

// Generate MD5 signature for Cryptomus API
export function generateCryptomusSignature(data: Record<string, any>, apiKey: string): string {
  const jsonString = JSON.stringify(data);
  const base64Data = Buffer.from(jsonString).toString('base64');
  const message = base64Data + apiKey;
  
  return CryptoJS.MD5(message).toString(CryptoJS.enc.Hex);
}

// Create real Cryptomus payment invoice
export async function createRealCryptomusInvoice(invoiceData: {
  amount: string;
  currency: string;
  order_id: string;
  url_return?: string;
  url_success?: string;
  url_callback?: string;
  to_currency?: string;
  lifetime?: number;
}) {
  const data = {
    ...invoiceData,
    merchant: CRYPTOMUS_CONFIG.MERCHANT_UUID,
  };

  const signature = generateCryptomusSignature(data, CRYPTOMUS_CONFIG.PAYMENT_API_KEY);

  console.log('Creating real Cryptomus invoice:', data);

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
    const errorText = await response.text();
    console.error('Cryptomus API error:', response.status, errorText);
    throw new Error(`Cryptomus API error: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();
  console.log('Cryptomus invoice created:', result);
  
  return result;
}

// Check real Cryptomus payment status
export async function checkRealCryptomusStatus(uuid: string) {
  const data = {
    uuid,
    merchant: CRYPTOMUS_CONFIG.MERCHANT_UUID,
  };

  const signature = generateCryptomusSignature(data, CRYPTOMUS_CONFIG.PAYMENT_API_KEY);

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
    const errorText = await response.text();
    console.error('Cryptomus status check error:', response.status, errorText);
    throw new Error(`Cryptomus API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}