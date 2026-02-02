// Create Storage Buckets for Seltech Marketplace
// Run this script to automatically create required storage buckets

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createStorageBuckets() {
  console.log('🚀 Creating storage buckets for Seltech marketplace...\n');

  const buckets = [
    {
      id: 'product-files',
      name: 'product-files',
      public: false,
      fileSizeLimit: 524288000, // 500MB
      allowedMimeTypes: null // Allow all file types
    },
    {
      id: 'product-images',
      name: 'product-images', 
      public: true,
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
    },
    {
      id: 'avatars',
      name: 'avatars',
      public: true,
      fileSizeLimit: 2097152, // 2MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    }
  ];

  for (const bucket of buckets) {
    console.log(`📦 Creating bucket: ${bucket.name}`);
    
    try {
      const { data, error } = await supabase.storage.createBucket(bucket.id, {
        public: bucket.public,
        fileSizeLimit: bucket.fileSizeLimit,
        allowedMimeTypes: bucket.allowedMimeTypes
      });

      if (error) {
        if (error.message.includes('already exists')) {
          console.log(`   ✅ Bucket ${bucket.name} already exists`);
        } else {
          console.log(`   ❌ Error creating ${bucket.name}: ${error.message}`);
        }
      } else {
        console.log(`   ✅ Successfully created ${bucket.name}`);
      }
    } catch (err) {
      console.log(`   ❌ Exception creating ${bucket.name}: ${err.message}`);
    }
  }

  console.log('\n📋 Verifying buckets...');
  
  try {
    const { data: existingBuckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.log('❌ Error listing buckets:', error.message);
      return;
    }

    console.log('\n📦 Current buckets:');
    existingBuckets.forEach(bucket => {
      const isRequired = buckets.some(b => b.id === bucket.name);
      const status = isRequired ? '✅' : '📁';
      console.log(`   ${status} ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
    });

    // Check if all required buckets exist
    const requiredBucketNames = buckets.map(b => b.id);
    const existingBucketNames = existingBuckets.map(b => b.name);
    const missingBuckets = requiredBucketNames.filter(name => !existingBucketNames.includes(name));

    if (missingBuckets.length === 0) {
      console.log('\n🎉 All required storage buckets are ready!');
      console.log('\n📝 Next steps:');
      console.log('1. Test admin dashboard downloads');
      console.log('2. Test product file uploads');
      console.log('3. Verify image uploads work');
    } else {
      console.log(`\n⚠️  Missing buckets: ${missingBuckets.join(', ')}`);
      console.log('Please create them manually in Supabase Dashboard > Storage');
    }

  } catch (err) {
    console.log('❌ Error verifying buckets:', err.message);
  }
}

async function createStoragePolicies() {
  console.log('\n🔐 Creating storage policies...');

  const policies = [
    {
      name: 'product_files_authenticated_upload',
      bucket: 'product-files',
      sql: `
        CREATE POLICY "Authenticated users can upload product files" ON storage.objects
        FOR INSERT WITH CHECK (
          bucket_id = 'product-files' AND 
          auth.role() = 'authenticated'
        );
      `
    },
    {
      name: 'product_files_owner_admin_view',
      bucket: 'product-files', 
      sql: `
        CREATE POLICY "Owners and admins can view product files" ON storage.objects
        FOR SELECT USING (
          bucket_id = 'product-files' AND 
          (auth.uid()::text = (storage.foldername(name))[1] OR 
           EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'))
        );
      `
    },
    {
      name: 'product_images_public_view',
      bucket: 'product-images',
      sql: `
        CREATE POLICY "Anyone can view product images" ON storage.objects
        FOR SELECT USING (bucket_id = 'product-images');
      `
    },
    {
      name: 'product_images_authenticated_upload',
      bucket: 'product-images',
      sql: `
        CREATE POLICY "Authenticated users can upload product images" ON storage.objects
        FOR INSERT WITH CHECK (
          bucket_id = 'product-images' AND 
          auth.role() = 'authenticated'
        );
      `
    },
    {
      name: 'avatars_public_view',
      bucket: 'avatars',
      sql: `
        CREATE POLICY "Anyone can view avatars" ON storage.objects
        FOR SELECT USING (bucket_id = 'avatars');
      `
    },
    {
      name: 'avatars_authenticated_upload',
      bucket: 'avatars',
      sql: `
        CREATE POLICY "Users can upload their own avatars" ON storage.objects
        FOR INSERT WITH CHECK (
          bucket_id = 'avatars' AND 
          auth.role() = 'authenticated'
        );
      `
    }
  ];

  for (const policy of policies) {
    try {
      const { error } = await supabase.rpc('exec_sql', { 
        sql: policy.sql 
      });

      if (error) {
        if (error.message.includes('already exists')) {
          console.log(`   ✅ Policy for ${policy.bucket} already exists`);
        } else {
          console.log(`   ⚠️  Policy for ${policy.bucket}: ${error.message}`);
        }
      } else {
        console.log(`   ✅ Created policy for ${policy.bucket}`);
      }
    } catch (err) {
      console.log(`   ⚠️  Policy for ${policy.bucket}: ${err.message}`);
    }
  }
}

// Run the setup
async function main() {
  try {
    await createStorageBuckets();
    // Note: Policy creation via RPC might not work, recommend manual creation
    console.log('\n📝 For storage policies, please run the SQL commands in Supabase Dashboard > SQL Editor');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

main();