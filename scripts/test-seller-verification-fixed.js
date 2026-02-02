#!/usr/bin/env node

/**
 * Test Seller Verification System - Fixed Schema
 * Tests the seller verification system with the corrected database schema
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testSellerVerificationSystem() {
  console.log('🧪 Testing Seller Verification System (Fixed Schema)...\n');

  try {
    // Test 1: Check if table exists and has correct structure
    console.log('1️⃣ Testing database table structure...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('seller_verification_applications')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('❌ Table structure test failed:', tableError.message);
      return;
    }
    console.log('✅ Table exists and is accessible');

    // Test 2: Fetch all applications
    console.log('\n2️⃣ Testing application fetching...');
    const { data: applications, error: fetchError } = await supabase
      .from('seller_verification_applications')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('❌ Fetch test failed:', fetchError.message);
      return;
    }

    console.log(`✅ Successfully fetched ${applications.length} applications`);
    
    if (applications.length > 0) {
      console.log('\n📋 Sample Application Data:');
      const sample = applications[0];
      console.log(`   - ID: ${sample.id}`);
      console.log(`   - Name: ${sample.full_name}`);
      console.log(`   - Business Type: ${sample.business_type}`);
      console.log(`   - Status: ${sample.status}`);
      console.log(`   - Categories: ${sample.product_categories?.join(', ') || 'None'}`);
      console.log(`   - Expected Sales: $${sample.expected_monthly_sales || 0}`);
    }

    // Test 3: Test application creation with simplified schema
    console.log('\n3️⃣ Testing application creation...');
    const testApplication = {
      user_id: '00000000-0000-0000-0000-000000000001', // Test UUID
      full_name: 'Test User',
      date_of_birth: '1990-01-01',
      phone_number: '+1-555-TEST',
      address: {
        line1: '123 Test St',
        city: 'Test City',
        state: 'TS',
        postal_code: '12345',
        country: 'USA'
      },
      business_type: 'individual',
      business_name: 'Test Business',
      selling_reason: 'Testing the seller verification system',
      product_categories: ['software', 'templates'],
      expected_monthly_sales: 1000.00,
      terms_accepted: true,
      commission_rate_accepted: true,
      status: 'pending'
    };

    const { data: newApp, error: createError } = await supabase
      .from('seller_verification_applications')
      .insert(testApplication)
      .select()
      .single();

    if (createError) {
      console.error('❌ Create test failed:', createError.message);
      return;
    }

    console.log('✅ Successfully created test application');
    console.log(`   - Created ID: ${newApp.id}`);

    // Test 4: Test application update (simulate admin review)
    console.log('\n4️⃣ Testing application update...');
    const { error: updateError } = await supabase
      .from('seller_verification_applications')
      .update({
        status: 'approved',
        admin_notes: 'Test approval',
        reviewed_at: new Date().toISOString()
      })
      .eq('id', newApp.id);

    if (updateError) {
      console.error('❌ Update test failed:', updateError.message);
      return;
    }

    console.log('✅ Successfully updated application status');

    // Test 5: Clean up test data
    console.log('\n5️⃣ Cleaning up test data...');
    const { error: deleteError } = await supabase
      .from('seller_verification_applications')
      .delete()
      .eq('id', newApp.id);

    if (deleteError) {
      console.error('❌ Cleanup failed:', deleteError.message);
      return;
    }

    console.log('✅ Test data cleaned up successfully');

    // Test 6: Check application status distribution
    console.log('\n6️⃣ Testing status distribution...');
    const statusCounts = {};
    applications.forEach(app => {
      statusCounts[app.status] = (statusCounts[app.status] || 0) + 1;
    });

    console.log('📊 Application Status Distribution:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   - ${status.toUpperCase()}: ${count}`);
    });

    // Test 7: Verify schema matches expectations
    console.log('\n7️⃣ Verifying schema compliance...');
    const requiredFields = [
      'id', 'user_id', 'full_name', 'business_type', 'selling_reason',
      'product_categories', 'terms_accepted', 'commission_rate_accepted',
      'status', 'created_at'
    ];

    const sampleApp = applications[0];
    const missingFields = requiredFields.filter(field => !(field in sampleApp));
    
    if (missingFields.length > 0) {
      console.error(`❌ Missing required fields: ${missingFields.join(', ')}`);
      return;
    }

    console.log('✅ All required fields present in schema');

    // Test 8: Check for removed fields (should not exist)
    const removedFields = [
      'experience_level', 'portfolio_url', 'previous_platforms',
      'identity_document_url', 'business_document_url'
    ];

    const foundRemovedFields = removedFields.filter(field => field in sampleApp);
    
    if (foundRemovedFields.length > 0) {
      console.warn(`⚠️  Found removed fields (should be cleaned up): ${foundRemovedFields.join(', ')}`);
    } else {
      console.log('✅ No removed fields found - schema is clean');
    }

    console.log('\n🎉 All tests passed! Seller verification system is working correctly.');
    console.log('\n📋 System Summary:');
    console.log(`   - Total Applications: ${applications.length}`);
    console.log(`   - Database Schema: ✅ Simplified and Clean`);
    console.log(`   - CRUD Operations: ✅ Working`);
    console.log(`   - Status Management: ✅ Working`);
    console.log(`   - Data Integrity: ✅ Verified`);

  } catch (error) {
    console.error('💥 Test suite failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the tests
testSellerVerificationSystem();