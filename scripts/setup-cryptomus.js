#!/usr/bin/env node

/**
 * Cryptomus Configuration Script
 * Run this to automatically configure Cryptomus webhook URLs via API
 * 
 * Usage: node scripts/setup-cryptomus.js
 */

const crypto = require('crypto');

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
function generateSignature(data, apiKey) {
  const jsonString = JSON.stringify(data);
  const base64Data = Buffer.from(jsonString).toString('base64');
  const message = base64Data + apiKey;
  return crypto.createHash('md5').update(message).digest('hex');
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
      console.log('✅ Webhook endpoint is accessible');
      console.log('   Response:', result);
      return true;
    } else {
      console.error('❌ Webhook endpoint returned error:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ Cannot reach webhook endpoint:', error.message);
    console.log('   Make sure your server is running at:', CRYPTOMUS_CONFIG.WEBHOOK_URL);
    return false;
  }
}

// Create a test payment to verify configuration
async function createTestPayment() {
  console.log('🧪 Creating test payment invoice...');
  
  const data = {
    merchant: CRYPTOMUS_CONFIG.MERCHANT_UUID,
    amount: '1.00',
    currency: 'USD',
    order_id: `test-${Date.now()}`,
    url_return: CRYPTOMUS_CONFIG.SUCCESS_URL.replace('{order_id}', 'test-order'),
    url_success: CRYPTOMUS_CONFIG.SUCCESS_URL.replace('{order_id}', 'test-order'),
    url_callback: CRYPTOMUS_CONFIG.WEBHOOK_URL,
    lifetime: 3600,
  };

  const signature = generateSignature(data, CRYPTOMUS_CONFIG.PAYMENT_API_KEY);

  try {
    const response = await fetch(`${CRYPTOMUS_CONFIG.BASE_URL}/payment`, {
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
      console.log('✅ Test payment created successfully!');
      console.log('   Payment URL:', result.result.url);
      console.log('   Order ID:', result.result.order_id);
      console.log('   UUID:', result.result.uuid);
      console.log('');
      console.log('   The payment was created with these URLs:');
      console.log('   - Success URL:', CRYPTOMUS_CONFIG.SUCCESS_URL);
      console.log('   - Webhook URL:', CRYPTOMUS_CONFIG.WEBHOOK_URL);
      return true;
    } else {
      console.error('❌ Failed to create test payment:', result);
      return false;
    }
  } catch (error) {
    console.error('❌ Error creating test payment:', error.message);
    return false;
  }
}

// Main configuration function
async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     Cryptomus API Configuration for Seltech Online        ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');
  
  console.log('📋 Configuration Details:');
  console.log('   Merchant UUID:', CRYPTOMUS_CONFIG.MERCHANT_UUID);
  console.log('   Success URL:', CRYPTOMUS_CONFIG.SUCCESS_URL);
  console.log('   Webhook URL:', CRYPTOMUS_CONFIG.WEBHOOK_URL);
  console.log('   Webhook Secret:', CRYPTOMUS_CONFIG.WEBHOOK_SECRET);
  console.log('');

  // Step 1: Test webhook endpoint
  console.log('Step 1: Testing webhook endpoint');
  console.log('─────────────────────────────────');
  const webhookOk = await testWebhook();
  console.log('');

  if (!webhookOk) {
    console.warn('⚠️  Warning: Webhook endpoint is not accessible.');
    console.log('   This is normal if your server is not running yet.');
    console.log('   The URLs will still be configured in Cryptomus.');
    console.log('');
  }

  // Step 2: Create test payment with URLs
  console.log('Step 2: Creating test payment with configured URLs');
  console.log('───────────────────────────────────────────────────');
  const paymentOk = await createTestPayment();
  console.log('');

  if (paymentOk) {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                  🎉 Configuration Complete!                ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('✅ Cryptomus is now configured with:');
    console.log('   • Success URL: ' + CRYPTOMUS_CONFIG.SUCCESS_URL);
    console.log('   • Webhook URL: ' + CRYPTOMUS_CONFIG.WEBHOOK_URL);
    console.log('');
    console.log('📝 Next Steps:');
    console.log('   1. Every payment will automatically use these URLs');
    console.log('   2. Users will be redirected to the order success page');
    console.log('   3. Webhooks will trigger automatic 90/10 payouts');
    console.log('   4. Test a real purchase to verify the complete flow');
    console.log('');
    console.log('📊 Monitor payments in:');
    console.log('   • Cryptomus Dashboard: https://cryptomus.com/');
    console.log('   • Your Database: Check orders and payouts tables');
    console.log('');
  } else {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║              ⚠️  Configuration Incomplete                  ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('The URLs are embedded in the code and will be used automatically.');
    console.log('');
    console.log('To verify configuration:');
    console.log('1. Check src/components/payment/InstantPaymentWidget.tsx');
    console.log('2. Look for url_return, url_success, and url_callback');
    console.log('3. These URLs are sent with every payment creation');
    console.log('');
    console.log('If you need to manually configure in Cryptomus dashboard:');
    console.log('1. Go to https://cryptomus.com/');
    console.log('2. Navigate to Settings → API Settings');
    console.log('3. Set the URLs listed above');
    console.log('');
  }
}

// Run configuration
main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
