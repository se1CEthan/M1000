#!/usr/bin/env node

// Fix Upload Permissions Script
// This script helps diagnose and fix product upload permission issues

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const SUPABASE_URL = 'https://rtsaarapvlzzinmpjdys.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'your-service-key-here';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkUserPermissions(userId) {
  console.log(`🔍 Checking permissions for user: ${userId}`);
  
  try {
    // Check user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (profileError) {
      console.error('❌ Profile error:', profileError);
      return false;
    }

    console.log('✅ User profile found:');
    console.log(`   - Name: ${profile.full_name || 'Not set'}`);
    console.log(`   - Role: ${profile.role}`);
    console.log(`   - Verified Seller: ${profile.is_verified_seller}`);
    console.log(`   - Email: ${profile.email}`);

    // Check if user can insert products
    const testProduct = {
      title: 'Test Product',
      description: 'Test description',
      price: 10.00,
      category: 'bots',
      status: 'pending'
    };

    console.log('\n🧪 Testing product insert permissions...');
    
    const { data: insertTest, error: insertError } = await supabase
      .from('products')
      .insert(testProduct)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Insert test failed:', insertError.message);
      
      if (insertError.message.includes('row-level security')) {
        console.log('\n🔧 RLS Policy Issue Detected!');
        console.log('Recommended fixes:');
        console.log('1. Run: database/fix-rls-policies.sql in Supabase SQL Editor');
        console.log('2. Ensure user role is "seller" or "admin"');
        console.log('3. Ensure is_verified_seller is true');
        
        return false;
      }
    } else {
      console.log('✅ Insert test successful');
      
      // Clean up test product
      await supabase
        .from('products')
        .delete()
        .eq('id', insertTest.id);
      
      console.log('✅ Test product cleaned up');
      return true;
    }

  } catch (error) {
    console.error('❌ Permission check failed:', error);
    return false;
  }
}

async function fixUserRole(userId) {
  console.log(`🔧 Fixing user role for: ${userId}`);
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        role: 'seller',
        is_verified_seller: true,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('❌ Failed to update user role:', error);
      return false;
    }

    console.log('✅ User role updated successfully');
    console.log(`   - Role: ${data.role}`);
    console.log(`   - Verified Seller: ${data.is_verified_seller}`);
    
    return true;
  } catch (error) {
    console.error('❌ Role update failed:', error);
    return false;
  }
}

async function checkRLSPolicies() {
  console.log('🔍 Checking RLS policies...');
  
  try {
    const { data: policies, error } = await supabase
      .rpc('get_policies', { table_name: 'products' });

    if (error) {
      console.log('⚠️ Could not fetch policies (this is normal)');
    } else {
      console.log('✅ RLS policies found:', policies?.length || 0);
    }

    // Test basic table access
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, title, status')
      .limit(1);

    if (productsError) {
      console.error('❌ Products table access failed:', productsError);
      return false;
    }

    console.log('✅ Products table accessible');
    return true;
  } catch (error) {
    console.error('❌ RLS check failed:', error);
    return false;
  }
}

async function runDiagnostics() {
  console.log('🚀 Starting upload permissions diagnostics...\n');

  // Check RLS policies
  const rlsOk = await checkRLSPolicies();
  console.log('');

  // Get user ID from command line or prompt
  const userId = process.argv[2];
  
  if (!userId) {
    console.log('❌ Please provide a user ID:');
    console.log('   node scripts/fix-upload-permissions.js <user-id>');
    console.log('');
    console.log('💡 To get user ID:');
    console.log('   1. Login to your app');
    console.log('   2. Check browser console for auth.user.id');
    console.log('   3. Or check Supabase Auth dashboard');
    process.exit(1);
  }

  // Check user permissions
  const permissionsOk = await checkUserPermissions(userId);
  console.log('');

  if (!permissionsOk) {
    console.log('🔧 Attempting to fix user permissions...');
    const fixed = await fixUserRole(userId);
    
    if (fixed) {
      console.log('✅ User permissions fixed! Try uploading again.');
    } else {
      console.log('❌ Could not fix user permissions automatically.');
      console.log('');
      console.log('Manual steps:');
      console.log('1. Run database/fix-rls-policies.sql in Supabase SQL Editor');
      console.log('2. Update user profile in Supabase dashboard:');
      console.log('   - Set role to "seller"');
      console.log('   - Set is_verified_seller to true');
    }
  } else {
    console.log('✅ All permissions look good!');
  }

  console.log('\n📋 Summary:');
  console.log(`   RLS Policies: ${rlsOk ? '✅ OK' : '❌ Issues'}`);
  console.log(`   User Permissions: ${permissionsOk ? '✅ OK' : '❌ Issues'}`);
  
  if (rlsOk && permissionsOk) {
    console.log('\n🎉 Upload should work now!');
  } else {
    console.log('\n⚠️ Please run the recommended fixes above.');
  }
}

// Run diagnostics
if (require.main === module) {
  runDiagnostics().catch(error => {
    console.error('❌ Diagnostics failed:', error);
    process.exit(1);
  });
}

module.exports = {
  checkUserPermissions,
  fixUserRole,
  checkRLSPolicies
};