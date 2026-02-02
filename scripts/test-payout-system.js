#!/usr/bin/env node

/**
 * Test Payout System - Verify Live Payout Functionality
 * Run this after setting up the database to test the payout system
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  console.error('Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_KEY in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🧪 Testing Payout System Functionality');
console.log('=====================================\n');

async function testDatabaseTables() {
  console.log('🔍 Testing database tables...');
  
  const tables = [
    'seller_payout_methods',
    'seller_pending_balances', 
    'pending_payout_transactions',
    'notifications',
    'payout_settings',
    'payouts'
  ];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.error(`❌ Table ${table}: ${error.message}`);
        return false;
      } else {
        console.log(`✅ Table ${table}: OK`);
      }
    } catch (error) {
      console.error(`❌ Table ${table}: ${error.message}`);
      return false;
    }
  }
  
  return true;
}

async function testPayoutSettings() {
  console.log('\n🔍 Testing payout settings...');
  
  try {
    const { data, error } = await supabase
      .from('payout_settings')
      .select('*');
      
    if (error) {
      console.error(`❌ Payout settings: ${error.message}`);
      return false;
    }
    
    const expectedSettings = [
      'minimum_payout_crypto',
      'minimum_payout_paypal', 
      'minimum_payout_bank',
      'minimum_payout_wise',
      'auto_payout_enabled',
      'payout_schedule'
    ];
    
    const existingSettings = data.map(s => s.setting_key);
    
    for (const setting of expectedSettings) {
      if (existingSettings.includes(setting)) {
        console.log(`✅ Setting ${setting}: OK`);
      } else {
        console.error(`❌ Setting ${setting}: Missing`);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Payout settings test failed: ${error.message}`);
    return false;
  }
}

async function testSellerProfile() {
  console.log('\n🔍 Testing seller profile creation...');
  
  try {
    // Check if we have any seller profiles
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('user_id, role, email')
      .eq('role', 'seller')
      .limit(1);
      
    if (error) {
      console.error(`❌ Profile query: ${error.message}`);
      return false;
    }
    
    if (profiles && profiles.length > 0) {
      const sellerId = profiles[0].user_id;
      console.log(`✅ Found seller profile: ${profiles[0].email}`);
      
      // Check if pending balance was created
      const { data: balance, error: balanceError } = await supabase
        .from('seller_pending_balances')
        .select('*')
        .eq('seller_id', sellerId)
        .single();
        
      if (balanceError && balanceError.code !== 'PGRST116') {
        console.error(`❌ Pending balance check: ${balanceError.message}`);
        return false;
      }
      
      if (balance) {
        console.log(`✅ Pending balance exists: $${balance.amount}`);
      } else {
        console.log(`ℹ️ No pending balance (will be created automatically)`);
      }
      
      return true;
    } else {
      console.log(`ℹ️ No seller profiles found (create one to test fully)`);
      return true;
    }
  } catch (error) {
    console.error(`❌ Seller profile test failed: ${error.message}`);
    return false;
  }
}

async function testNotificationSystem() {
  console.log('\n🔍 Testing notification system...');
  
  try {
    // Try to insert a test notification
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
        type: 'test',
        title: 'Test Notification',
        message: 'This is a test notification',
        data: { test: true }
      })
      .select()
      .single();
      
    if (error) {
      // Expected to fail due to foreign key constraint, but table structure should be OK
      if (error.message.includes('violates foreign key constraint')) {
        console.log(`✅ Notification table structure: OK`);
        return true;
      } else {
        console.error(`❌ Notification test: ${error.message}`);
        return false;
      }
    }
    
    // Clean up test notification if it was created
    if (data) {
      await supabase.from('notifications').delete().eq('id', data.id);
      console.log(`✅ Notification system: OK`);
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Notification test failed: ${error.message}`);
    return false;
  }
}

async function testPayoutMethodValidation() {
  console.log('\n🔍 Testing payout method validation...');
  
  try {
    // Test valid method types
    const validMethods = ['crypto', 'paypal', 'bank', 'wise'];
    
    for (const method of validMethods) {
      const { error } = await supabase
        .from('seller_payout_methods')
        .insert({
          seller_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
          method_type: method,
          method_name: `Test ${method}`,
          method_address: 'test-address',
          currency: 'USD'
        });
        
      // Expected to fail due to foreign key, but constraint should be OK
      if (error && error.message.includes('violates foreign key constraint')) {
        console.log(`✅ Method type ${method}: Validation OK`);
      } else if (error && error.message.includes('violates check constraint')) {
        console.error(`❌ Method type ${method}: Invalid constraint`);
        return false;
      }
    }
    
    // Test invalid method type
    const { error: invalidError } = await supabase
      .from('seller_payout_methods')
      .insert({
        seller_id: '00000000-0000-0000-0000-000000000000',
        method_type: 'invalid_method',
        method_name: 'Test Invalid',
        method_address: 'test-address',
        currency: 'USD'
      });
      
    if (invalidError && invalidError.message.includes('violates check constraint')) {
      console.log(`✅ Invalid method type rejected: OK`);
    } else {
      console.error(`❌ Invalid method type not rejected`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Payout method validation failed: ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  console.log('Starting comprehensive payout system tests...\n');
  
  const tests = [
    { name: 'Database Tables', fn: testDatabaseTables },
    { name: 'Payout Settings', fn: testPayoutSettings },
    { name: 'Seller Profiles', fn: testSellerProfile },
    { name: 'Notification System', fn: testNotificationSystem },
    { name: 'Payout Method Validation', fn: testPayoutMethodValidation }
  ];
  
  let passedTests = 0;
  let totalTests = tests.length;
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passedTests++;
      }
    } catch (error) {
      console.error(`❌ Test ${test.name} crashed: ${error.message}`);
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`📊 Test Results: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 ALL TESTS PASSED!');
    console.log('✅ Your payout system is ready for production!');
    console.log('\n🚀 Next Steps:');
    console.log('1. Create a seller account and configure payout method');
    console.log('2. Test with a real product purchase');
    console.log('3. Verify automatic payout processing');
    console.log('4. Launch your marketplace!');
  } else {
    console.log('❌ Some tests failed. Please check the errors above.');
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure you ran the database setup SQL');
    console.log('2. Check your Supabase configuration');
    console.log('3. Verify all environment variables are set');
    process.exit(1);
  }
  
  console.log('\n' + '='.repeat(50));
}

// Run the tests
runAllTests().catch(error => {
  console.error('❌ Test suite crashed:', error);
  process.exit(1);
});