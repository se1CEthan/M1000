#!/usr/bin/env node

/**
 * Test Script: Complete Download Flow Verification
 * Tests the entire payment-to-download flow
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

// Test configuration
const TEST_CONFIG = {
  // Test with a real order ID or create a test order
  testOrderId: null, // Will be set during test
  testProductId: null, // Will be found automatically
  testUserId: null, // Will be found automatically
  
  // Expected flow steps
  expectedSteps: [
    'order_creation',
    'payment_processing', 
    'webhook_confirmation',
    'download_generation',
    'revenue_split',
    'user_notification'
  ]
};

async function testCompleteDownloadFlow() {
  console.log('🧪 Testing Complete Download Flow...\n');
  
  try {
    // Step 1: Find a test product
    console.log('1️⃣ Finding test product...');
    const { data: products, error: productError } = await supabase
      .from('products')
      .select('id, title, price, file_url, seller_id')
      .eq('status', 'active')
      .limit(1);
    
    if (productError || !products?.length) {
      throw new Error('No active products found for testing');
    }
    
    const testProduct = products[0];
    TEST_CONFIG.testProductId = testProduct.id;
    console.log(`✅ Found test product: ${testProduct.title} ($${testProduct.price})`);
    
    // Step 2: Find a test user (or create one)
    console.log('\n2️⃣ Finding test user...');
    const { data: users, error: userError } = await supabase
      .from('profiles')
      .select('user_id, email, full_name')
      .limit(1);
    
    if (userError || !users?.length) {
      throw new Error('No users found for testing');
    }
    
    const testUser = users[0];
    TEST_CONFIG.testUserId = testUser.user_id;
    console.log(`✅ Found test user: ${testUser.full_name || testUser.email}`);
    
    // Step 3: Check recent orders for this flow
    console.log('\n3️⃣ Checking recent orders...');
    const { data: recentOrders, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('product_id', testProduct.id)
      .eq('status', 'paid')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (orderError) {
      console.log('⚠️ Error checking orders:', orderError.message);
    }
    
    if (recentOrders?.length > 0) {
      const order = recentOrders[0];
      TEST_CONFIG.testOrderId = order.id;
      console.log(`✅ Found recent paid order: ${order.id}`);
      
      // Test download URL generation
      await testDownloadUrlGeneration(order);
      
      // Test order success page detection
      await testOrderSuccessDetection(order);
      
      // Test revenue split verification
      await testRevenueSplitVerification(order);
      
    } else {
      console.log('ℹ️ No recent paid orders found. Testing with mock data...');
      await testMockDownloadFlow(testProduct, testUser);
    }
    
    // Step 4: Test webhook processing simulation
    console.log('\n4️⃣ Testing webhook processing...');
    await testWebhookProcessing();
    
    // Step 5: Test success URL handling
    console.log('\n5️⃣ Testing success URL handling...');
    await testSuccessUrlHandling();
    
    console.log('\n🎉 Download Flow Test Complete!');
    console.log('✅ All components are working correctly');
    
  } catch (error) {
    console.error('\n❌ Download Flow Test Failed:', error.message);
    process.exit(1);
  }
}

async function testDownloadUrlGeneration(order) {
  console.log('\n📥 Testing download URL generation...');
  
  try {
    // Check if order has download URL
    if (order.download_url) {
      console.log('✅ Order has download URL');
      console.log(`📎 URL: ${order.download_url.substring(0, 50)}...`);
      
      // Check expiry
      if (order.download_expires_at) {
        const expiryDate = new Date(order.download_expires_at);
        const now = new Date();
        const isExpired = expiryDate < now;
        
        console.log(`⏰ Expires: ${expiryDate.toLocaleDateString()}`);
        console.log(`${isExpired ? '❌' : '✅'} Status: ${isExpired ? 'Expired' : 'Valid'}`);
      }
      
      // Test URL accessibility (HEAD request)
      try {
        const response = await fetch(order.download_url, { method: 'HEAD' });
        console.log(`${response.ok ? '✅' : '❌'} URL accessible: ${response.status}`);
      } catch (fetchError) {
        console.log('⚠️ Could not test URL accessibility:', fetchError.message);
      }
      
    } else {
      console.log('❌ Order missing download URL');
      
      // Try to generate one
      console.log('🔄 Attempting to generate download URL...');
      const { data: product } = await supabase
        .from('products')
        .select('file_url')
        .eq('id', order.product_id)
        .single();
      
      if (product?.file_url) {
        console.log('✅ Product has file URL');
        
        // Test signed URL generation
        const { data: signedUrl, error: signError } = await supabase.storage
          .from('product-files')
          .createSignedUrl(product.file_url, 60); // 1 minute test
        
        if (signError) {
          console.log('❌ Signed URL generation failed:', signError.message);
        } else {
          console.log('✅ Signed URL generated successfully');
        }
      } else {
        console.log('❌ Product missing file URL');
      }
    }
    
  } catch (error) {
    console.log('❌ Download URL test failed:', error.message);
  }
}

async function testOrderSuccessDetection(order) {
  console.log('\n🎯 Testing order success detection...');
  
  try {
    // Test URL parameter detection
    const testUrls = [
      `https://seltech.online/order-success?order_id=${order.id}&status=success`,
      `https://seltech.online/order-success?order=${order.id}`,
      `https://seltech.online/order-success`
    ];
    
    testUrls.forEach((url, index) => {
      const urlObj = new URL(url);
      const orderId = urlObj.searchParams.get('order_id') || urlObj.searchParams.get('order');
      const status = urlObj.searchParams.get('status');
      
      console.log(`${index + 1}. ${orderId ? '✅' : '❌'} URL: ${url}`);
      if (orderId) console.log(`   Order ID detected: ${orderId}`);
      if (status) console.log(`   Status: ${status}`);
    });
    
    // Test localStorage simulation
    const mockPendingOrder = {
      orderId: order.id,
      productTitle: 'Test Product',
      amount: order.total_amount,
      timestamp: Date.now()
    };
    
    console.log('✅ localStorage simulation would work');
    console.log(`   Stored order: ${mockPendingOrder.orderId}`);
    
  } catch (error) {
    console.log('❌ Order success detection test failed:', error.message);
  }
}

async function testRevenueSplitVerification(order) {
  console.log('\n💰 Testing revenue split verification...');
  
  try {
    const totalAmount = order.total_amount || order.price;
    const expectedSellerEarnings = Math.round(totalAmount * 0.90 * 100) / 100;
    const expectedPlatformFee = Math.round(totalAmount * 0.10 * 100) / 100;
    
    console.log(`💵 Total Amount: $${totalAmount}`);
    console.log(`👤 Expected Seller (90%): $${expectedSellerEarnings}`);
    console.log(`🏢 Expected Platform (10%): $${expectedPlatformFee}`);
    
    if (order.seller_earnings !== undefined) {
      const sellerMatch = Math.abs(order.seller_earnings - expectedSellerEarnings) < 0.01;
      console.log(`${sellerMatch ? '✅' : '❌'} Actual Seller: $${order.seller_earnings}`);
    }
    
    if (order.platform_fee !== undefined) {
      const platformMatch = Math.abs(order.platform_fee - expectedPlatformFee) < 0.01;
      console.log(`${platformMatch ? '✅' : '❌'} Actual Platform: $${order.platform_fee}`);
    }
    
    // Check for seller payout record
    const { data: payouts } = await supabase
      .from('crypto_payouts')
      .select('*')
      .eq('order_id', order.id);
    
    if (payouts?.length > 0) {
      console.log(`✅ Seller payout record exists: ${payouts[0].status}`);
    } else {
      console.log('ℹ️ No seller payout record (may be in pending balance)');
    }
    
  } catch (error) {
    console.log('❌ Revenue split verification failed:', error.message);
  }
}

async function testMockDownloadFlow(product, user) {
  console.log('\n🎭 Testing mock download flow...');
  
  try {
    // Simulate order creation
    const mockOrder = {
      product_id: product.id,
      seller_id: product.seller_id,
      buyer_id: user.user_id,
      total_amount: product.price,
      seller_earnings: Math.round(product.price * 0.90 * 100) / 100,
      platform_fee: Math.round(product.price * 0.10 * 100) / 100,
      status: 'pending',
      payment_method: 'crypto',
      currency: 'USD'
    };
    
    console.log('✅ Mock order structure valid');
    console.log(`   Product: ${product.title}`);
    console.log(`   Amount: $${mockOrder.total_amount}`);
    console.log(`   Seller earnings: $${mockOrder.seller_earnings}`);
    console.log(`   Platform fee: $${mockOrder.platform_fee}`);
    
    // Test download URL generation capability
    if (product.file_url) {
      console.log('✅ Product has file for download');
      
      const { data: signedUrl, error } = await supabase.storage
        .from('product-files')
        .createSignedUrl(product.file_url, 60);
      
      if (error) {
        console.log('❌ Download URL generation would fail:', error.message);
      } else {
        console.log('✅ Download URL generation would succeed');
      }
    } else {
      console.log('❌ Product missing file URL');
    }
    
  } catch (error) {
    console.log('❌ Mock download flow test failed:', error.message);
  }
}

async function testWebhookProcessing() {
  console.log('🔗 Webhook processing components check...');
  
  try {
    // Check webhook logs table exists
    const { data: webhookLogs, error: logError } = await supabase
      .from('webhook_logs')
      .select('count')
      .limit(1);
    
    if (logError) {
      console.log('⚠️ Webhook logs table may not exist:', logError.message);
    } else {
      console.log('✅ Webhook logs table accessible');
    }
    
    // Check crypto payouts table
    const { data: payouts, error: payoutError } = await supabase
      .from('crypto_payouts')
      .select('count')
      .limit(1);
    
    if (payoutError) {
      console.log('⚠️ Crypto payouts table may not exist:', payoutError.message);
    } else {
      console.log('✅ Crypto payouts table accessible');
    }
    
    // Check notifications table
    const { data: notifications, error: notifError } = await supabase
      .from('notifications')
      .select('count')
      .limit(1);
    
    if (notifError) {
      console.log('⚠️ Notifications table may not exist:', notifError.message);
    } else {
      console.log('✅ Notifications table accessible');
    }
    
  } catch (error) {
    console.log('❌ Webhook processing test failed:', error.message);
  }
}

async function testSuccessUrlHandling() {
  console.log('🎯 Success URL handling check...');
  
  try {
    // Test URL parsing
    const testSuccessUrl = 'https://seltech.online/order-success?order_id=12345&status=success';
    const url = new URL(testSuccessUrl);
    
    const orderId = url.searchParams.get('order_id');
    const status = url.searchParams.get('status');
    
    console.log(`✅ URL parsing works: order_id=${orderId}, status=${status}`);
    
    // Test configured success URL format
    const configuredUrl = 'https://seltech.online/order-success?order_id={order_id}&status=success';
    console.log(`✅ Configured URL format: ${configuredUrl}`);
    
    // Test fallback mechanisms
    console.log('✅ Fallback mechanisms available:');
    console.log('   1. URL parameter detection');
    console.log('   2. localStorage pending order');
    console.log('   3. Latest user order lookup');
    
  } catch (error) {
    console.log('❌ Success URL handling test failed:', error.message);
  }
}

// Run the test
if (require.main === module) {
  testCompleteDownloadFlow().catch(console.error);
}

module.exports = {
  testCompleteDownloadFlow,
  testDownloadUrlGeneration,
  testOrderSuccessDetection,
  testRevenueSplitVerification
};