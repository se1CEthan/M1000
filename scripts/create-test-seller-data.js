#!/usr/bin/env node

/**
 * Create Test Seller Data
 * This script creates sample data for testing the seller dashboard
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

async function createTestSellerData() {
  console.log('🧪 Creating Test Seller Data...\n');

  try {
    // Find a seller profile
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, email, role')
      .eq('role', 'seller')
      .limit(1);

    if (profilesError) {
      console.error('❌ Profiles error:', profilesError.message);
      return false;
    }

    if (!profiles || profiles.length === 0) {
      console.log('⚠️  No seller profiles found. Creating one...');
      
      // Create a test seller profile
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          user_id: crypto.randomUUID(),
          email: 'test-seller@example.com',
          full_name: 'Test Seller',
          role: 'seller',
          total_earnings: 0,
          total_sales: 0
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Error creating seller profile:', createError.message);
        return false;
      }

      console.log('✅ Created test seller profile:', newProfile.email);
      profiles.push(newProfile);
    }

    const testSeller = profiles[0];
    console.log('✅ Using seller profile:', testSeller.email);

    // Create test products
    console.log('\n📦 Creating test products...');
    const testProducts = [
      {
        seller_id: testSeller.user_id,
        title: 'Amazing Bot Template',
        description: 'A powerful bot template for Discord servers',
        short_description: 'Discord bot template with advanced features',
        price: 29.99,
        category: 'bots',
        status: 'approved',
        slug: 'amazing-bot-template',
        view_count: 150,
        download_count: 25,
        average_rating: 4.5,
        pricing_type: 'one_time'
      },
      {
        seller_id: testSeller.user_id,
        title: 'React Dashboard Template',
        description: 'Modern React dashboard with TypeScript',
        short_description: 'Professional dashboard template',
        price: 49.99,
        category: 'templates',
        status: 'approved',
        slug: 'react-dashboard-template',
        view_count: 89,
        download_count: 12,
        average_rating: 4.8,
        pricing_type: 'one_time'
      }
    ];

    for (const product of testProducts) {
      const { error: productError } = await supabase
        .from('products')
        .upsert(product, { onConflict: 'slug' });

      if (productError) {
        console.error('❌ Error creating product:', productError.message);
      } else {
        console.log(`✅ Created/updated product: ${product.title}`);
      }
    }

    // Get created products
    const { data: createdProducts } = await supabase
      .from('products')
      .select('id, title, price')
      .eq('seller_id', testSeller.user_id);

    // Create test orders
    console.log('\n💰 Creating test orders...');
    if (createdProducts && createdProducts.length > 0) {
      const testOrders = [
        {
          seller_id: testSeller.user_id,
          buyer_id: testSeller.user_id, // Using same user for simplicity
          product_id: createdProducts[0].id,
          price: createdProducts[0].price,
          seller_earnings: createdProducts[0].price * 0.9,
          platform_fee: createdProducts[0].price * 0.1,
          status: 'paid',
          order_number: `ORD-${Date.now()}-001`,
          completed_at: new Date().toISOString()
        },
        {
          seller_id: testSeller.user_id,
          buyer_id: testSeller.user_id,
          product_id: createdProducts[1]?.id || createdProducts[0].id,
          price: createdProducts[1]?.price || createdProducts[0].price,
          seller_earnings: (createdProducts[1]?.price || createdProducts[0].price) * 0.9,
          platform_fee: (createdProducts[1]?.price || createdProducts[0].price) * 0.1,
          status: 'paid',
          order_number: `ORD-${Date.now()}-002`,
          completed_at: new Date().toISOString()
        }
      ];

      for (const order of testOrders) {
        const { error: orderError } = await supabase
          .from('orders')
          .insert(order);

        if (orderError) {
          console.error('❌ Error creating order:', orderError.message);
        } else {
          console.log(`✅ Created order: ${order.order_number} - $${order.price}`);
        }
      }
    }

    // Update seller profile with totals
    console.log('\n📊 Updating seller totals...');
    const totalEarnings = testProducts.reduce((sum, p) => sum + (p.price * 0.9), 0);
    const totalSales = testProducts.length;

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        total_earnings: totalEarnings,
        total_sales: totalSales
      })
      .eq('user_id', testSeller.user_id);

    if (updateError) {
      console.error('❌ Error updating seller totals:', updateError.message);
    } else {
      console.log(`✅ Updated seller totals: $${totalEarnings.toFixed(2)} earnings, ${totalSales} sales`);
    }

    console.log('\n🎉 Test seller data created successfully!');
    console.log('\n📋 Summary:');
    console.log(`   - Seller: ${testSeller.email}`);
    console.log(`   - Products: ${testProducts.length}`);
    console.log(`   - Orders: 2`);
    console.log(`   - Total Earnings: $${totalEarnings.toFixed(2)}`);
    console.log('\n🌐 You can now test the seller dashboard at: http://localhost:8080/seller-dashboard');

    return true;

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    return false;
  }
}

// Run the script
createTestSellerData()
  .then(success => {
    if (success) {
      console.log('\n✅ Test data creation completed!');
      process.exit(0);
    } else {
      console.log('\n❌ Test data creation failed.');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });