# 🔧 Manual Bucket Creation Guide

## 🚨 ISSUE: "Bucket not found" Error

If SQL bucket creation isn't working, create them manually through Supabase UI.

## 📋 **STEP-BY-STEP MANUAL FIX**

### **Step 1: Go to Supabase Storage**
1. Open your Supabase Dashboard
2. Click **"Storage"** in the left sidebar
3. You should see the Storage page

### **Step 2: Create product-files Bucket**
1. Click **"New bucket"** button
2. **Bucket name**: `product-files`
3. **Public bucket**: ❌ **UNCHECK** (keep it private)
4. **File size limit**: `500000000` (500MB)
5. **Allowed MIME types**: Leave empty or add:
   ```
   application/zip
   application/x-rar-compressed
   application/octet-stream
   application/x-msdownload
   ```
6. Click **"Create bucket"**

### **Step 3: Create product-images Bucket**
1. Click **"New bucket"** button
2. **Bucket name**: `product-images`
3. **Public bucket**: ✅ **CHECK** (make it public)
4. **File size limit**: `10000000` (10MB)
5. **Allowed MIME types**: 
   ```
   image/jpeg
   image/png
   image/gif
   image/webp
   ```
6. Click **"Create bucket"**

### **Step 4: Create avatars Bucket**
1. Click **"New bucket"** button
2. **Bucket name**: `avatars`
3. **Public bucket**: ✅ **CHECK** (make it public)
4. **File size limit**: `2000000` (2MB)
5. **Allowed MIME types**:
   ```
   image/jpeg
   image/png
   image/gif
   image/webp
   ```
6. Click **"Create bucket"**

### **Step 5: Set Up Policies (Optional)**
1. Go to **Storage > Policies**
2. For each bucket, click **"New Policy"**
3. Use this simple policy for all buckets:
   ```sql
   -- Policy name: Allow all operations
   -- Operation: All
   -- Target roles: authenticated
   -- USING expression: true
   ```

### **Step 6: Fix Admin Settings**
Run this in SQL Editor:
```sql
ALTER TABLE public.platform_settings DISABLE ROW LEVEL SECURITY;
UPDATE public.profiles SET role = 'admin' WHERE email = 'se1cethan@gmail.com';
```

## ✅ **VERIFICATION**

After creating buckets manually:

1. **Check Storage Dashboard**: You should see 3 buckets:
   - `product-files` (private)
   - `product-images` (public)
   - `avatars` (public)

2. **Test Downloads**: Try downloading a product file - should work!

3. **Test Admin Settings**: Go to Admin Dashboard → Settings and try saving

## 🚀 **ALTERNATIVE: SQL Method**

If you prefer SQL, try this file: `database/MANUAL_BUCKET_FIX.sql`

```sql
-- Run this in Supabase SQL Editor
SELECT storage.create_bucket('product-files', false);
SELECT storage.create_bucket('product-images', true);  
SELECT storage.create_bucket('avatars', true);
```

## 🎯 **TROUBLESHOOTING**

### **If buckets still don't appear:**
1. Check your Supabase project permissions
2. Make sure you're in the correct project
3. Try refreshing the Storage page
4. Check the browser console for errors

### **If downloads still fail:**
1. Verify the bucket names are exactly: `product-files`, `product-images`, `avatars`
2. Make sure `product-files` is **private** (unchecked public)
3. Check that policies allow access

### **If admin settings still fail:**
```sql
-- Run this to completely disable RLS
ALTER TABLE public.platform_settings DISABLE ROW LEVEL SECURITY;
GRANT ALL ON public.platform_settings TO authenticated;
```

## 🎉 **SUCCESS INDICATORS**

You'll know it's working when:
- ✅ Storage dashboard shows 3 buckets
- ✅ Product downloads work without "Bucket not found" error
- ✅ Admin settings save without RLS errors
- ✅ File uploads work for sellers

**Status**: Manual bucket creation is the most reliable method if SQL creation fails!