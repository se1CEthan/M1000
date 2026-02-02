#!/usr/bin/env node

/**
 * Admin Dashboard Test Script
 * Tests if all required tables and functionality are working
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

async function testAdminDashboard() {
  console.log('🧪 Testing Admin Dashboard Setup...\n');

  const tests = [
    {
      name: 'seller_verification_applications table',
      test: async () => {
        const { data, error } = await supabase
          .from('seller_verification_applications')
          .select('id')
          .limit(1);
        
        if (error) throw error;
        return `✅ Table exists with ${data?.length || 0} records`;
      }
    },
    {
      name: 'product_reviews table',
      test: async () => {
        const { data, error } = await supabase
          .from('product_reviews')
          .select('id')
          .limit(1);
        
        if (error) throw error;
        return `✅ Table exists with ${data?.length || 0} records`;
      }
    },
    {
      name: 'admin_activity_log table',
      test: async () => {
        const { data, error } = await supabase
          .from('admin_activity_log')
          .select('id')
          .limit(1);
        
        if (error) throw error;
        return `✅ Table exists with ${data?.length || 0} records`;
      }
    },
    {
      name: 'notifications table',
      test: async () => {
        const { data, error } = await supabase
          .from('notifications')
          .select('id')
          .limit(1);
        
        if (error) throw error;
        return `✅ Table exists with ${data?.length || 0} records`;
      }
    },
    {
      name: 'Admin users exist',
      test: async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, email, role')
          .eq('role', 'admin');
        
        if (error) throw error;
        if (!data || data.length === 0) {
          return '⚠️  No admin users found. Create one with: UPDATE profiles SET role = \'admin\' WHERE email = \'your-email@example.com\'';
        }
        return `✅ Found ${data.length} admin user(s): ${data.map(u => u.email).join(', ')}`;
      }
    },
    {
      name: 'Seller applications with profiles',
      test: async () => {
        const { data, error } = await supabase
          .from('seller_verification_applications')
          .select(`
            id,
            full_name,
            status,
            profiles!seller_verification_applications_user_id_fkey(email)
          `)
          .limit(3);
        
        if (error) throw error;
        return `✅ Can fetch applications with profile data (${data?.length || 0} records)`;
      }
    },
    {
      name: 'Product reviews with products',
      test: async () => {
        const { data, error } = await supabase
          .from('product_reviews')
          .select(`
            id,
            status,
            products(title, category)
          `)
          .limit(3);
        
        if (error) throw error;
        return `✅ Can fetch product reviews with product data (${data?.length || 0} records)`;
      }
    }
  ];

  let passedTests = 0;
  let totalTests = tests.length;

  for (const test of tests) {
    try {
      const result = await test.test();
      console.log(`${test.name}: ${result}`);
      if (result.startsWith('✅')) passedTests++;
    } catch (error) {
      console.log(`${test.name}: ❌ ${error.message}`);
      
      if (error.message.includes('does not exist')) {
        console.log('   💡 Run: scripts/fix-missing-admin-tables.sql');
      }
    }
  }

  console.log(`\n📊 Test Results: ${passedTests}/${totalTests} tests passed`);

  if (passedTests === totalTests) {
    console.log('🎉 Admin dashboard is ready to use!');
    console.log('\n📝 Next steps:');
    console.log('1. Start your dev server: npm run dev');
    console.log('2. Login as admin user');
    console.log('3. Navigate to /admin-dashboard');
  } else {
    console.log('\n🔧 Setup required:');
    console.log('1. Run database migration: scripts/fix-missing-admin-tables.sql');
    console.log('2. Create admin user if needed');
    console.log('3. Re-run this test script');
  }
}

testAdminDashboard().catch(console.error);