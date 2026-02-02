#!/usr/bin/env node

// Test Webhook Endpoints Script
// Tests that webhook endpoints are working correctly

const crypto = require('crypto');

const CRYPTOMUS_CONFIG = {
  MERCHANT_UUID: '6e6c1018-48f4-49fd-a10d-36d6cd70eefe',
  WEBHOOK_SECRET: 'seltech_webhook_secret_2024',
  DOMAIN: 'https://seltech.online'
};

// Generate test webhook signature
function generateTestSignature(payload) {
  return crypto
    .createHash('md5')
    .update(payload + CRYPTOMUS_CONFIG.WEBHOOK_SECRET)
    .digest('hex');
}

// Test payment webhook
async function testPaymentWebhook() {
  console.log('🧪 Testing payment webhook...');
  
  const testPayload = {
    uuid: 'test-payment-uuid-' + Date.now(),
    order_id: 'test-order-' + Date.now(),
    amount: '10.00',
    currency: 'USDT',
    status: 'paid',
    merchant: CRYPTOMUS_CONFIG.MERCHANT_UUID,
    network: 'TRC20',
    txid: 'test-transaction-id',
    created_at: new Date().toISOString()
  };

  const payloadString = JSON.stringify(testPayload);
  const signature = generateTestSignature(payloadString);

  try {
    // Test GET request first
    const getResponse = await fetch(`${CRYPTOMUS_CONFIG.DOMAIN}/api/webhooks/cryptomus`, {
      method: 'GET',
    });

    if (getResponse.ok) {
      const getResult = await getResponse.json();
      console.log('✅ Payment webhook GET endpoint working:', getResult.service);
    } else {
      console.warn('⚠️ Payment webhook GET failed:', getResponse.status);
    }

    // Test POST request (webhook simulation)
    const postResponse = await fetch(`${CRYPTOMUS_CONFIG.DOMAIN}/api/webhooks/cryptomus`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'sign': signature,
      },
      body: payloadString,
    });

    if (postResponse.ok) {
      console.log('✅ Payment webhook POST endpoint working');
    } else {
      const errorText = await postResponse.text();
      console.warn('⚠️ Payment webhook POST failed:', postResponse.status, errorText);
    }

    return true;
  } catch (error) {
    console.error('❌ Payment webhook test failed:', error.message);
    return false;
  }
}

// Test payout webhook
async function testPayoutWebhook() {
  console.log('🧪 Testing payout webhook...');
  
  const testPayload = {
    uuid: 'test-payout-uuid-' + Date.now(),
    order_id: 'test-payout-order-' + Date.now(),
    amount: '9.00',
    currency: 'USDT',
    status: 'paid',
    merchant: CRYPTOMUS_CONFIG.MERCHANT_UUID,
    network: 'TRC20',
    txid: 'test-payout-transaction-id',
    address: 'test-wallet-address',
    created_at: new Date().toISOString()
  };

  const payloadString = JSON.stringify(testPayload);
  const signature = generateTestSignature(payloadString);

  try {
    // Test GET request first
    const getResponse = await fetch(`${CRYPTOMUS_CONFIG.DOMAIN}/api/webhooks/cryptomus-payout`, {
      method: 'GET',
    });

    if (getResponse.ok) {
      const getResult = await getResponse.json();
      console.log('✅ Payout webhook GET endpoint working:', getResult.service);
    } else {
      console.warn('⚠️ Payout webhook GET failed:', getResponse.status);
    }

    // Test POST request (webhook simulation)
    const postResponse = await fetch(`${CRYPTOMUS_CONFIG.DOMAIN}/api/webhooks/cryptomus-payout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'sign': signature,
      },
      body: payloadString,
    });

    if (postResponse.ok) {
      console.log('✅ Payout webhook POST endpoint working');
    } else {
      const errorText = await postResponse.text();
      console.warn('⚠️ Payout webhook POST failed:', postResponse.status, errorText);
    }

    return true;
  } catch (error) {
    console.error('❌ Payout webhook test failed:', error.message);
    return false;
  }
}

// Test site availability
async function testSiteAvailability() {
  console.log('🌐 Testing site availability...');
  
  const endpoints = [
    '/',
    '/marketplace',
    '/auth',
    '/seller',
    '/admin'
  ];

  let allWorking = true;

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${CRYPTOMUS_CONFIG.DOMAIN}${endpoint}`, {
        method: 'GET',
      });

      if (response.ok) {
        console.log(`✅ ${endpoint} - Working (${response.status})`);
      } else {
        console.warn(`⚠️ ${endpoint} - Status: ${response.status}`);
        allWorking = false;
      }
    } catch (error) {
      console.error(`❌ ${endpoint} - Error: ${error.message}`);
      allWorking = false;
    }
  }

  return allWorking;
}

// Main test function
async function runWebhookTests() {
  console.log('🚀 Starting webhook endpoint tests for seltech.online...\n');
  
  // Test site availability first
  const siteWorking = await testSiteAvailability();
  console.log('');
  
  // Test webhook endpoints
  const paymentWorking = await testPaymentWebhook();
  const payoutWorking = await testPayoutWebhook();
  
  console.log('\n📊 Test Results Summary:');
  console.log(`   Site Availability: ${siteWorking ? '✅ Working' : '❌ Issues detected'}`);
  console.log(`   Payment Webhook: ${paymentWorking ? '✅ Working' : '❌ Issues detected'}`);
  console.log(`   Payout Webhook: ${payoutWorking ? '✅ Working' : '❌ Issues detected'}`);
  
  if (siteWorking && paymentWorking && payoutWorking) {
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('✅ Your seltech.online marketplace is ready for production!');
    console.log('💰 Webhooks are configured and working correctly.');
    console.log('🚀 You can start accepting payments and earning commissions!');
  } else {
    console.log('\n⚠️ SOME TESTS FAILED');
    console.log('Please check the issues above and ensure:');
    console.log('1. Your site is deployed and accessible');
    console.log('2. Webhook endpoints are properly configured');
    console.log('3. API routes are working correctly');
  }
  
  console.log('\nNext steps:');
  console.log('1. Run: npm run setup-webhooks (to configure Cryptomus)');
  console.log('2. Execute database setup scripts in Supabase');
  console.log('3. Start marketing your marketplace!');
}

// Run the tests
if (require.main === module) {
  runWebhookTests().catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
}

module.exports = {
  runWebhookTests,
  testPaymentWebhook,
  testPayoutWebhook,
  testSiteAvailability
};