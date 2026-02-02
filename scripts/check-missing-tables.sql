-- Check what tables exist and what's missing for seller verification

-- 1. List all existing tables
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Check specifically for seller verification table
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'seller_verification_applications' 
      AND table_schema = 'public'
    ) 
    THEN 'seller_verification_applications table EXISTS'
    ELSE 'seller_verification_applications table MISSING - need to create it'
  END as verification_table_status;

-- 3. Check for other important tables
SELECT 
  'profiles' as table_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public')
    THEN 'EXISTS'
    ELSE 'MISSING'
  END as status
UNION ALL
SELECT 
  'products' as table_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products' AND table_schema = 'public')
    THEN 'EXISTS'
    ELSE 'MISSING'
  END as status
UNION ALL
SELECT 
  'orders' as table_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders' AND table_schema = 'public')
    THEN 'EXISTS'
    ELSE 'MISSING'
  END as status
UNION ALL
SELECT 
  'seller_verification_applications' as table_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'seller_verification_applications' AND table_schema = 'public')
    THEN 'EXISTS'
    ELSE 'MISSING'
  END as status;

-- 4. Check storage buckets
SELECT 
  name as bucket_name,
  public,
  created_at
FROM storage.buckets
ORDER BY name;