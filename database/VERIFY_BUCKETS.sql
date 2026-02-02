-- ✅ VERIFICATION SCRIPT - Check if everything is working correctly
-- Run this to verify buckets and settings are properly configured

-- 1. Verify Storage Buckets
SELECT '=== STORAGE BUCKETS VERIFICATION ===' as section;
SELECT 
  name as bucket_name,
  public,
  file_size_limit,
  CASE 
    WHEN name = 'product-files' THEN '✅ Private bucket for product downloads'
    WHEN name = 'product-images' THEN '✅ Public bucket for product thumbnails'
    WHEN name = 'avatars' THEN '✅ Public bucket for user avatars'
    ELSE '⚠️ Unknown bucket'
  END as status
FROM storage.buckets 
WHERE name IN ('product-files', 'product-images', 'avatars')
ORDER BY name;

-- 2. Check if all required buckets exist
SELECT '=== BUCKET COMPLETENESS CHECK ===' as section;
SELECT 
  CASE 
    WHEN COUNT(*) = 3 THEN '✅ ALL BUCKETS CREATED SUCCESSFULLY'
    ELSE '❌ MISSING BUCKETS - Expected 3, Found ' || COUNT(*)
  END as bucket_status
FROM storage.buckets 
WHERE name IN ('product-files', 'product-images', 'avatars');

-- 3. Verify Platform Settings
SELECT '=== PLATFORM SETTINGS VERIFICATION ===' as section;
SELECT 
  key,
  value,
  CASE 
    WHEN key = 'maintenance_mode' AND value = '"false"' THEN '✅ Platform is LIVE'
    WHEN key = 'registration_enabled' AND value = '"true"' THEN '✅ User registration ENABLED'
    WHEN key = 'seller_registration_enabled' AND value = '"true"' THEN '✅ Seller registration ENABLED'
    WHEN key = 'platform_name' AND value = '"Seltech"' THEN '✅ Platform name set'
    WHEN key = 'commission_rate' AND value = '"10"' THEN '✅ Commission rate: 10%'
    ELSE '✅ Setting configured'
  END as status
FROM public.platform_settings 
WHERE key IN (
  'maintenance_mode', 
  'registration_enabled', 
  'seller_registration_enabled',
  'platform_name',
  'commission_rate'
)
ORDER BY key;

-- 4. Verify Admin User
SELECT '=== ADMIN USER VERIFICATION ===' as section;
SELECT 
  email,
  role,
  CASE 
    WHEN role = 'admin' THEN '✅ ADMIN ACCESS CONFIRMED'
    ELSE '❌ NOT ADMIN - Need to fix role'
  END as admin_status
FROM public.profiles 
WHERE email = 'se1cethan@gmail.com';

-- 5. Check Storage Policies
SELECT '=== STORAGE POLICIES VERIFICATION ===' as section;
SELECT 
  tablename,
  policyname,
  '✅ Policy exists' as status
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname IN ('product_files_policy', 'product_images_policy', 'avatars_policy')
ORDER BY policyname;

-- 6. Platform Settings RLS Status
SELECT '=== PLATFORM SETTINGS RLS STATUS ===' as section;
SELECT 
  tablename,
  rowsecurity,
  CASE 
    WHEN rowsecurity = false THEN '✅ RLS DISABLED - Admin can save settings'
    ELSE '⚠️ RLS ENABLED - May cause admin issues'
  END as rls_status
FROM pg_tables 
WHERE tablename = 'platform_settings' 
AND schemaname = 'public';

-- 7. Final Status Summary
SELECT '=== FINAL STATUS SUMMARY ===' as section;
SELECT 
  '✅ Storage buckets: ' || 
  (SELECT COUNT(*) FROM storage.buckets WHERE name IN ('product-files', 'product-images', 'avatars')) || '/3' ||
  ' | ✅ Platform settings: ' || 
  (SELECT COUNT(*) FROM public.platform_settings WHERE key IN ('maintenance_mode', 'registration_enabled', 'seller_registration_enabled')) || '/3' ||
  ' | ✅ Admin user: ' || 
  (SELECT CASE WHEN COUNT(*) > 0 THEN 'CONFIRMED' ELSE 'NOT FOUND' END FROM public.profiles WHERE email = 'se1cethan@gmail.com' AND role = 'admin')
  as overall_status;

-- Success message
SELECT '🎉 VERIFICATION COMPLETE! Check results above.' as result;