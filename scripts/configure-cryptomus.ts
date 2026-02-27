/**
 * Cryptomus API Configuration Script
 * Automatically configures webhook URLs and settings via Cryptomus API
 */

import CryptoJS from 'crypto-js';

// Cryptomus Configuration
const CRYPTOMUS_CONFIG = {
  MERCHANT_UUID: '6e6c1018-48f4-49fd-a10d-36d6cd70eefe',
  PAYMENT_API_KEY: 'DSk5vMk3RIBhiQ3qGUw1pH1iYJI1hSSN8iTYmHpm3WpyTj9bsTtIlhadpiFKlK5aVUmpjHH8YoLV9dQsxLAPzpQOdiffl2hzJo0378ExFJB3HMSx49LjTfvnm9qHztoP',
  BASE_URL: 'https://api.cryptomus.com/v1',
  
  // URLs to configure
  SUCCESS_URL: 'https://seltech.online/order-success?order_id={order_id}',
  WEBHOOK_URL: 'https://seltech.online/api/webhooks/cryptomus',
  WEBHOOK_SECRET: 'seltech_webhook_secret_2024'
};

// Generate API signature
function generateSignature(data: Record<string, any>, apiKey: string): string {
  const jsonString = JSON.stringify(data);
  const base64Data = Buffer.from(jsonString).toString('base64');
  const message = base64Data + apiKey;
  return CryptoJS.MD5(message).toString(CryptoJS.enc.Hex);
}

// Configure webhook settings
async function configureWebhook() {
  console.log('🔧 Configuring Cryptomus webhook settings...');
  
  const data = {
    merchant: CRYPTOMUS_CONFIG.MERCHANT_UUID,
    url_callback: CRYPTOMUS_CONFIG.WEBHOOK_URL,
    url_success: CRYPTOMUS_CONFIG.SUCCESS_URL,
    url_return: CRYPTOMUS_CONFIG.SUCCESS_URL,
  };

  const signature = generateSignature(data, CRYPTOMUS_CONFIG.PAYMENT_API_KEY);

  try {
    const response = await fetch(`${CRYPTOMUS_CONFIG.BASE_URL}/merchant/settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'merchant': CRYPTOMUS_CONFIG.MERCHANT_UUID,
        'sign': signature,
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (response.ok && result.state === 0) {
      console.log('✅ Webhook settings configured successfully!');
      console.log('📋 Configuration:', {
        success_url: CRYPTOMUS_CONFIG.SUCCESS_URL,
        webhook_url: CRYPTOMUS_CONFIG.WEBHOOK_URL,
        merchant: CRYPTOMUS_CONFIG.MERCHANT_UUID
      });
      return true;
    } else {
      console.error('❌ Failed to configure webhook:', result);
      return false;
    }
  } catch (error) {
    console.error('❌ Error configuring webhook:', error);
    return false;
  }
}

// Test webhook endpoint
async function testWebhook() {
  console.log('🧪 Testing webhook endpoint...');
  
  try {
    const response = await fetch(CRYPTOMUS_CONFIG.WEBHOOK_URL, {
      method: 'GET',
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Webhook endpoint is accessible:', result);
      return true;
    } else {
      console.error('❌ Webhook endpoint returned error:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ Cannot reach webhook endpoint:', error);
    return false;
  }
}

// Get current merchant settings
async function getMerchantSettings() {
  console.log('📊 Fetching current merchant settings...');
  
  const data = {
    merchant: CRYPTOMUS_CONFIG.MERCHANT_UUID,
  };

  const signature = generateSignature(data, CRYPTOMUS_CONFIG.PAYMENT_API_KEY);

  try {
    const response = await fetch(`${CRYPTOMUS_CONFIG.BASE_URL}/merchant/info`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'merchant': CRYPTOMUS_CONFIG.MERCHANT_UUID,
        'sign': signature,
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (response.ok && result.state === 0) {
      console.log('✅ Current settings:', result.result);
      return result.result;
    } else {
      console.error('❌ Failed to fetch settings:', result);
      return null;
    }
  } catch (error) {
    console.error('❌ Error fetching settings:', error);
    return null;
  }
}

// Main configuration function
async function main() {
  console.log('🚀 Starting Cryptomus API Configuration...\n');
  
  console.log('📋 Configuration Details:');
  console.log('  Merchant UUID:', CRYPTOMUS_CONFIG.MERCHANT_UUID);
  console.log('  Success URL:', CRYPTOMUS_CONFIG.SUCCESS_URL);
  console.log('  Webhook URL:', CRYPTOMUS_CONFIG.WEBHOOK_URL);
  console.log('  Webhook Secret:', CRYPTOMUS_CONFIG.WEBHOOK_SECRET);
  console.log('');

  // Step 1: Test webhook endpoint
  const webhookOk = await testWebhook();
  console.log('');

  if (!webhookOk) {
    console.warn('⚠️  Warning: Webhook endpoint is not accessible. Make sure your server is running.');
    console.log('');
  }

  // Step 2: Get current settings
  await getMerchantSettings();
  console.log('');

  // Step 3: Configure webhook
  const configured = await configureWebhook();
  console.log('');

  if (configured) {
    console.log('🎉 Configuration Complete!');
    console.log('');
    console.log('Next steps:');
    console.log('1. ✅ Webhook URLs are configured');
    console.log('2. ✅ Success URL is set');
    console.log('3. 🔄 Test a payment to verify the flow');
    console.log('4. 📊 Monitor webhook logs in Cryptomus dashboard');
  } else {
    console.log('❌ Configuration Failed');
    console.log('');
    console.log('Manual configuration required:');
    console.log('1. Go to https://cryptomus.com/');
    console.log('2. Navigate to Settings → API Settings');
    console.log('3. Set Success URL:', CRYPTOMUS_CONFIG.SUCCESS_URL);
    console.log('4. Set Webhook URL:', CRYPTOMUS_CONFIG.WEBHOOK_URL);
    console.log('5. Set Webhook Secret:', CRYPTOMUS_CONFIG.WEBHOOK_SECRET);
  }
}

// Run configuration
main().catch(console.error);
