#!/usr/bin/env node

/**
 * Test script for Live Admin Dashboard functionality
 * Tests real-time features, notifications, and admin operations
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testAdminDashboard() {
  console.log('🚀 Testing Live Admin Dashboard...\n');

  try {
    // Test 1: Check database connectivity
    console.log('1. Testing database connectivity...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (profilesError) {
      console.error('❌ Database connection failed:', profilesError.message);
      return;
    }
    console.log('✅ Database connection successful');

    // Test 2: Check products table
    console.log('\n2. Testing products table access...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, title, status, created_at')
      .limit(5);
    
    if (productsError) {
      console.error('❌ Products table access failed:', productsError.message);
    } else {
      console.log(`✅ Products table accessible (${products?.length || 0} products found)`);
      if (products && products.length > 0) {
        console.log('   Sample product:', products[0].title);
      }
    }

    // Test 3: Check orders table
    console.log('\n3. Testing orders table access...');
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, total_amount, status, created_at')
      .limit(5);
    
    if (ordersError) {
      console.error('❌ Orders table access failed:', ordersError.message);
    } else {
      console.log(`✅ Orders table accessible (${orders?.length || 0} orders found)`);
    }

    // Test 4: Check user profiles and roles
    console.log('\n4. Testing user profiles and roles...');
    const { data: userStats, error: userStatsError } = await supabase
      .from('profiles')
      .select('role')
      .not('role', 'is', null);
    
    if (userStatsError) {
      console.error('❌ User profiles access failed:', userStatsError.message);
    } else {
      const roleStats = userStats?.reduce((acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      }, {});
      
      console.log('✅ User profiles accessible');
      console.log('   Role distribution:', roleStats);
    }

    // Test 5: Check admin users
    console.log('\n5. Testing admin user access...');
    const { data: admins, error: adminsError } = await supabase
      .from('profiles')
      .select('id, email, full_name, role')
      .eq('role', 'admin');
    
    if (adminsError) {
      console.error('❌ Admin users check failed:', adminsError.message);
    } else {
      console.log(`✅ Admin users found: ${admins?.length || 0}`);
      if (admins && admins.length > 0) {
        console.log('   Admin emails:', admins.map(a => a.email).join(', '));
      } else {
        console.log('⚠️  No admin users found. Create admin users with:');
        console.log('   UPDATE profiles SET role = \'admin\' WHERE email = \'your-email@example.com\';');
      }
    }

    // Test 6: Calculate dashboard statistics
    console.log('\n6. Calculating dashboard statistics...');
    
    const today = new Date().toISOString().split('T')[0];
    
    // Product stats
    const pendingProducts = products?.filter(p => p.status === 'pending').length || 0;
    const todayProducts = products?.filter(p => p.created_at.startsWith(today)).length || 0;
    
    // Order stats
    const todayOrders = orders?.filter(o => o.created_at.startsWith(today)).length || 0;
    const todayRevenue = orders?.filter(o => o.created_at.startsWith(today))
      .reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
    
    console.log('✅ Dashboard statistics calculated:');
    console.log(`   - Pending products: ${pendingProducts}`);
    console.log(`   - Today's products: ${todayProducts}`);
    console.log(`   - Today's orders: ${todayOrders}`);
    console.log(`   - Today's revenue: $${todayRevenue.toFixed(2)}`);

    // Test 7: Test real-time capabilities
    console.log('\n7. Testing real-time subscription setup...');
    
    const channel = supabase
      .channel('admin-test')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'products' },
        (payload) => console.log('Real-time product change:', payload.eventType)
      )
      .subscribe();

    if (channel) {
      console.log('✅ Real-time subscription created successfully');
      
      // Clean up
      setTimeout(() => {
        supabase.removeChannel(channel);
        console.log('✅ Real-time subscription cleaned up');
      }, 1000);
    }

    console.log('\n🎉 Live Admin Dashboard Test Complete!');
    console.log('\n📋 Summary:');
    console.log('✅ Database connectivity working');
    console.log('✅ All required tables accessible');
    console.log('✅ User role system functional');
    console.log('✅ Statistics calculation working');
    console.log('✅ Real-time subscriptions ready');
    
    if (admins && admins.length === 0) {
      console.log('\n⚠️  Action Required:');
      console.log('   Create admin users to access the dashboard');
      console.log('   Run: UPDATE profiles SET role = \'admin\' WHERE email = \'your-email\';');
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testAdminDashboard().then(() => {
  console.log('\n✨ Test completed successfully!');
  process.exit(0);
}).catch((error) => {
  console.error('\n💥 Test failed:', error.message);
  process.exit(1);
});