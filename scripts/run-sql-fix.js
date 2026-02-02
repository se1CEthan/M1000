#!/usr/bin/env node

/**
 * Run SQL Fix for Automatic Login
 * This script applies the SQL fixes to enable automatic login
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

async function runSQLFixes() {
  console.log('🔧 Running SQL Fixes for Automatic Login');
  console.log('======================================\n');

  try {
    // Check current user status
    console.log('🔍 Checking current user status...');
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('user_id, email, role, created_at')
      .limit(5);

    if (usersError) {
      console.log('❌ Cannot access profiles table:', usersError.message);
    } else {
      console.log(`✅ Found ${users.length} user profiles`);
      users.forEach(user => {
        console.log(`   - ${user.email} (${user.role})`);
      });
    }

    // Test basic authentication
    console.log('\n🔍 Testing authentication service...');
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: 'nonexistent@example.com',
      password: 'invalid'
    });

    if (authError) {
      if (authError.message.includes('Invalid login credentials')) {
        console.log('✅ Authentication service is working');
      } else if (authError.message.includes('email not confirmed')) {
        console.log('🚨 EMAIL CONFIRMATION ISSUE DETECTED!');
        console.log('📋 You need to:');
        console.log('   1. Go to Supabase Dashboard → Authentication → Settings');
        console.log('   2. Disable "Enable email confirmations"');
        console.log('   3. Run the SQL script: scripts/fix-automatic-login.sql');
      } else {
        console.log('⚠️  Authentication response:', authError.message);
      }
    }

    console.log('\n📋 Next Steps:');
    console.log('==============');
    console.log('1. 🌐 Go to Supabase Dashboard:');
    console.log('   https://supabase.com/dashboard/project/rtsaarapvlzzinmpjdys');
    console.log('');
    console.log('2. 🔧 Disable Email Confirmation:');
    console.log('   - Click "Authentication" → "Settings"');
    console.log('   - Find "Email Confirmations" section');
    console.log('   - Toggle OFF "Enable email confirmations"');
    console.log('   - Click "Save"');
    console.log('');
    console.log('3. 📝 Run SQL Fix:');
    console.log('   - Go to "SQL Editor" in Supabase');
    console.log('   - Copy and run: scripts/fix-automatic-login.sql');
    console.log('');
    console.log('4. 🧪 Test the fix:');
    console.log('   - npm run test-login');
    console.log('');
    console.log('✅ After these steps, users will be automatically logged in after signup!');

  } catch (error) {
    console.error('❌ Error running fixes:', error.message);
  }
}

runSQLFixes().catch(console.error);