#!/usr/bin/env node

/**
 * Test Cryptomus Webhook Endpoint
 * Verifies that the Supabase Edge Function is working correctly
 */

const WEBHOOK_URL = 'https://rtsaarapvlzzinmpjdys.supabase.co/functions/v1/cryptomus-webhook';

/**
 * Test webhook with various scenarios
 */
async function testWebhook() {
  console.log('🧪 Testing Cryptomus Webhook Endpoint\n');
  console.log(`🎯 Webhook URL: ${WEBHOOK_URL}\n`);
  
  const tests = [
    {
      name: 'Invalid signature (should return 401)',
      data: {
        uuid: 'test-payment-123',
        order_id: 'test-order-456',
        status: 'paid',
        amount: '10.00',
        currency: 'USD'
      },
      headers: {
        'Content-Type': 'application/json',
        'sign': 'invalid_signature'
      },
      expectedStatus: 401
    },
    {
      name: 'Missing signature (should return 401)',
      data: {
        uuid: 'test-payment-456',
        order_id: 'test-order-789',
        status: 'paid'
      },
      headers: {
        'Content-Type': 'application/json'
      },
      expectedStatus: 401
    },
    {
      name: 'GET request (should return 405)',
      method: 'GET',
      expectedStatus: 405
    }
  ];
  
  let passedTests = 0;
  
  for (const test of tests) {
    console.log(`🔍 Test: ${test.name}`);
    
    try {
      const options = {
        method: test.method || 'POST',
        headers: test.headers || {}
      };
      
      if (test.data) {
        options.body = JSON.stringify(test.data);
      }
      
      const response = await fetch(WEBHOOK_URL, options);
      const status = response.status;
      
      console.log(`   📊 Response status: ${status}`);
      
      if (status === test.expectedStatus) {
        console.log(`   ✅ PASS - Expected ${test.expectedStatus}, got ${status}`);
        passedTests++;
      } else {
        console.log(`   ❌ FAIL - Expected ${test.expectedStatus}, got ${status}`);
      }
      
      // Try to read response body
      try {
        const responseText = await response.text();
        if (responseText && responseText.length < 200) {
          console.log(`   📋 Response: ${responseText}`);
        }
      } catch (e) {
        // Ignore response body errors
      }
      
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
    }
    
    console.log('');
  }
  
  console.log(`📊 Test Results: ${passedTests}/${tests.length} tests passed\n`);
  
  if (passedTests === tests.length) {
    console.log('🎉 All tests passed! Your webhook endpoint is working correctly.');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Configure this webhook URL in your Cryptomus merchant dashboard');
    console.log('2. Test with a real payment');
    console.log('3. Monitor Supabase function logs for webhook calls');
    console.log('');
    console.log('🔗 Cryptomus Dashboard: https://merchant.cryptomus.com');
    console.log(`🔗 Supabase Functions: https://supabase.com/dashboard/project/rtsaarapvlzzinmpjdys/functions`);
  } else {
    console.log('❌ Some tests failed. Please check your Supabase Edge Function deployment.');
  }
}

/**
 * Test webhook connectivity
 */
async function testConnectivity() {
  console.log('🌐 Testing webhook connectivity...');
  
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'OPTIONS'
    });
    
    console.log(`📊 OPTIONS request status: ${response.status}`);
    
    if (response.status === 200) {
      console.log('✅ Webhook endpoint is accessible');
      return true;
    } else {
      console.log('⚠️ Unexpected OPTIONS response');
      return false;
    }
  } catch (error) {
    console.log(`❌ Connectivity test failed: ${error.message}`);
    return false;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🔧 Cryptomus Webhook Endpoint Test\n');
  
  // Test basic connectivity
  const connected = await testConnectivity();
  console.log('');
  
  if (!connected) {
    console.log('❌ Webhook endpoint is not accessible. Please check your deployment.');
    process.exit(1);
  }
  
  // Run webhook tests
  await testWebhook();
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  });
}

module.exports = { testWebhook, testConnectivity };