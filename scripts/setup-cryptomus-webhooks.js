#!/usr/bin/env node

// Automatic Cryptomus Webhook Configuration Script
// This script configures webhooks via the Cryptomus API automatically

const crypto = require('crypto');

// Cryptomus configuration
const CRYPTOMUS_CONFIG = {
  MERCHANT_UUID: '6e6c1018-48f4-49fd-a10d-36d6cd70eefe',
  PAYMENT_API_KEY: 'DSk5vMk3RIBhiQ3qGUw1pH1iYJI1hSSN8iTYmHpm3WpyTj9bsTtIlhadpiFKlK5aVUmpjHH8YoLV9dQsxLAPzpQOdiffl2hzJo0378ExFJB3HMSx49LjTfvnm9qHztoP',
  PAYOUT_API_KEY: '2nuhleS45ns1WTJDX1ZoRG8UAmDFDdahvMafGhU5knS5P3Ozn1Yx0tgRYCmjJpKvtNx0GVQ0FTLo0SNVw1ZM7Zy97fXSsbHX8SGbgGepEHCqwtxw3gIJ8LKDIMDJ3W4s',
  WEBHOOK_SECRET: 'seltech_webhook_secret_2024',
  BASE_URL: 'https://api.cryptomus.com/v1',
  DOMAIN: 'https://seltech.online'
};

// Generate MD5 signature for Cryptomus API
function generateSignature(data, apiKey) {
  const jsonString = JSON.stringify(data);
  const base64Data = Buffer.from(jsonString).toString('base64');
  const signature = crypto.createHash('md5').update(base64Data + apiKey).digest('hex');
  return signature;
}

// Make API request to Cryptomus
async function cryptomusRequest(endpoint, data, apiKey) {
  const signature = generateSignature(data, apiKey);
  
  const response = await fetch(`${CRYPTOMUS_CONFIG.BASE_URL}${endpoint}`, {
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
    throw new Error(`Cryptomus API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  return response.json();
}

// Configure payment webhook
async function setupPaymentWebhook() {
  console.log('🔧 Configuring payment webhook...');
  
  try {
    const webhookData = {
      merchant: CRYPTOMUS_CONFIG.MERCHANT_UUID,
      url_callback: `${CRYPTOMUS_CONFIG.DOMAIN}/api/webhooks/cryptomus`,
      webhook_secret: CRYPTOMUS_CONFIG.WEBHOOK_SECRET,
    };

    const result = await cryptomusRequest('/merchant/webhook', webhookData, CRYPTOMUS_CONFIG.PAYMENT_API_KEY);
    
    if (result.state === 0) {
      console.log('✅ Payment webhook configured successfully');
      console.log(`   URL: ${CRYPTOMUS_CONFIG.DOMAIN}/api/webhooks/cryptomus`);
      return true;
    } else {
      console.error('❌ Failed to configure payment webhook:', result);
      return false;
    }
  } catch (error) {
    console.error('❌ Payment webhook configuration error:', error.message);
    return false;
  }
}

// Configure payout webhook
async function setupPayoutWebhook() {
  console.log('🔧 Configuring payout webhook...');
  
  try {
    const webhookData = {
      merchant: CRYPTOMUS_CONFIG.MERCHANT_UUID,
      url_callback: `${CRYPTOMUS_CONFIG.DOMAIN}/api/webhooks/cryptomus-payout`,
      webhook_secret: CRYPTOMUS_CONFIG.WEBHOOK_SECRET,
    };

    const result = await cryptomusRequest('/payout/webhook', webhookData, CRYPTOMUS_CONFIG.PAYOUT_API_KEY);
    
    if (result.state === 0) {
      console.log('✅ Payout webhook configured successfully');
      console.log(`   URL: ${CRYPTOMUS_CONFIG.DOMAIN}/api/webhooks/cryptomus-payout`);
      return true;
    } else {
      console.error('❌ Failed to configure payout webhook:', result);
      return false;
    }
  } catch (error) {
    console.error('❌ Payout webhook configuration error:', error.message);
    return false;
  }
}

// Test webhook endpoints
async function testWebhookEndpoints() {
  console.log('🧪 Testing webhook endpoints...');
  
  try {
    // Test payment webhook
    const paymentResponse = await fetch(`${CRYPTOMUS_CONFIG.DOMAIN}/api/webhooks/cryptomus`, {
      method: 'GET',
    });
    
    if (paymentResponse.ok) {
      console.log('✅ Payment webhook endpoint is accessible');
    } else {
      console.warn('⚠️ Payment webhook endpoint returned:', paymentResponse.status);
    }

    // Test payout webhook
    const payoutResponse = await fetch(`${CRYPTOMUS_CONFIG.DOMAIN}/api/webhooks/cryptomus-payout`, {
      method: 'GET',
    });
    
    if (payoutResponse.ok) {
      console.log('✅ Payout webhook endpoint is accessible');
    } else {
      console.warn('⚠️ Payout webhook endpoint returned:', payoutResponse.status);
    }

    return true;
  } catch (error) {
    console.error('❌ Webhook endpoint test failed:', error.message);
    return false;
  }
}

// Get merchant info
async function getMerchantInfo() {
  console.log('📊 Getting merchant information...');
  
  try {
    const data = {
      merchant: CRYPTOMUS_CONFIG.MERCHANT_UUID,
    };

    const result = await cryptomusRequest('/merchant/info', data, CRYPTOMUS_CONFIG.PAYMENT_API_KEY);
    
    if (result.state === 0) {
      console.log('✅ Merchant info retrieved successfully');
      console.log(`   Merchant: ${result.result.name || 'Seltech'}`);
      console.log(`   Status: ${result.result.status || 'Active'}`);
      console.log(`   Balance: ${result.result.balance || '0'} USD`);
      return result.result;
    } else {
      console.error('❌ Failed to get merchant info:', result);
      return null;
    }
  } catch (error) {
    console.error('❌ Merchant info error:', error.message);
    return null;
  }
}

// Main setup function
async function setupCryptomusWebhooks() {
  console.log('🚀 Starting Cryptomus webhook configuration for seltech.online...\n');
  
  // Get merchant info first
  const merchantInfo = await getMerchantInfo();
  if (!merchantInfo) {
    console.error('❌ Cannot proceed without merchant info. Please check your API keys.');
    process.exit(1);
  }
  
  console.log('');
  
  // Setup webhooks
  const paymentSuccess = await setupPaymentWebhook();
  const payoutSuccess = await setupPayoutWebhook();
  
  console.log('');
  
  // Test endpoints
  await testWebhookEndpoints();
  
  console.log('\n🎉 Cryptomus webhook configuration complete!\n');
  
  if (paymentSuccess && payoutSuccess) {
    console.log('✅ SUCCESS: All webhooks configured successfully');
    console.log('');
    console.log('📋 Configuration Summary:');
    console.log(`   Merchant UUID: ${CRYPTOMUS_CONFIG.MERCHANT_UUID}`);
    console.log(`   Payment Webhook: ${CRYPTOMUS_CONFIG.DOMAIN}/api/webhooks/cryptomus`);
    console.log(`   Payout Webhook: ${CRYPTOMUS_CONFIG.DOMAIN}/api/webhooks/cryptomus-payout`);
    console.log(`   Webhook Secret: ${CRYPTOMUS_CONFIG.WEBHOOK_SECRET}`);
    console.log('');
    console.log('🚀 Your seltech.online marketplace is now ready for production!');
    console.log('💰 You will earn 10% commission on every sale automatically.');
    console.log('');
    console.log('Next steps:');
    console.log('1. Deploy your site: npm run build && git push');
    console.log('2. Run database setup: Execute SQL scripts in Supabase');
    console.log('3. Start earning: Your marketplace is live!');
  } else {
    console.log('❌ PARTIAL SUCCESS: Some webhooks failed to configure');
    console.log('');
    console.log('Manual configuration may be required in Cryptomus dashboard:');
    console.log('1. Login to https://cryptomus.com/merchant');
    console.log('2. Go to Settings → Webhooks');
    console.log(`3. Add Payment Webhook: ${CRYPTOMUS_CONFIG.DOMAIN}/api/webhooks/cryptomus`);
    console.log(`4. Add Payout Webhook: ${CRYPTOMUS_CONFIG.DOMAIN}/api/webhooks/cryptomus-payout`);
    console.log(`5. Set Webhook Secret: ${CRYPTOMUS_CONFIG.WEBHOOK_SECRET}`);
  }
}

// Run the setup
if (require.main === module) {
  setupCryptomusWebhooks().catch(error => {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  });
}

module.exports = {
  setupCryptomusWebhooks,
  CRYPTOMUS_CONFIG
};