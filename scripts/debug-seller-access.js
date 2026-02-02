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

async function debugSellerAccess() {
  console.log('🔍 Debugging Seller Access Issue...\n');

  try {
    // Check all users and their roles
    console.log('1. Checking all user profiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, role, is_verified_seller, verification_status, created_at')
      .order('created_at', { ascending: false });

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError.message);
      return;
    }

    console.log(`Found ${profiles?.length || 0} users:`);
    profiles?.forEach((profile, index) => {
      console.log(`  ${index + 1}. ${profile.email}`);
      console.log(`     Role: ${profile.role}`);
      console.log(`     Verified Seller: ${profile.is_verified_seller}`);
      console.log(`     Verification Status: ${profile.verification_status || 'null'}`);
      console.log(`     Created: ${new Date(profile.created_at).toLocaleDateString()}`);
      console.log('');
    });

    // Check seller verification applications
    console.log('2. Checking seller verification applications...');
    const { data: applications, error: appsError } = await supabase
      .from('seller_verification_applications')
      .select(`
        id, user_id, full_name, status, admin_notes, 
        reviewed_at, created_at,
        profiles!seller_verification_applications_user_id_fkey(email, role, is_verified_seller)
      `)
      .order('created_at', { ascending: false });

    if (appsError) {
      console.error('❌ Error fetching applications:', appsError.message);
    } else {
      console.log(`Found ${applications?.length || 0} applications:`);
      applications?.forEach((app, index) => {
        console.log(`  ${index + 1}. ${app.full_name} (${app.profiles?.email})`);
        console.log(`     Status: ${app.status}`);
        console.log(`     User Role: ${app.profiles?.role}`);
        console.log(`     Is Verified: ${app.profiles?.is_verified_seller}`);
        console.log(`     Admin Notes: ${app.admin_notes || 'None'}`);
        console.log(`     Submitted: ${new Date(app.created_at).toLocaleDateString()}`);
        console.log(`     Reviewed: ${app.reviewed_at ? new Date(app.reviewed_at).toLocaleDateString() : 'Not yet'}`);
        console.log('');
      });
    }

    // Check for admin users
    console.log('3. Checking for admin users...');
    const adminUsers = profiles?.filter(p => p.role === 'admin') || [];
    if (adminUsers.length > 0) {
      console.log(`✅ Found ${adminUsers.length} admin user(s):`);
      adminUsers.forEach(admin => {
        console.log(`   👤 ${admin.email}`);
      });
    } else {
      console.log('⚠️  No admin users found. You need to create an admin user to approve applications.');
    }

    // Provide recommendations
    console.log('\n📋 Recommendations:');
    
    const pendingApps = applications?.filter(app => app.status === 'pending') || [];
    if (pendingApps.length > 0) {
      console.log(`📝 You have ${pendingApps.length} pending seller application(s) that need admin approval.`);
    }

    const approvedApps = applications?.filter(app => app.status === 'approved') || [];
    if (approvedApps.length > 0) {
      console.log(`✅ ${approvedApps.length} application(s) have been approved.`);
      
      // Check if approved users have correct roles
      approvedApps.forEach(app => {
        if (app.profiles?.role !== 'seller' || !app.profiles?.is_verified_seller) {
          console.log(`⚠️  User ${app.profiles?.email} was approved but profile not updated correctly.`);
          console.log(`   Current role: ${app.profiles?.role}, Verified: ${app.profiles?.is_verified_seller}`);
        }
      });
    }

    if (adminUsers.length === 0) {
      console.log('\n🔧 To create an admin user, run this SQL in Supabase:');
      console.log('UPDATE profiles SET role = \'admin\' WHERE email = \'your-email@example.com\';');
    }

    if (pendingApps.length > 0 && adminUsers.length > 0) {
      console.log('\n🔧 To approve pending applications:');
      console.log('1. Log in as an admin user');
      console.log('2. Go to /admin');
      console.log('3. Navigate to the "Sellers" tab');
      console.log('4. Review and approve the pending applications');
    }

    // Check database tables exist
    console.log('\n4. Checking required tables...');
    const requiredTables = ['profiles', 'seller_verification_applications'];
    for (const table of requiredTables) {
      try {
        const { error } = await supabase.from(table).select('id').limit(1);
        if (error && !error.message.includes('RLS')) {
          console.log(`❌ Table '${table}' has issues: ${error.message}`);
        } else {
          console.log(`✅ Table '${table}' exists and accessible`);
        }
      } catch (err) {
        console.log(`❌ Table '${table}' check failed: ${err.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugSellerAccess();