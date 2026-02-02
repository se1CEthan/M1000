#!/usr/bin/env node

/**
 * Debug Seller Verification Applications
 * Investigates why applications aren't showing in admin dashboard
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function debugSellerVerificationApplications() {
  console.log('🔍 Debugging Seller Verification Applications...\n');

  try {
    // Check 1: Does the table exist?
    console.log('1️⃣ Checking if table exists...');
    const { data: tables, error: tableError } = await supabase
      .from('seller_verification_applications')
      .select('count(*)')
      .limit(1);

    if (tableError) {
      console.error('❌ Table does not exist or is not accessible:', tableError.message);
      console.log('\n🔧 To fix this, run:');
      console.log('psql $DATABASE_URL -f database/fix-seller-verification-schema.sql');
      return;
    }
    console.log('✅ Table exists and is accessible');

    // Check 2: How many applications are in the database?
    console.log('\n2️⃣ Checking total applications in database...');
    const { data: allApps, error: countError } = await supabase
      .from('seller_verification_applications')
      .select('*');

    if (countError) {
      console.error('❌ Error fetching applications:', countError.message);
      return;
    }

    console.log(`📊 Total applications in database: ${allApps.length}`);

    if (allApps.length === 0) {
      console.log('⚠️  No applications found in database');
      console.log('\n🔧 Possible causes:');
      console.log('   - User submission failed');
      console.log('   - Applications were inserted into wrong table');
      console.log('   - Database was reset/cleared');
      console.log('\n💡 Try submitting a test application or run the setup script');
      return;
    }

    // Check 3: Show all applications with details
    console.log('\n3️⃣ Application details:');
    allApps.forEach((app, index) => {
      console.log(`\n📋 Application ${index + 1}:`);
      console.log(`   - ID: ${app.id}`);
      console.log(`   - User ID: ${app.user_id}`);
      console.log(`   - Name: ${app.full_name}`);
      console.log(`   - Status: ${app.status}`);
      console.log(`   - Business Type: ${app.business_type}`);
      console.log(`   - Created: ${app.created_at}`);
      console.log(`   - Categories: ${app.product_categories?.join(', ') || 'None'}`);
      console.log(`   - Terms Accepted: ${app.terms_accepted}`);
      console.log(`   - Commission Accepted: ${app.commission_rate_accepted}`);
    });

    // Check 4: Status breakdown
    console.log('\n4️⃣ Status breakdown:');
    const statusCounts = {};
    allApps.forEach(app => {
      statusCounts[app.status] = (statusCounts[app.status] || 0) + 1;
    });

    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   - ${status.toUpperCase()}: ${count}`);
    });

    // Check 5: Specifically check for pending applications
    console.log('\n5️⃣ Checking pending applications specifically...');
    const { data: pendingApps, error: pendingError } = await supabase
      .from('seller_verification_applications')
      .select('*')
      .eq('status', 'pending');

    if (pendingError) {
      console.error('❌ Error fetching pending applications:', pendingError.message);
      return;
    }

    console.log(`📊 Pending applications: ${pendingApps.length}`);

    if (pendingApps.length === 0) {
      console.log('⚠️  No pending applications found');
      console.log('\n🔧 Possible causes:');
      console.log('   - All applications have been reviewed');
      console.log('   - Applications have different status values');
      console.log('   - Status field has unexpected values');
    } else {
      console.log('\n📋 Pending applications:');
      pendingApps.forEach((app, index) => {
        console.log(`   ${index + 1}. ${app.full_name} (${app.created_at})`);
      });
    }

    // Check 6: Test the exact query used by admin dashboard
    console.log('\n6️⃣ Testing admin dashboard query...');
    const { data: adminQuery, error: adminError } = await supabase
      .from('seller_verification_applications')
      .select('*')
      .order('created_at', { ascending: false });

    if (adminError) {
      console.error('❌ Admin dashboard query failed:', adminError.message);
      return;
    }

    console.log(`✅ Admin dashboard query returned ${adminQuery.length} applications`);

    // Check 7: Check for RLS issues
    console.log('\n7️⃣ Checking for RLS (Row Level Security) issues...');
    
    // Try with different auth contexts
    const { data: anonQuery, error: anonError } = await supabase
      .from('seller_verification_applications')
      .select('count(*)')
      .limit(1);

    if (anonError) {
      console.error('❌ Anonymous query failed (RLS might be blocking):', anonError.message);
      console.log('\n🔧 To fix RLS issues, run:');
      console.log('psql $DATABASE_URL -c "ALTER TABLE seller_verification_applications DISABLE ROW LEVEL SECURITY;"');
    } else {
      console.log('✅ Anonymous queries work (RLS is not blocking)');
    }

    // Check 8: Verify table structure
    console.log('\n8️⃣ Checking table structure...');
    if (allApps.length > 0) {
      const sampleApp = allApps[0];
      const fields = Object.keys(sampleApp);
      console.log('📋 Table columns found:');
      fields.forEach(field => {
        console.log(`   - ${field}: ${typeof sampleApp[field]}`);
      });

      // Check for missing required fields
      const requiredFields = ['id', 'user_id', 'full_name', 'status', 'created_at'];
      const missingFields = requiredFields.filter(field => !fields.includes(field));
      
      if (missingFields.length > 0) {
        console.error(`❌ Missing required fields: ${missingFields.join(', ')}`);
      } else {
        console.log('✅ All required fields present');
      }
    }

    // Check 9: Recent submissions
    console.log('\n9️⃣ Checking recent submissions (last 24 hours)...');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const { data: recentApps, error: recentError } = await supabase
      .from('seller_verification_applications')
      .select('*')
      .gte('created_at', yesterday.toISOString());

    if (recentError) {
      console.error('❌ Error checking recent submissions:', recentError.message);
    } else {
      console.log(`📊 Applications submitted in last 24 hours: ${recentApps.length}`);
      if (recentApps.length > 0) {
        recentApps.forEach(app => {
          console.log(`   - ${app.full_name} at ${app.created_at}`);
        });
      }
    }

    // Summary and recommendations
    console.log('\n📋 SUMMARY:');
    console.log(`   - Total applications: ${allApps.length}`);
    console.log(`   - Pending applications: ${pendingApps.length}`);
    console.log(`   - Recent submissions: ${recentApps?.length || 0}`);
    
    if (allApps.length === 0) {
      console.log('\n🚨 ISSUE: No applications in database');
      console.log('🔧 SOLUTION: Check if user submission is working or run setup script');
    } else if (pendingApps.length === 0) {
      console.log('\n🚨 ISSUE: No pending applications (all have been processed or have different status)');
      console.log('🔧 SOLUTION: Check application statuses or create test pending application');
    } else {
      console.log('\n✅ Applications exist and should be visible in admin dashboard');
      console.log('🔧 If not visible, check admin dashboard component or user permissions');
    }

  } catch (error) {
    console.error('💥 Debug script failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the debug
debugSellerVerificationApplications();