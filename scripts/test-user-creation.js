#!/usr/bin/env node

/**
 * Test script to verify user creation works properly
 * Run this after applying the database fixes
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUserCreation() {
  console.log('🧪 Testing user creation process...\n');

  // Generate test email
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';

  try {
    console.log(`📧 Creating test user: ${testEmail}`);
    
    // Test user signup
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          role: 'buyer'
        }
      }
    });

    if (signUpError) {
      console.error('❌ Signup failed:', signUpError.message);
      return false;
    }

    console.log('✅ User signup successful');

    if (!signUpData.user) {
      console.error('❌ No user data returned');
      return false;
    }

    // Wait a moment for trigger to complete
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check if profile was created
    console.log('🔍 Checking if profile was created...');
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', signUpData.user.id)
      .single();

    if (profileError) {
      console.error('❌ Profile fetch failed:', profileError.message);
      return false;
    }

    if (!profile) {
      console.error('❌ No profile found for user');
      return false;
    }

    console.log('✅ Profile created successfully');
    console.log('📋 Profile details:');
    console.log(`   - ID: ${profile.id}`);
    console.log(`   - Email: ${profile.email}`);
    console.log(`   - Role: ${profile.role}`);
    console.log(`   - Verified Seller: ${profile.is_verified_seller}`);
    console.log(`   - Verification Status: ${profile.verification_status}`);

    // Clean up test user
    console.log('🧹 Cleaning up test data...');
    
    // Delete profile first (due to foreign key constraints)
    await supabase
      .from('profiles')
      .delete()
      .eq('user_id', signUpData.user.id);

    console.log('✅ Test completed successfully!\n');
    return true;

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    return false;
  }
}

async function testDatabaseConnection() {
  console.log('🔗 Testing database connection...');
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Database connection failed:', error.message);
      return false;
    }

    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Seltech User Creation Test\n');
  console.log('============================\n');

  // Test database connection first
  const dbConnected = await testDatabaseConnection();
  if (!dbConnected) {
    console.log('\n❌ Database connection failed. Please check your Supabase configuration.');
    process.exit(1);
  }

  // Test user creation
  const userCreationWorks = await testUserCreation();
  
  if (userCreationWorks) {
    console.log('🎉 All tests passed! User creation is working properly.');
    console.log('\n📋 Next steps:');
    console.log('1. Test signup in your application');
    console.log('2. Verify seller verification process');
    console.log('3. Test admin dashboard access');
  } else {
    console.log('❌ User creation test failed. Please run the database fix script:');
    console.log('   - Go to Supabase SQL Editor');
    console.log('   - Run scripts/complete-user-fix.sql');
    console.log('   - Then run this test again');
  }

  process.exit(userCreationWorks ? 0 : 1);
}

main().catch(console.error);