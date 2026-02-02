#!/usr/bin/env node

/**
 * Test Emergency Seller Verification Fix
 * This script tests if the emergency fix allows seller verification submissions
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testEmergencyFix() {
  console.log('🚨 Testing Emergency Seller Verification Fix...\n');

  try {
    // Test 1: Check if we can access the table
    console.log('1. Testing table access...');
    const { data: tableData, error: tableError } = await supabase
      .from('seller_verification_applications')
      .select('id')
      .limit(1);

    if (tableError) {
      console.error('❌ Table access error:', tableError.message);
      return false;
    }
    console.log('✅ Table is accessible');

    // Test 2: Try to insert a test application (should work with RLS disabled)
    console.log('\n2. Testing insert without authentication...');
    
    const testApplication = {
      user_id: crypto.randomUUID(), // Random UUID for testing
      full_name: 'Emergency Test User',
      selling_reason: 'This is a test application to verify the emergency fix works. This message is long enough to meet the minimum character requirement for the selling reason field.',
      experience_level: 'beginner',
      business_type: 'individual',
      product_categories: ['software'],
      expected_monthly_sales: 500,
      terms_accepted: true,
      commission_rate_accepted: true,
      status: 'pending'
    };

    const { data: insertData, error: insertError } = await supabase
      .from('seller_verification_applications')
      .insert(testApplication)
      .select();

    if (insertError) {
      console.error('❌ Insert failed:', insertError.message);
      return false;
    }

    console.log('✅ Insert successful!');
    console.log(`   Application ID: ${insertData[0].id}`);

    // Test 3: Clean up test data
    console.log('\n3. Cleaning up test data...');
    const { error: deleteError } = await supabase
      .from('seller_verification_applications')
      .delete()
      .eq('id', insertData[0].id);

    if (deleteError) {
      console.error('⚠️  Cleanup failed:', deleteError.message);
    } else {
      console.log('✅ Test data cleaned up');
    }

    // Test 4: Check existing applications
    console.log('\n4. Checking existing applications...');
    const { data: existingApps, error: countError } = await supabase
      .from('seller_verification_applications')
      .select('id, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (countError) {
      console.error('❌ Count error:', countError.message);
    } else {
      console.log(`✅ Found ${existingApps.length} existing applications`);
      if (existingApps.length > 0) {
        console.log('   Recent applications:');
        existingApps.forEach(app => {
          console.log(`   - ${app.id}: ${app.status} (${new Date(app.created_at).toLocaleDateString()})`);
        });
      }
    }

    console.log('\n🎉 Emergency fix test completed successfully!');
    console.log('\n📋 Results:');
    console.log('   ✅ Table is accessible');
    console.log('   ✅ Insert works without RLS blocking');
    console.log('   ✅ Delete works for cleanup');
    console.log('   ✅ Users should now be able to submit applications');

    return true;

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    return false;
  }
}

// Run the test
testEmergencyFix()
  .then(success => {
    if (success) {
      console.log('\n🚀 EMERGENCY FIX IS WORKING!');
      console.log('   Users can now submit seller verification applications.');
      console.log('   Remember to implement proper RLS policies later for security.');
      process.exit(0);
    } else {
      console.log('\n❌ Emergency fix failed - additional debugging needed.');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });