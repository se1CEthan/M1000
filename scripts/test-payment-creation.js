#!/usr/bin/env node

/**
 * Test Script: Debug Payment Creation Issues
 * Helps identify why "payment setup failed" error occurs
 */

import crypto from 'crypto';

// Test configuration
const TEST_CONFIG = {
  // Cryptomus API Configuration
  PAYMENT_API_KEY: 'DSk5vMk3RIBhiQ3qGUw1pH1iYJI1hSSN8iTYmHpm3WpyTj9bsTtIlhadpiFKlK5aVUmpjHH8YoLV9dQsxLAPzpQOdiffl2hzJo0378ExFJB3HMSx49LjTfvnm9qHztoP',
  MERCHANT_UUID: '6e6c1018-48f4-49fd-a10d-36d6cd70eefe',
  BASE_URL: 'https://api.cryptomus.com/v1',
  
  // Test payment data
  testPayment: {
    amount: '10.00',
    currency: 'USD',
    order_id: 'test-' + Date.now(),
    to_currency: 'USDT'
  }
};

// Generate MD5 signature (Node.js version)
function generateSignature(data, apiKey) {
  try {
    const jsonString = JSON.stringify(data);
    const base64Data = Buffer.from(jsonString).toString('base64');
    const message = base64Data + apiKey;
    
    const hash = crypto.createHash('md5');
    hash.update(message);
    return hash.digest('hex');
  } catch (error) {
    console.error('Signature generation error:', error);
    throw error;
  }
}

// Test Cryptomus API connection
async function testCryptomusAPI() {
  console.log('🧪 Testing Cryptomus API Connection...\n');
  
  try {
    // Prepare test payment data
    const paymentData = {
      amount: TEST_CONFIG.testPayment.amount,
      currency: TEST_CONFIG.testPayment.currency,
      order_id: TEST_CONFIG.testPayment.order_id,
      merchant: TEST_CONFIG.MERCHANT_UUID,
      to_currency: TEST_CONFIG.testPayment.to_currency,
      url_return: 'https://seltech.online/marketplace',
      url_success: 'https://seltech.online/order-success',
      is_payment_multiple: false,
      lifetime: 3600
    };

    console.log('📦 Payment Data:', JSON.stringify(paymentData, null, 2));

    // Generate signature
    console.log('\n🔐 Generating signature...');
    const signature = generateSignature(paymentData, TEST_CONFIG.PAYMENT_API_KEY);
    console.log('✅ Signature generated:', signature.substring(0, 16) + '...');

    // Make API call
    console.log('\n🚀 Calling Cryptomus API...');
    const response = await fetch(`${TEST_CONFIG.BASE_URL}/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'merchant': TEST_CONFIG.MERCHANT_UUID,
        'sign': signature,
      },
      body: JSON.stringify(paymentData),
    });

    console.log('📡 Response Status:', response.status, response.statusText);

    const result = await response.json();
    console.log('📋 API Response:', JSON.stringify(result, null, 2));

    // Analyze response
    if (result.state === 0 && result.result) {
      console.log('\n✅ SUCCESS: Payment created successfully!');
      console.log('💳 Payment ID:', result.result.uuid);
      console.log('🔗 Payment URL:', result.result.url);
      console.log('💰 Amount:', result.result.payer_amount, result.result.payer_currency);
      
      return {
        success: true,
        paymentId: result.result.uuid,
        paymentUrl: result.result.url
      };
    } else {
      console.log('\n❌ FAILED: API returned error');
      console.log('🚨 Error:', result.message || 'Unknown error');
      console.log('📊 State:', result.state);
      
      return {
        success: false,
        error: result.message || 'API call failed'
      };
    }

  } catch (error) {
    console.log('\n💥 EXCEPTION: API call failed');
    console.error('🔥 Error:', error.message);
    
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.log('🌐 Network Error: Cannot reach Cryptomus API');
      console.log('   - Check internet connection');
      console.log('   - Verify API endpoint URL');
      console.log('   - Check firewall/proxy settings');
    }
    
    return {
      success: false,
      error: error.message
    };
  }
}

// Test signature generation
function testSignatureGeneration() {
  console.log('🔐 Testing Signature Generation...\n');
  
  try {
    const testData = {
      amount: '10.00',
      currency: 'USD',
      order_id: 'test-123'
    };
    
    console.log('📦 Test Data:', JSON.stringify(testData));
    
    const signature = generateSignature(testData, 'test-api-key');
    console.log('✅ Signature:', signature);
    
    // Test with same data should produce same signature
    const signature2 = generateSignature(testData, 'test-api-key');
    const isConsistent = signature === signature2;
    
    console.log('🔄 Consistency Check:', isConsistent ? '✅ PASS' : '❌ FAIL');
    
    return isConsistent;
    
  } catch (error) {
    console.log('❌ Signature generation failed:', error.message);
    return false;
  }
}

// Test API key validation
function testAPIKeyFormat() {
  console.log('🔑 Testing API Key Format...\n');
  
  const apiKey = TEST_CONFIG.PAYMENT_API_KEY;
  const merchantUUID = TEST_CONFIG.MERCHANT_UUID;
  
  console.log('📋 API Key Length:', apiKey.length);
  console.log('📋 Merchant UUID Format:', merchantUUID);
  
  // Check API key format
  const isValidKeyLength = apiKey.length >= 64; // Typical API key length
  const isValidUUIDFormat = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(merchantUUID);
  
  console.log('✅ API Key Length Valid:', isValidKeyLength);
  console.log('✅ UUID Format Valid:', isValidUUIDFormat);
  
  return isValidKeyLength && isValidUUIDFormat;
}

// Main test function
async function runPaymentTests() {
  console.log('🧪 CRYPTOMUS PAYMENT CREATION DEBUG TEST\n');
  console.log('=' .repeat(50));
  
  try {
    // Test 1: API Key Format
    console.log('\n1️⃣ API KEY VALIDATION');
    console.log('-'.repeat(30));
    const keyValid = testAPIKeyFormat();
    
    // Test 2: Signature Generation
    console.log('\n2️⃣ SIGNATURE GENERATION');
    console.log('-'.repeat(30));
    const sigValid = testSignatureGeneration();
    
    // Test 3: API Connection
    console.log('\n3️⃣ CRYPTOMUS API TEST');
    console.log('-'.repeat(30));
    const apiResult = await testCryptomusAPI();
    
    // Summary
    console.log('\n📊 TEST SUMMARY');
    console.log('=' .repeat(50));
    console.log('🔑 API Key Format:', keyValid ? '✅ VALID' : '❌ INVALID');
    console.log('🔐 Signature Generation:', sigValid ? '✅ WORKING' : '❌ BROKEN');
    console.log('🚀 API Connection:', apiResult.success ? '✅ SUCCESS' : '❌ FAILED');
    
    if (apiResult.success) {
      console.log('\n🎉 ALL TESTS PASSED!');
      console.log('💡 Your Cryptomus integration should work correctly.');
      console.log('🔍 If you still get "payment setup failed", check:');
      console.log('   - User authentication in browser');
      console.log('   - Database connection (Supabase)');
      console.log('   - Browser console for specific errors');
    } else {
      console.log('\n🚨 TESTS FAILED!');
      console.log('💡 Issues found:');
      
      if (!keyValid) {
        console.log('   ❌ API key or merchant UUID format invalid');
        console.log('   🔧 Fix: Check Cryptomus dashboard for correct keys');
      }
      
      if (!sigValid) {
        console.log('   ❌ Signature generation broken');
        console.log('   🔧 Fix: Check crypto library installation');
      }
      
      if (!apiResult.success) {
        console.log('   ❌ Cannot connect to Cryptomus API');
        console.log('   🔧 Fix:', apiResult.error);
        
        if (apiResult.error.includes('fetch')) {
          console.log('   🌐 Network issue - check internet connection');
        } else if (apiResult.error.includes('signature')) {
          console.log('   🔐 Invalid API keys - check Cryptomus dashboard');
        } else if (apiResult.error.includes('merchant')) {
          console.log('   🏪 Wrong merchant UUID - verify in dashboard');
        }
      }
    }
    
  } catch (error) {
    console.error('\n💥 TEST SUITE FAILED:', error.message);
    console.log('🔧 Try running: npm install crypto-js');
  }
}

// Run tests if called directly
runPaymentTests().catch(console.error);

export {
  runPaymentTests,
  testCryptomusAPI,
  testSignatureGeneration,
  testAPIKeyFormat
};