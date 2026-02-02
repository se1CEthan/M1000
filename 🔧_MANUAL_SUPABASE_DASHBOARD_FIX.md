# 🔧 Manual Supabase Dashboard Fix - Create Buckets Manually

## The Issue
You're still getting "Bucket not found" errors, which means the SQL scripts aren't creating the buckets properly. Let's create them manually through the Supabase Dashboard.

## Step 1: Verify Current State

**First, run this verification script in SQL Editor:**

```sql
-- Check what buckets currently exist
SELECT id, name, public FROM storage.buckets ORDER BY name;
```

## Step 2: Manual Bucket Creation (Recommended)

**Go to Supabase Dashboard > Storage > Create buckets manually:**

### Bucket 1: product-files
1. **Click "New bucket"**
2. **Bucket name:** `product-files`
3. **Public bucket:** ❌ **UNCHECK** (make it private)
4. **File size limit:** `524288000` (500MB in bytes)
5. **Allowed MIME types:** Leave empty (allows all)
6. **Click "Create bucket"**

### Bucket 2: product-images
1. **Click "New bucket"**
2. **Bucket name:** `product-images`
3. **Public bucket:** ✅ **CHECK** (make it public)
4. **File size limit:** `10485760` (10MB in bytes)
5. **Allowed MIME types:** `image/jpeg,image/png,image/gif,image/webp`
6. **Click "Create bucket"**

### Bucket 3: avatars
1. **Click "New bucket"**
2. **Bucket name:** `avatars`
3. **Public bucket:** ✅ **CHECK** (make it public)
4. **File size limit:** `2097152` (2MB in bytes)
5. **Allowed MIME types:** `image/jpeg,image/png,image/gif,image/webp`
6. **Click "Create bucket"**

## Step 3: Set Storage Policies

**After creating buckets, go to Storage > Policies:**

**Click "New Policy" and create these:**

### Policy 1: product-files access
- **Policy name:** `product_files_access`
- **Allowed operation:** `All`
- **Target roles:** `authenticated`
- **USING expression:** `bucket_id = 'product-files'`

### Policy 2: product-images access
- **Policy name:** `product_images_access`
- **Allowed operation:** `All`
- **Target roles:** `public`
- **USING expression:** `bucket_id = 'product-images'`

### Policy 3: avatars access
- **Policy name:** `avatars_access`
- **Allowed operation:** `All`
- **Target roles:** `public`
- **USING expression:** `bucket_id = 'avatars'`

## Step 4: Fix Admin Settings

**Run this in SQL Editor:**

```sql
-- Fix admin settings
ALTER TABLE public.platform_settings DISABLE ROW LEVEL SECURITY;
UPDATE public.profiles SET role = 'admin' WHERE email = 'se1cethan@gmail.com';
```

## Step 5: Test Downloads

1. **Go to Admin Dashboard > Product Reviews**
2. **Click on a product with a file**
3. **Click "Download" button**
4. **Should work without "Bucket not found" error**

## Alternative: Simple SQL Method

**If manual creation doesn't work, try this simple SQL:**

```sql
-- Simple bucket creation
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('product-files', 'product-files', false),
  ('product-images', 'product-images', true),
  ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Simple policies
CREATE POLICY "simple_product_files" ON storage.objects FOR ALL USING (bucket_id = 'product-files');
CREATE POLICY "simple_product_images" ON storage.objects FOR ALL USING (bucket_id = 'product-images');
CREATE POLICY "simple_avatars" ON storage.objects FOR ALL USING (bucket_id = 'avatars');
```

## Verification

**After creating buckets, verify they exist:**

```sql
SELECT 'VERIFICATION:' as status;
SELECT id, name, public FROM storage.buckets WHERE name IN ('product-files', 'product-images', 'avatars');
```

**You should see 3 rows returned with your buckets.**

## Troubleshooting

**If buckets still don't appear:**
1. **Check Supabase project** - Make sure you're in the correct project
2. **Check permissions** - Ensure you have admin access to the project
3. **Try browser refresh** - Sometimes the dashboard needs a refresh
4. **Check project limits** - Free tier has storage limits

**If downloads still fail:**
1. **Check browser console** for detailed error messages
2. **Verify file_url** in products table points to correct bucket
3. **Test with a simple file** upload first

---

**This manual method should definitely create the buckets and fix your download issues.**