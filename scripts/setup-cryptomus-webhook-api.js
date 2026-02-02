#!/usr/bin/env node

/**
 * Configure Cryptomus Webhook via API
 * Automatically sets up webhook URL for payment notifications
 */

const crypto = require('crypto');

// Cryptomus Configuration
const CRYPTOMUS_CONFIG = {
  MERCHANT_UUID: '6e6c1018-48f4-49fd-a10d-36d6cd70eefe',
  PAYMENT_API_KEY: 'DSk5vMk3RIBhiQ3qGUw1pH1iYJI1hSSN8iTYmHpm3WpyTj9bsTtIlhadpiFKlK5aVUmpjHH8YoLV9dQsxLAPzpQOdiffl2hzJo0378ExFJB3HMSx49LjTfvnm9qHztoP',
  BASE_URL: 'https://api.cryptomus.com/v1',
  WEBHOOK_URL: 'https://rtsaarapvlzzinmpjdys.supabase.co/functions/v1/cryptomus-webhook'
};

/**
 * Generate Cryptomus API signature
 */
function generateSignature(data, apiKey) {
  const jsonString = JSON.stringify(data);
  const base64Data = Buffer.from(jsonString).toString('base64');
  const message = base64Data + apiKey;
  return crypto.createHash('md5').update(message).digest('hex');
}

/**
 * Make Cryptomus API request
 */
async function callCryptomusAPI(endpoint, data) {
  data.merchant = CRYPTOMUS_CONFIG.MERCHANT_UUID;
  const signature = generateSignature(data, CRYPTOMUS_CONFIG.PAYMENT_API_KEY);
  
  const headers = {
    'Content-Type': 'application/json',
    'merchant': CRYPTOMUS_CONFIG.MERCHANT_UUID,
    'sign': signature
  };
  
  console.log(`🔗 Calling Cryptomus API: ${endpoint}`);
  console.log(`📝 Request data:`, JSON.stringify(data, null, 2));
  console.log(`🔐 Signature:`, signature);
  
  try {
    const response = await fetch(`${CRYPTOMUS_CONFIG.BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    console.log(`📊 Response status:`, response.status);
    console.log(`📋 Response data:`, JSON.stringify(result, null, 2));
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${JSON.stringify(result)}`);
    }
    
    return result;
  } catch (error) {
    console.error('❌ API request failed:', error.message);
    throw error;
  }
}

/**
 * Configure webhook URL
 */
async function configureWebhook() {
  console.log('🚀 Configuring Cryptomus Webhook...\n');
  
  try {
    // Method 1: Try webhook configuration endpoint
    console.log('📡 Attempting webhook configuration...');
    
    const webhookData = {
      url: CRYPTOMUS_CONFIG.WEBHOOK_URL,
      events: ['payment_success', 'payment_fail', 'payment_cancel']
    };
    
    try {
      const result = await callCryptomusAPI('/webhook', webhookData);
      
      if (result.state === 0) {
        console.log('✅ Webhook configured successfully!');
        console.log(`🎯 Webhook URL: ${CRYPTOMUS_CONFIG.WEBHOOK_URL}`);
        return true;
      } else {
        console.log('⚠️ Webhook configuration returned non-zero state:', result.state);
      }
    } catch (error) {
      console.log('⚠️ Direct webhook endpoint failed, trying alternative methods...');
    }
    
    // Method 2: Try merchant settings endpoint
    console.log('\n📡 Attempting merchant settings update...');
    
    const settingsData = {
      webhook_url: CRYPTOMUS_CONFIG.WEBHOOK_URL,
      notification_url: CRYPTOMUS_CONFIG.WEBHOOK_URL
    };
    
    try {
      const result = await callCryptomusAPI('/merchant/settings', settingsData);
      
      if (result.state === 0) {
        console.log('✅ Merchant settings updated successfully!');
        console.log(`🎯 Webhook URL: ${CRYPTOMUS_CONFIG.WEBHOOK_URL}`);
        return true;
      }
    } catch (error) {
      console.log('⚠️ Merchant settings endpoint failed...');
    }
    
    // Method 3: Try notification configuration
    console.log('\n📡 Attempting notification configuration...');
    
    const notificationData = {
      callback_url: CRYPTOMUS_CONFIG.WEBHOOK_URL,
      ipn_url: CRYPTOMUS_CONFIG.WEBHOOK_URL
    };
    
    try {
      const result = await callCryptomusAPI('/notification/config', notificationData);
      
      if (result.state === 0) {
        console.log('✅ Notification configuration updated successfully!');
        console.log(`🎯 Webhook URL: ${CRYPTOMUS_CONFIG.WEBHOOK_URL}`);
        return true;
      }
    } catch (error) {
      console.log('⚠️ Notification configuration failed...');
    }
    
    console.log('\n❌ All automatic configuration methods failed.');
    console.log('📋 Manual configuration required in Cryptomus dashboard.');
    
    return false;
    
  } catch (error) {
    console.error('❌ Webhook configuration failed:', error.message);
    return false;
  }
}

/**
 * Test webhook endpoint
 */
async function testWebhook() {
  console.log('\n🧪 Testing webhook endpoint...');
  
  try {
    const testData = {
      uuid: 'test-' + Date.now(),
      order_id: 'test-order',
      status: 'paid',
      amount: '1.00',
      currency: 'USD'
    };
    
    const response = await fetch(CRYPTOMUS_CONFIG.WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'sign': 'test_signature'
      },
      body: JSON.stringify(testData)
    });
    
    console.log(`📊 Webhook test response:`, response.status);
    
    if (response.status === 401) {
      console.log('✅ Webhook endpoint is working (correctly rejecting unauthorized requests)');
      return true;
    } else {
      console.log('⚠️ Unexpected webhook response status');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Webhook test failed:', error.message);
    return false;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🔧 Cryptomus Webhook API Configuration\n');
  console.log(`🎯 Target webhook URL: ${CRYPTOMUS_CONFIG.WEBHOOK_URL}`);
  console.log(`🏪 Merchant UUID: ${CRYPTOMUS_CONFIG.MERCHANT_UUID}\n`);
  
  // Test webhook endpoint first
  const webhookWorking = await testWebhook();
  
  if (!webhookWorking) {
    console.log('❌ Webhook endpoint is not accessible. Please check your Supabase deployment.');
    process.exit(1);
  }
  
  // Configure webhook
  const configured = await configureWebhook();
  
  if (configured) {
    console.log('\n🎉 Webhook configuration complete!');
    console.log('\n📋 Next steps:');
    console.log('1. Test a payment to verify webhook delivery');
    console.log('2. Check Supabase function logs for webhook calls');
    console.log('3. Monitor order status updates in database');
  } else {
    console.log('\n📋 Manual configuration required:');
    console.log('1. Login to Cryptomus merchant dashboard');
    console.log('2. Navigate to Settings > Webhooks');
    console.log(`3. Set webhook URL: ${CRYPTOMUS_CONFIG.WEBHOOK_URL}`);
    console.log('4. Enable all payment events');
    console.log('5. Save configuration');
  }
  
  console.log('\n✅ Setup complete!');
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  });
}

module.exports = { configureWebhook, testWebhook };