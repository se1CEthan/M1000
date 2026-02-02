// Test script to verify production fixes are working
// Run this after applying the database fix

import { createClient } from '@supabase/supabase-js';

// Replace with your Supabase credentials
const supabaseUrl = 'https://rtsaarapvlzzinmpjdys.supabase.co';
const supabaseKey = 'your-anon-key'; // Replace with your actual anon key

const supabase = createClient(supabaseUrl, supabaseKey);

async function testProductionFixes() {
  console.log('🧪 Testing Production Fixes...\n');

  // Test 1: Check storage buckets exist
  console.log('1. Testing Storage Buckets...');
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.log('❌ Error listing buckets:', error.message);
    } else {
      const requiredBuckets = ['product-files', 'product-images', 'avatars'];
      const existingBuckets = buckets.map(b => b.name);
      
      requiredBuckets.forEach(bucket => {
        if (existingBuckets.includes(bucket)) {
          console.log(`✅ Bucket '${bucket}' exists`);
        } else {
          console.log(`❌ Bucket '${bucket}' missing`);
        }
      });
    }
  } catch (error) {
    console.log('❌ Storage test failed:', error.message);
  }

  // Test 2: Check platform_settings table
  console.log('\n2. Testing Platform Settings...');
  try {
    const { data: settings, error } = await supabase
      .from('platform_settings')
      .select('key, value')
      .limit(5);

    if (error) {
      console.log('❌ Error reading platform_settings:', error.message);
    } else {
      console.log(`✅ Platform settings accessible (${settings.length} settings found)`);
      settings.forEach(setting => {
        console.log(`   - ${setting.key}: ${setting.value}`);
      });
    }
  } catch (error) {
    console.log('❌ Platform settings test failed:', error.message);
  }

  // Test 3: Check admin user exists
  console.log('\n3. Testing Admin User...');
  try {
    const { data: admin, error } = await supabase
      .from('profiles')
      .select('email, role')
      .eq('email', 'se1cethan@gmail.com')
      .single();

    if (error) {
      console.log('❌ Error finding admin user:', error.message);
    } else {
      if (admin.role === 'admin') {
        console.log(`✅ Admin user found: ${admin.email} (role: ${admin.role})`);
      } else {
        console.log(`⚠️ User found but role is '${admin.role}', should be 'admin'`);
      }
    }
  } catch (error) {
    console.log('❌ Admin user test failed:', error.message);
  }

  // Test 4: Check products table has download_count
  console.log('\n4. Testing Products Table...');
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('id, title, download_count')
      .limit(3);

    if (error) {
      console.log('❌ Error reading products:', error.message);
    } else {
      console.log(`✅ Products table accessible (${products.length} products found)`);
      if (products.length > 0 && products[0].hasOwnProperty('download_count')) {
        console.log('✅ download_count column exists');
      } else {
        console.log('⚠️ download_count column may be missing');
      }
    }
  } catch (error) {
    console.log('❌ Products table test failed:', error.message);
  }

  // Test 5: Test file upload to storage (if authenticated)
  console.log('\n5. Testing File Upload Capability...');
  try {
    // Create a small test file
    const testFile = new Blob(['test content'], { type: 'text/plain' });
    const fileName = `test-${Date.now()}.txt`;
    
    const { data, error } = await supabase.storage
      .from('product-files')
      .upload(`test/${fileName}`, testFile);

    if (error) {
      if (error.message.includes('not authenticated')) {
        console.log('⚠️ File upload test skipped (not authenticated)');
      } else {
        console.log('❌ File upload error:', error.message);
      }
    } else {
      console.log('✅ File upload successful');
      
      // Clean up test file
      await supabase.storage
        .from('product-files')
        .remove([data.path]);
      console.log('✅ Test file cleaned up');
    }
  } catch (error) {
    console.log('❌ File upload test failed:', error.message);
  }

  console.log('\n🎯 Test Summary:');
  console.log('If you see mostly ✅ marks above, the fixes are working!');
  console.log('If you see ❌ marks, run the database fix again.');
  console.log('\nNext steps:');
  console.log('1. Go to Admin Dashboard → Settings');
  console.log('2. Try saving any setting');
  console.log('3. Try downloading a product file');
  console.log('4. Both should work without errors!');
}

// Run the tests
testProductionFixes().catch(console.error);

export { testProductionFixes };