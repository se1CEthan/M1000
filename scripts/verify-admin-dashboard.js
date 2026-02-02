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

async function verifyAdminDashboard() {
  console.log('🔍 Verifying Admin Dashboard Setup...\n');

  const checks = [];

  try {
    // Check 1: Required tables exist
    console.log('1. Checking required tables...');
    const requiredTables = [
      'profiles',
      'seller_verification_applications', 
      'admin_activity_log',
      'platform_settings',
      'products',
      'orders'
    ];

    for (const table of requiredTables) {
      try {
        const { data, error } = await supabase.from(table).select('id').limit(1);
        if (error && !error.message.includes('RLS')) {
          checks.push(`❌ Table '${table}' not accessible: ${error.message}`);
        } else {
          checks.push(`✅ Table '${table}' exists and accessible`);
        }
      } catch (err) {
        checks.push(`❌ Table '${table}' check failed: ${err.message}`);
      }
    }

    // Check 2: Required functions exist
    console.log('\n2. Checking required functions...');
    const requiredFunctions = [
      'log_admin_activity',
      'get_platform_stats',
      'create_admin_notification'
    ];

    for (const func of requiredFunctions) {
      try {
        // Try to call the function (this will fail if it doesn't exist)
        const { error } = await supabase.rpc(func, {});
        if (error && error.message.includes('function') && error.message.includes('does not exist')) {
          checks.push(`❌ Function '${func}' does not exist`);
        } else {
          checks.push(`✅ Function '${func}' exists`);
        }
      } catch (err) {
        checks.push(`⚠️  Function '${func}' check inconclusive`);
      }
    }

    // Check 3: Platform settings
    console.log('\n3. Checking platform settings...');
    try {
      const { data: settings, error } = await supabase
        .from('platform_settings')
        .select('key, value')
        .limit(5);

      if (error) {
        checks.push(`❌ Platform settings not accessible: ${error.message}`);
      } else {
        checks.push(`✅ Platform settings accessible (${settings?.length || 0} settings found)`);
      }
    } catch (err) {
      checks.push(`❌ Platform settings check failed: ${err.message}`);
    }

    // Check 4: Admin users exist
    console.log('\n4. Checking for admin users...');
    try {
      const { data: admins, error } = await supabase
        .from('profiles')
        .select('id, email, role')
        .eq('role', 'admin');

      if (error) {
        checks.push(`⚠️  Admin users check: ${error.message}`);
      } else {
        if (admins && admins.length > 0) {
          checks.push(`✅ Found ${admins.length} admin user(s)`);
          admins.forEach(admin => {
            checks.push(`   👤 Admin: ${admin.email}`);
          });
        } else {
          checks.push(`⚠️  No admin users found - you'll need to create one`);
        }
      }
    } catch (err) {
      checks.push(`❌ Admin users check failed: ${err.message}`);
    }

    // Check 5: Sample data
    console.log('\n5. Checking for sample data...');
    try {
      const [profilesResult, productsResult, applicationsResult] = await Promise.all([
        supabase.from('profiles').select('id').limit(1),
        supabase.from('products').select('id').limit(1),
        supabase.from('seller_verification_applications').select('id').limit(1)
      ]);

      const profileCount = profilesResult.data?.length || 0;
      const productCount = productsResult.data?.length || 0;
      const applicationCount = applicationsResult.data?.length || 0;

      checks.push(`📊 Data summary: ${profileCount} profiles, ${productCount} products, ${applicationCount} applications`);
    } catch (err) {
      checks.push(`⚠️  Sample data check inconclusive: ${err.message}`);
    }

    // Display results
    console.log('\n📋 Verification Results:');
    console.log('========================');
    checks.forEach(check => console.log(check));

    // Summary
    const successCount = checks.filter(check => check.startsWith('✅')).length;
    const errorCount = checks.filter(check => check.startsWith('❌')).length;
    const warningCount = checks.filter(check => check.startsWith('⚠️')).length;

    console.log('\n📊 Summary:');
    console.log(`✅ Successful checks: ${successCount}`);
    console.log(`⚠️  Warnings: ${warningCount}`);
    console.log(`❌ Errors: ${errorCount}`);

    if (errorCount === 0) {
      console.log('\n🎉 Admin Dashboard verification completed successfully!');
      console.log('\n📋 Next Steps:');
      console.log('1. Create an admin user if none exist');
      console.log('2. Access the admin dashboard at /admin');
      console.log('3. Configure platform settings');
      console.log('4. Test all admin functions');
    } else {
      console.log('\n⚠️  Some issues were found. Please review and fix before proceeding.');
      console.log('\n🔧 Recommended Actions:');
      console.log('1. Run the setup-production-admin.sql script');
      console.log('2. Ensure all required tables are created');
      console.log('3. Check RLS policies are properly configured');
    }

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

verifyAdminDashboard();