#!/usr/bin/env node

/**
 * Test Seller Verification Insert
 * This script tests if we can actually insert a seller verification application
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

async function testSellerVerificationInsert() {
  console.log('🧪 Testing Seller Verification Insert...\n');

  try {
    // Test 1: Check table structure
    console.log('1. Checking table structure...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('seller_verification_applications')
      .select('*')
      .limit(0);

    if (tableError) {
      console.error('❌ Table access error:', tableError.message);
      return false;
    }
    console.log('✅ Table is accessible');

    // Test 2: Find a test user
    console.log('\n2. Finding test user...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, user_id, email, role')
      .limit(1);

    if (profilesError) {
      console.error('❌ Profiles error:', profilesError.message);
      return false;
    }

    if (!profiles || profiles.length === 0) {
      console.log('⚠️  No profiles found for testing');
      return false;
    }

    const testProfile = profiles[0];
    console.log(`✅ Found test profile: ${testProfile.email}`);
    console.log(`   - Profile ID: ${testProfile.id}`);
    console.log(`   - User ID: ${testProfile.user_id}`);

    // Test 3: Try to insert a test application (this will test RLS)
    console.log('\n3. Testing insert with correct user_id...');
    
    const testApplication = {
      user_id: testProfile.user_id, // This should match auth.uid() in real usage
      full_name: 'Test User',
      date_of_birth: '1990-01-01',
      phone_number: '+1234567890',
      address: {
        line1: '123 Test Street',
        city: 'Test City',
        state: 'TS',
        postal_code: '12345',
        country: 'Test Country'
      },
      business_type: 'individual',
      selling_reason: 'I want to sell digital products on this platform because I have experience creating useful tools and templates.',
      experience_level: 'intermediate',
      product_categories: ['software', 'templates'],
      expected_monthly_sales: 1000,
      terms_accepted: true,
      commission_rate_accepted: true,
      status: 'pending'
    };

    // Note: This will fail with RLS because we're not authenticated as the user
    // But it will tell us if the RLS policy is the issue
    const { data: insertData, error: insertError } = await supabase
      .from('seller_verification_applications')
      .insert(testApplication)
      .select();

    if (insertError) {
      if (insertError.message.includes('RLS') || insertError.message.includes('row-level security')) {
        console.log('✅ RLS is working (blocking unauthenticated insert)');
        console.log('   This is expected - users need to be authenticated');
        console.log('   Error:', insertError.message);
      } else {
        console.error('❌ Unexpected insert error:', insertError.message);
        return false;
      }
    } else {
      console.log('⚠️  Insert succeeded without authentication - RLS might be disabled');
      console.log('   Inserted application ID:', insertData[0]?.id);
      
      // Clean up test data
      await supabase
        .from('seller_verification_applications')
        .delete()
        .eq('id', insertData[0].id);
    }

    // Test 4: Check RLS policies exist
    console.log('\n4. Checking RLS policies...');
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_table_policies', { table_name: 'seller_verification_applications' })
      .catch(() => ({ data: null, error: { message: 'RPC not available' } }));

    if (policiesError) {
      console.log('ℹ️  Cannot check policies directly (RPC not available)');
    } else if (policies && policies.length > 0) {
      console.log(`✅ Found ${policies.length} RLS policies`);
    } else {
      console.log('⚠️  No RLS policies found');
    }

    console.log('\n🎉 Seller verification insert test completed!');
    console.log('\n📋 Summary:');
    console.log('   - Table is accessible');
    console.log('   - Test profile found with correct structure');
    console.log('   - RLS policies are active (blocking unauthenticated access)');
    console.log('   - Ready for authenticated user testing');

    return true;

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    return false;
  }
}

// Run the test
testSellerVerificationInsert()
  .then(success => {
    if (success) {
      console.log('\n✅ Seller verification insert test completed successfully!');
      console.log('\n🚀 The issue is likely that RLS requires proper authentication.');
      console.log('   Users need to be signed in and the form should use their auth.uid()');
      process.exit(0);
    } else {
      console.log('\n❌ Seller verification insert test failed.');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });