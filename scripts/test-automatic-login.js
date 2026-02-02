#!/usr/bin/env node

/**
 * Test Automatic Login After Signup
 * This script tests the complete signup and login flow
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testAutomaticLogin() {
  console.log('🧪 Testing Automatic Login After Signup');
  console.log('=====================================\n');

  // Generate test user
  const timestamp = Date.now();
  const testEmail = `testuser${timestamp}@example.com`;
  const testPassword = 'TestPassword123!';

  console.log(`📧 Test Email: ${testEmail}`);
  console.log(`🔐 Test Password: ${testPassword}\n`);

  try {
    // Test 1: Sign up new user
    console.log('🔄 Step 1: Testing user signup...');
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          role: 'buyer'
        }
      }
    });

    if (signupError) {
      console.log('❌ Signup failed:', signupError.message);
      return;
    }

    console.log('✅ Signup successful');
    console.log('👤 User ID:', signupData.user?.id);
    console.log('📧 Email confirmed:', signupData.user?.email_confirmed_at ? 'Yes' : 'No');
    console.log('🔑 Session created:', signupData.session ? 'Yes' : 'No');

    // Check if user is automatically logged in
    if (signupData.session) {
      console.log('🎉 User is automatically logged in after signup!');
    } else {
      console.log('⚠️  User is not automatically logged in. Email confirmation may be required.');
    }

    // Test 2: Check if profile was created
    console.log('\n🔄 Step 2: Checking profile creation...');
    
    // Wait a bit for database trigger
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', signupData.user.id)
      .single();

    if (profileError) {
      console.log('❌ Profile not found:', profileError.message);
    } else {
      console.log('✅ Profile created successfully');
      console.log('👤 Full Name:', profile.full_name || 'Not set');
      console.log('🎭 Role:', profile.role);
      console.log('✅ Verified Seller:', profile.is_verified_seller);
    }

    // Test 3: Test login with the new account
    console.log('\n🔄 Step 3: Testing login with new account...');
    
    // Sign out first
    await supabase.auth.signOut();
    
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (loginError) {
      console.log('❌ Login failed:', loginError.message);
      
      if (loginError.message.includes('email not confirmed')) {
        console.log('🚨 EMAIL CONFIRMATION ISSUE DETECTED!');
        console.log('📋 To fix this:');
        console.log('   1. Go to Supabase Dashboard → Authentication → Settings');
        console.log('   2. Disable "Enable email confirmations"');
        console.log('   3. Run: npm run fix-email-confirmation');
      }
    } else {
      console.log('✅ Login successful');
      console.log('🔑 Session created:', loginData.session ? 'Yes' : 'No');
    }

    // Test 4: Check authentication settings
    console.log('\n🔄 Step 4: Checking authentication configuration...');
    
    // Try to get current session
    const { data: sessionData } = await supabase.auth.getSession();
    console.log('📱 Current session:', sessionData.session ? 'Active' : 'None');

    // Clean up: Delete test user (optional)
    console.log('\n🧹 Cleaning up test user...');
    if (signupData.user?.id) {
      // Note: This requires admin privileges, so it might fail
      const { error: deleteError } = await supabase.auth.admin.deleteUser(signupData.user.id);
      if (deleteError) {
        console.log('⚠️  Could not delete test user (admin privileges required)');
        console.log('📧 Test user email:', testEmail);
        console.log('🗑️  You can manually delete this user from Supabase dashboard');
      } else {
        console.log('✅ Test user deleted successfully');
      }
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }

  console.log('\n=====================================');
  console.log('🏁 Test completed');
}

// Test authentication configuration
async function checkAuthConfig() {
  console.log('\n🔍 Checking Authentication Configuration');
  console.log('======================================\n');

  try {
    // Check if we can access auth settings (this might not work with anon key)
    const { data, error } = await supabase
      .from('auth.config')
      .select('*')
      .limit(1);

    if (error) {
      console.log('⚠️  Cannot access auth config (expected with anon key)');
    } else {
      console.log('✅ Auth config accessible');
      console.log(data);
    }

    // Test basic connection
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (testError) {
      console.log('❌ Database connection failed:', testError.message);
    } else {
      console.log('✅ Database connection working');
    }

  } catch (error) {
    console.log('❌ Config check failed:', error.message);
  }
}

// Run tests
async function runAllTests() {
  await checkAuthConfig();
  await testAutomaticLogin();
  
  console.log('\n📋 Summary:');
  console.log('===========');
  console.log('If you see "email not confirmed" errors:');
  console.log('1. Disable email confirmation in Supabase Dashboard');
  console.log('2. Run: npm run fix-email-confirmation');
  console.log('3. Test signup again');
  console.log('\nFor automatic login to work:');
  console.log('- Email confirmation must be disabled');
  console.log('- Profile creation trigger must exist');
  console.log('- Session persistence must be enabled');
}

runAllTests().catch(console.error);