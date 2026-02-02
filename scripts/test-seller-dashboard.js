#!/usr/bin/env node

/**
 * Test Seller Dashboard Functionality
 * This script tests the seller dashboard data loading
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

async function testSellerDashboard() {
  console.log('🧪 Testing Seller Dashboard Data Loading...\n');

  try {
    // Test 1: Check if we can fetch profiles
    console.log('1. Testing profiles table...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, email, role, total_earnings, total_sales, wallet_address')
      .eq('role', 'seller')
      .limit(1);

    if (profilesError) {
      console.error('❌ Profiles error:', profilesError.message);
      return false;
    }

    if (!profiles || profiles.length === 0) {
      console.log('⚠️  No seller profiles found');
      return false;
    }

    const testSeller = profiles[0];
    console.log('✅ Found seller profile:', testSeller.email);

    // Test 2: Check if we can fetch products for seller
    console.log('\n2. Testing products table...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, title, price, status, view_count, download_count, average_rating')
      .eq('seller_id', testSeller.user_id)
      .limit(5);

    if (productsError) {
      console.error('❌ Products error:', productsError.message);
      return false;
    }

    console.log(`✅ Found ${products?.length || 0} products for seller`);

    // Test 3: Check if we can fetch orders for seller
    console.log('\n3. Testing orders table...');
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, order_number, price, seller_earnings, platform_fee, status, completed_at, product_id, buyer_id')
      .eq('seller_id', testSeller.user_id)
      .limit(5);

    if (ordersError) {
      console.error('❌ Orders error:', ordersError.message);
      return false;
    }

    console.log(`✅ Found ${orders?.length || 0} orders for seller`);

    // Test 4: Check if we can fetch payouts for seller
    console.log('\n4. Testing payouts table...');
    const { data: payouts, error: payoutsError } = await supabase
      .from('payouts')
      .select('id, amount, status, wallet_address, processed_at')
      .eq('seller_id', testSeller.user_id)
      .limit(5);

    if (payoutsError) {
      console.error('❌ Payouts error:', payoutsError.message);
      return false;
    }

    console.log(`✅ Found ${payouts?.length || 0} payouts for seller`);

    // Test 5: Calculate analytics
    console.log('\n5. Testing analytics calculations...');
    
    const totalViews = products?.reduce((sum, p) => sum + (p.view_count || 0), 0) || 0;
    const totalDownloads = products?.reduce((sum, p) => sum + (p.download_count || 0), 0) || 0;
    const avgRating = products?.reduce((sum, p) => sum + (p.average_rating || 0), 0) / (products?.length || 1) || 0;
    
    const paidOrders = orders?.filter(o => o.status === 'paid') || [];
    const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.seller_earnings || 0), 0);
    
    const completedPayouts = payouts?.filter(p => p.status === 'completed') || [];
    const totalPayouts = completedPayouts.reduce((sum, p) => sum + (p.amount || 0), 0);
    
    const pendingBalance = Math.max(0, totalRevenue - totalPayouts);

    console.log('📊 Analytics Summary:');
    console.log(`   - Total Views: ${totalViews}`);
    console.log(`   - Total Downloads: ${totalDownloads}`);
    console.log(`   - Average Rating: ${avgRating.toFixed(1)}`);
    console.log(`   - Total Revenue: $${totalRevenue.toFixed(2)}`);
    console.log(`   - Total Payouts: $${totalPayouts.toFixed(2)}`);
    console.log(`   - Pending Balance: $${pendingBalance.toFixed(2)}`);
    console.log(`   - Has Wallet: ${testSeller.wallet_address ? 'Yes' : 'No'}`);

    console.log('\n🎉 All seller dashboard tests passed!');
    return true;

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    return false;
  }
}

// Run the test
testSellerDashboard()
  .then(success => {
    if (success) {
      console.log('\n✅ Seller Dashboard is working correctly!');
      process.exit(0);
    } else {
      console.log('\n❌ Seller Dashboard has issues that need to be fixed.');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });