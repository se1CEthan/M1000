#!/usr/bin/env node

/**
 * Comprehensive verification script for user creation fix
 * Tests database trigger, profile creation, and automatic login
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testDatabaseTrigger() {
  log('\n🔧 Testing Database Trigger...', 'blue');
  
  try {
    // Check if trigger exists
    const { data: triggers, error: triggerError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT trigger_name, event_manipulation, action_statement
        FROM information_schema.triggers 
        WHERE trigger_name = 'on_auth_user_created'
      `
    });

    if (triggerError) {
      log('❌ Could not check trigger existence', 'red');
      return false;
    }

    if (!triggers || triggers.length === 0) {
      log('❌ Database trigger not found', 'red');
      log('   Run scripts/final-user-creation-fix.sql in Supabase SQL Editor', 'yellow');
      return false;
    }

    log('✅ Database trigger exists', 'green');
    return true;
  } catch (error) {
    log(`❌ Trigger check failed: ${error.message}`, 'red');
    return false;
  }
}

async function testProfilesTable() {
  log('\n📋 Testing Profiles Table...', 'blue');
  
  try {
    // Check if profiles table exists and has required columns
    const { data: columns, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND table_schema = 'public'
        ORDER BY ordinal_position
      `
    });

    if (error) {
      log('❌ Could not check profiles table', 'red');
      return false;
    }

    const requiredColumns = ['user_id', 'email', 'role', 'is_verified_seller', 'verification_status'];
    const existingColumns = columns.map(col => col.column_name);
    
    let allColumnsExist = true;
    requiredColumns.forEach(col => {
      if (existingColumns.includes(col)) {
        log(`✅ Column '${col}' exists`, 'green');
      } else {
        log(`❌ Column '${col}' missing`, 'red');
        allColumnsExist = false;
      }
    });

    return allColumnsExist;
  } catch (error) {
    log(`❌ Profiles table check failed: ${error.message}`, 'red');
    return false;
  }
}

async function testUserSignup() {
  log('\n👤 Testing User Signup Process...', 'blue');
  
  const testEmail = `test-signup-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';

  try {
    log(`📧 Creating test user: ${testEmail}`, 'cyan');
    
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
      log(`❌ Signup failed: ${signUpError.message}`, 'red');
      return false;
    }

    if (!signUpData.user) {
      log('❌ No user data returned from signup', 'red');
      return false;
    }

    log('✅ User signup successful', 'green');

    // Wait for trigger to complete
    log('⏳ Waiting for database trigger to create profile...', 'yellow');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Check if profile was created
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', signUpData.user.id)
      .single();

    if (profileError) {
      log(`❌ Profile not found: ${profileError.message}`, 'red');
      return false;
    }

    log('✅ Profile created automatically by trigger', 'green');
    log(`   - Email: ${profile.email}`, 'cyan');
    log(`   - Role: ${profile.role}`, 'cyan');
    log(`   - Verified: ${profile.is_verified_seller}`, 'cyan');

    // Test login with new user
    log('🔐 Testing login with new user...', 'cyan');
    
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (signInError) {
      log(`❌ Login failed: ${signInError.message}`, 'red');
      return false;
    }

    log('✅ Login successful - user can login immediately after signup', 'green');

    // Clean up
    log('🧹 Cleaning up test data...', 'yellow');
    await supabase.from('profiles').delete().eq('user_id', signUpData.user.id);
    await supabase.auth.signOut();

    return true;

  } catch (error) {
    log(`❌ User signup test failed: ${error.message}`, 'red');
    return false;
  }
}

async function testRLSPolicies() {
  log('\n🔒 Testing RLS Policies...', 'blue');
  
  try {
    // Check if RLS is enabled on profiles table
    const { data: rlsStatus, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT schemaname, tablename, rowsecurity 
        FROM pg_tables 
        WHERE tablename = 'profiles' AND schemaname = 'public'
      `
    });

    if (error) {
      log('❌ Could not check RLS status', 'red');
      return false;
    }

    if (rlsStatus[0]?.rowsecurity) {
      log('✅ RLS is enabled on profiles table', 'green');
    } else {
      log('❌ RLS is not enabled on profiles table', 'red');
      return false;
    }

    // Check if policies exist
    const { data: policies, error: policyError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT policyname, cmd, qual 
        FROM pg_policies 
        WHERE tablename = 'profiles'
      `
    });

    if (policyError) {
      log('❌ Could not check RLS policies', 'red');
      return false;
    }

    log(`✅ Found ${policies.length} RLS policies`, 'green');
    return true;

  } catch (error) {
    log(`❌ RLS policy check failed: ${error.message}`, 'red');
    return false;
  }
}

async function generateReport(results) {
  log('\n📊 User Creation Fix Verification Report', 'cyan');
  log('==========================================', 'cyan');
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const percentage = Math.round((passed / total) * 100);
  
  log(`\nOverall Score: ${passed}/${total} (${percentage}%)`, percentage >= 80 ? 'green' : 'red');
  
  results.forEach(result => {
    const status = result.passed ? '✅' : '❌';
    const color = result.passed ? 'green' : 'red';
    log(`${status} ${result.name}`, color);
  });

  if (percentage === 100) {
    log('\n🎉 Perfect! User creation is working correctly.', 'green');
    log('Users can now:', 'green');
    log('  ✅ Sign up with email/password', 'green');
    log('  ✅ Get profiles created automatically', 'green');
    log('  ✅ Login immediately after signup', 'green');
    log('  ✅ Access role-based features', 'green');
  } else if (percentage >= 75) {
    log('\n⚠️ Most tests passed, but some issues remain.', 'yellow');
    log('Run scripts/final-user-creation-fix.sql in Supabase SQL Editor', 'yellow');
  } else {
    log('\n❌ Critical issues found. User creation may not work properly.', 'red');
    log('REQUIRED: Run scripts/final-user-creation-fix.sql in Supabase SQL Editor', 'red');
  }

  return percentage >= 80;
}

async function main() {
  log('🔍 Seltech User Creation Verification', 'cyan');
  log('=====================================', 'cyan');
  
  const results = [
    { name: 'Database Trigger', passed: await testDatabaseTrigger() },
    { name: 'Profiles Table', passed: await testProfilesTable() },
    { name: 'RLS Policies', passed: await testRLSPolicies() },
    { name: 'User Signup & Login', passed: await testUserSignup() }
  ];
  
  const isWorking = await generateReport(results);
  
  if (isWorking) {
    log('\n🚀 Ready for production! User creation is working perfectly.', 'green');
  } else {
    log('\n🔧 Apply the fix and run this test again.', 'yellow');
  }

  process.exit(isWorking ? 0 : 1);
}

main().catch(console.error);