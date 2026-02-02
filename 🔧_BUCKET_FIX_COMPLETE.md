# 🔧 Complete Bucket Fix for Admin Downloads

## Issue
Getting "Bucket not found" error when downloading product files from admin dashboard.

## Root Cause
The required storage buckets (`product-files`, `product-images`, `avatars`) don't exist in your Supabase project.

## Solution

### Step 1: Create Buckets via Supabase Dashboard

**Go to your Supabase Dashboard:**
1. Navigate to **Storage** in the left sidebar
2. Click **"New bucket"** button
3. Create these buc3 buckets:

#### Bucket 1: product-files
- **Name:** `product-files`
- **Public:** ❌ **No** (Private bucket)
- **File size limit:** 500 MB
- **Allowed MIME types:** Leave empty (allows all)

#### Bucket 2: product-images  
- **Name:** `product-images`
- **Public:** ✅ **Yes** (Public bucket)
- **File size limit:** 10 MB
- **Allowed MIME types:** `image/jpeg, image/png, image/gif, image/webp`

#### Bucket 3: avatars
- **Name:** `avatars` 
- **Public:** ✅ **Yes** (Public bucket)
- **File size limit:** 2 MB
- **Allowed MIME types:** `image/jpeg, image/png, image/gif, image/webp`

### Step 2: Set Storage Policies

After creating buckets, go to **Storage > Policies** and add these policies:

#### For product-files bucket:
```sql
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload product files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'product-files' AND 
  auth.role() = 'authenticated'
);

-- Allow file owners and admins to view
CREATE POLICY "Owners and admins can view product files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'product-files' AND 
  (auth.uid()::text = (storage.foldername(name))[1] OR 
   EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'))
);
```

#### For product-images bucket:
```sql
-- Anyone can view product images
CREATE POLICY "Anyone can view product images" ON storage.objects
FOR SELECT USING (bucket_id = 'product-images');

-- Authenticated users can upload product images
CREATE POLICY "Authenticated users can upload product images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'product-images' AND 
  auth.role() = 'authenticated'
);
```

#### For avatars bucket:
```sql
-- Anyone can view avatars
CREATE POLICY "Anyone can view avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

-- Users can upload their own avatars
CREATE POLICY "Users can upload their own avatars" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND 
  auth.role() = 'authenticated'
);
```

### Step 3: Alternative SQL Method

If you prefer SQL, run this in your **Supabase SQL Editor**:

```sql
-- Create buckets using SQL
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES 
  ('product-files', 'product-files', false, 524288000, null),
  ('product-images', 'product-images', true, 10485760, array['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Create basic policies
CREATE POLICY "product_files_access" ON storage.objects 
FOR ALL USING (bucket_id = 'product-files');

CREATE POLICY "product_images_access" ON storage.objects 
FOR ALL USING (bucket_id = 'product-images');

CREATE POLICY "avatars_access" ON storage.objects 
FOR ALL USING (bucket_id = 'avatars');
```

### Step 4: Verify Fix

1. Go back to **Storage** in Supabase Dashboard
2. You should see all 3 buckets listed
3. Try downloading a product file from admin dashboard
4. It should work without the "Bucket not found" error

## Quick Test

After creating buckets, test the download functionality:

1. Go to Admin Dashboard
2. Navigate to Product Reviews
3. Click on a product with a file
4. Click the Download button
5. File should download successfully

## Troubleshooting

If you still get errors:

1. **Check bucket names** - Must be exactly: `product-files`, `product-images`, `avatars`
2. **Check policies** - Make sure storage policies are created
3. **Check file paths** - Ensure product files have correct `file_url` in database
4. **Clear browser cache** - Sometimes helps with storage issues

## Success Indicators

✅ **Buckets visible in Supabase Dashboard > Storage**  
✅ **No "Bucket not found" errors**  
✅ **Admin can download product files**  
✅ **File uploads work for sellers**  

---

**This fix resolves the storage bucket issue permanently for your production environment.**