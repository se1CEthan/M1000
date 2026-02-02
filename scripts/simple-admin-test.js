import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testBasicAccess() {
  console.log('🧪 Testing basic database access...\n');

  try {
    // Test profiles table access
    console.log('1. Testing profiles table...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, role, verification_status')
      .limit(1);

    if (profilesError) {
      console.log('⚠️  Profiles access:', profilesError.message);
    } else {
      console.log('✅ Profiles table accessible, found', profiles?.length || 0, 'records');
    }

    // Test seller_verification_applications table
    console.log('\n2. Testing seller_verification_applications table...');
    const { data: applications, error: appsError } = await supabase
      .from('seller_verification_applications')
      .select('id, status')
      .limit(1);

    if (appsError) {
      console.log('⚠️  Applications access:', appsError.message);
    } else {
      console.log('✅ Applications table accessible, found', applications?.length || 0, 'records');
    }

    // Test admin_activity_log table
    console.log('\n3. Testing admin_activity_log table...');
    const { data: logs, error: logsError } = await supabase
      .from('admin_activity_log')
      .select('id, action_type')
      .limit(1);

    if (logsError) {
      console.log('⚠️  Activity log access:', logsError.message);
    } else {
      console.log('✅ Activity log table accessible, found', logs?.length || 0, 'records');
    }

    console.log('\n🎉 Basic connectivity test complete!');
    console.log('\n📋 Next Steps:');
    console.log('1. Apply the fix-admin-review-system.sql script in Supabase SQL Editor');
    console.log('2. Create an admin user');
    console.log('3. Test the admin review functionality');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testBasicAccess();