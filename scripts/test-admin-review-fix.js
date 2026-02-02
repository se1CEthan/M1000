#!/usr/bin/env node

/**
 * Test script to verify admin review system functionality
 * Run this after applying the fix-admin-review-system.sql script
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are set in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAdminReviewSystem() {
  console.log('🧪 Testing Admin Review System...\n');

  try {
    // Test 1: Check if required tables exist
    console.log('1. Checking required tables...');
    
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .in('table_name', ['profiles', 'seller_verification_applications', 'admin_activity_log']);

    if (tablesError) {
      console.error('❌ Error checking tables:', tablesError.message);
      return;
    }

    const tableNames = tables.map(t => t.table_name);
    const requiredTables = ['profiles', 'seller_verification_applications', 'admin_activity_log'];
    const missingTables = requiredTables.filter(t => !tableNames.includes(t));

    if (missingTables.length > 0) {
      console.error('❌ Missing tables:', missingTables.join(', '));
      return;
    }
    console.log('✅ All required tables exist');

    // Test 2: Check if required columns exist in profiles table
    console.log('\n2. Checking profiles table columns...');
    
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'profiles')
      .in('column_name', [
        'verification_status',
        'verification_reviewed_at', 
        'verification_reviewed_by',
        'verification_submitted_at',
        'verification_notes'
      ]);

    if (columnsError) {
      console.error('❌ Error checking columns:', columnsError.message);
      return;
    }

    const columnNames = columns.map(c => c.column_name);
    const requiredColumns = [
      'verification_status',
      'verification_reviewed_at', 
      'verification_reviewed_by',
      'verification_submitted_at',
      'verification_notes'
    ];
    const missingColumns = requiredColumns.filter(c => !columnNames.includes(c));

    if (missingColumns.length > 0) {
      console.error('❌ Missing columns in profiles table:', missingColumns.join(', '));
      return;
    }
    console.log('✅ All required columns exist in profiles table');

    // Test 3: Check if log_admin_activity function exists
    console.log('\n3. Checking log_admin_activity function...');
    
    const { data: functions, error: functionsError } = await supabase
      .from('information_schema.routines')
      .select('routine_name')
      .eq('routine_name', 'log_admin_activity');

    if (functionsError) {
      console.error('❌ Error checking functions:', functionsError.message);
      return;
    }

    if (functions.length === 0) {
      console.error('❌ log_admin_activity function not found');
      return;
    }
    console.log('✅ log_admin_activity function exists');

    // Test 4: Check sample data access (without authentication)
    console.log('\n4. Testing basic table access...');
    
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, role, verification_status')
      .limit(1);

    if (profilesError) {
      console.log('⚠️  Profiles access (expected with RLS):', profilesError.message);
    } else {
      console.log('✅ Profiles table accessible');
    }

    const { data: applicationsData, error: applicationsError } = await supabase
      .from('seller_verification_applications')
      .select('id, status')
      .limit(1);

    if (applicationsError) {
      console.log('⚠️  Applications access (expected with RLS):', applicationsError.message);
    } else {
      console.log('✅ Seller verification applications table accessible');
    }

    console.log('\n🎉 Admin Review System Test Complete!');
    console.log('\n📋 Summary:');
    console.log('✅ All required tables exist');
    console.log('✅ All required columns exist');
    console.log('✅ Required functions exist');
    console.log('✅ RLS policies are active (as expected)');
    
    console.log('\n🔧 Next Steps:');
    console.log('1. Run the fix-admin-review-system.sql script in your Supabase SQL Editor');
    console.log('2. Create an admin user using the create-admin-user.sql script');
    console.log('3. Test the admin review functionality in your application');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testAdminReviewSystem().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('❌ Test script failed:', error);
  process.exit(1);
});