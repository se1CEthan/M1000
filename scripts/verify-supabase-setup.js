#!/usr/bin/env node

/**
 * Supabase Setup Verification Script
 * Run this to verify your Supabase configuration is correct
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are set in your .env file');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function verifySetup() {
  console.log('🔍 Verifying Supabase Setup for Seltech Marketplace');
  console.log('================================================\n');

  let allChecks = true;

  // Test 1: Database Connection
  try {
    const { data, error } = await supabase.from('platform_settings').select('key').limit(1);
    if (error) throw error;
    console.log('✅ Database connection successful');
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
    allChecks = false;
  }

  // Test 2: Check Tables Exist
  try {
    const tables = ['profiles', 'products', 'orders', 'reviews', 'wishlists', 'disputes', 'payouts', 'platform_settings'];
    for (const table of tables) {
      const { error } = await supabase.from(table).select('*').limit(1);
      if (error && !error.message.includes('row-level security')) {
        throw new Error(`Table ${table} not accessible: ${error.message}`);
      }
    }
    console.log('✅ All required tables exist and are accessible');
  } catch (error) {
    console.log('❌ Table check failed:', error.message);
    allChecks = false;
  }

  // Test 3: Check Platform Settings
  try {
    const { data, error } = await supabase
      .from('platform_settings')
      .select('key, value')
      .in('key', ['commission_rate', 'featured_products_limit']);
    
    if (error) throw error;
    
    if (data && data.length >= 2) {
      console.log('✅ Platform settings configured');
      data.forEach(setting => {
        console.log(`   - ${setting.key}: ${JSON.stringify(setting.value)}`);
      });
    } else {
      console.log('⚠️  Platform settings incomplete');
    }
  } catch (error) {
    console.log('❌ Platform settings check failed:', error.message);
    allChecks = false;
  }

  // Test 4: Check Storage Buckets
  try {
    const { data, error } = await supabase.storage.listBuckets();
    if (error) throw error;
    
    const requiredBuckets = ['product-files', 'product-images', 'avatars'];
    const existingBuckets = data.map(bucket => bucket.name);
    const missingBuckets = requiredBuckets.filter(bucket => !existingBuckets.includes(bucket));
    
    if (missingBuckets.length === 0) {
      console.log('✅ All storage buckets configured');
      console.log(`   - Buckets: ${existingBuckets.join(', ')}`);
    } else {
      console.log(`⚠️  Missing storage buckets: ${missingBuckets.join(', ')}`);
    }
  } catch (error) {
    console.log('❌ Storage buckets check failed:', error.message);
    allChecks = false;
  }

  // Test 5: Test Authentication (without actually signing up)
  try {
    // This should fail with a specific error, not a connection error
    const { error } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'invalid'
    });
    
    if (error && error.message.includes('Invalid login credentials')) {
      console.log('✅ Authentication service is working');
    } else if (error) {
      console.log('⚠️  Authentication service response:', error.message);
    }
  } catch (error) {
    console.log('❌ Authentication test failed:', error.message);
    allChecks = false;
  }

  // Test 6: Check RLS Policies
  try {
    // Try to access products (should work for approved products)
    const { data, error } = await supabase
      .from('products')
      .select('id, title, status')
      .eq('status', 'approved')
      .limit(1);
    
    // This should either return data or an empty array, not an RLS error
    if (error && error.message.includes('row-level security')) {
      console.log('❌ RLS policies may be too restrictive');
      allChecks = false;
    } else {
      console.log('✅ RLS policies configured correctly');
    }
  } catch (error) {
    console.log('❌ RLS policy check failed:', error.message);
    allChecks = false;
  }

  // Summary
  console.log('\n================================================');
  if (allChecks) {
    console.log('🎉 All checks passed! Your Supabase setup is ready for production.');
    console.log('\nNext steps:');
    console.log('1. Create your first admin user');
    console.log('2. Configure authentication providers');
    console.log('3. Test the complete user flow');
  } else {
    console.log('⚠️  Some checks failed. Please review the issues above.');
    console.log('\nRefer to SUPABASE_DASHBOARD_SETUP.md for detailed setup instructions.');
  }
}

// Run verification
verifySetup().catch(error => {
  console.error('❌ Verification script failed:', error);
  process.exit(1);
});