# 🚨 "Bucket not found" Troubleshooting Guide

## Current Issue
You're still getting `statusCode"404"error"Bucket not found"message"Bucket not found"` when clicking download in product reviews.

## Root Cause
The storage buckets (`product-files`, `product-images`, `avatars`) don't exist in your Supabase project, despite running SQL scripts.

## 🔍 Step 1: Verify Current State

**Run this verification script in Supabase SQL Editor:**

```sql
-- Check what buckets currently exist
SELECT 'CURRENT BUCKETS:' as status;
SELECT id, name, public, created_at FROM storage.buckets ORDER BY name;

-- Check if our required buckets exist
SELECT 
  CASE WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'product-files') 
       THEN '✅ product-files EXISTS' 
       ELSE '❌ product-files MISSING' END as product_files,
  CASE WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'product-images') 
       THEN '✅ product-images EXISTS' 
       ELSE '❌ product-images MISSING' END as product_images,
  CASE WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'avatars') 
       THEN '✅ avatars EXISTS' 
       ELSE '❌ avatars MISSING' END as avatars;
```

## 🚀 Step 2: Manual Bucket Creation (GUARANTEED TO WORK)

**Since SQL isn't working, create buckets manually:**

### Go to Supabase Dashboard > Storage

1. **Click "New bucket"**
2. **Create these 3 buckets exactly:**

| Bucket Name | Public | File Size Limit | MIME Types |
|-------------|--------|-----------------|------------|
| `product-files` | ❌ No | 500 MB | (leave empty) |
| `product-images` | ✅ Yes | 10 MB | image/jpeg,image/png,image/gif,image/webp |
| `avatars` | ✅ Yes | 2 MB | image/jpeg,image/png,image/gif,image/webp |

### Important Notes:
- **Bucket names must be EXACT**: `product-files`, `product-images`, `avatars`
- **No spaces, no capital letters, no typos**
- **product-files must be PRIVATE (unchecked public)**
- **Other two must be PUBLIC (checked public)**

## 🔧 Step 3: Set Storage Policies

**After creating buckets, go to Storage > Policies:**

**Create these policies (click "New Policy"):**

### Policy 1: product-files
- **Policy name:** `product_files_admin_access`
- **Allowed operation:** `All`
- **Target roles:** `authenticated`
- **USING expression:** `bucket_id = 'product-files'`

### Policy 2: product-images  
- **Policy name:** `product_images_public_access`
- **Allowed operation:** `All`
- **Target roles:** `public`
- **USING expression:** `bucket_id = 'product-images'`

### Policy 3: avatars
- **Policy name:** `avatars_public_access`
- **Allowed operation:** `All`
- **Target roles:** `public`
- **USING expression:** `bucket_id = 'avatars'`

## ✅ Step 4: Verify Buckets Were Created

**Run this verification again:**

```sql
SELECT 'VERIFICATION AFTER MANUAL CREATION:' as status;
SELECT id, name, public FROM storage.buckets WHERE name IN ('product-files', 'product-images', 'avatars');
```

**You should see 3 rows returned. If not, the buckets weren't created properly.**

## 🧪 Step 5: Test Download

1. **Go to Admin Dashboard > Product Reviews**
2. **Click on a product with a file**
3. **Open browser console (F12)**
4. **Click "Download" button**
5. **Check console for detailed error messages**

## 🔍 Step 6: Debug Information

**The updated download function now provides detailed logging. Check browser console for:**

- `Starting download for product: [ID] File URL: [URL]`
- `Download service result: [object]`
- Any error messages about bucket access

## 🚨 If Manual Creation Still Doesn't Work

### Check These Common Issues:

1. **Wrong Supabase Project**
   - Verify you're in the correct project
   - Check project URL matches your app

2. **Insufficient Permissions**
   - Ensure you have admin access to the project
   - Check if you're the project owner

3. **Storage Disabled**
   - Go to Settings > Storage
   - Ensure storage is enabled for your project

4. **Free Tier Limits**
   - Check if you've hit storage limits
   - Upgrade to paid plan if needed

### Alternative: Direct File URLs

**If buckets still don't work, modify your products to use direct URLs:**

```sql
-- Check current file URLs in products
SELECT id, title, file_url FROM products WHERE file_url IS NOT NULL LIMIT 5;
```

**File URLs should be either:**
- Direct HTTP URLs (e.g., `https://example.com/file.zip`)
- Supabase storage URLs (e.g., `https://[project].supabase.co/storage/v1/object/public/product-files/file.zip`)

## 📞 Last Resort

**If nothing works:**

1. **Check Supabase Status**: https://status.supabase.com/
2. **Contact Supabase Support**: Include your project ID
3. **Use external file hosting**: Upload files to Google Drive, Dropbox, etc.

---

**The manual bucket creation method should definitely work. If it doesn't, there's likely a deeper project configuration issue.**