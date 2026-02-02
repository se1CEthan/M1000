-- Diagnostic Script: Admin Users Loading Issue
-- Run this to identify what's causing the "failed to load users" error

-- 1. Check if profiles table exists and has data
SELECT 
  'Profiles Table Check' as check_type,
  COUNT(*) as total_records,
  COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins,
  COUNT(CASE WHEN role = 'seller' THEN 1 END) as sellers,
  COUNT(CASE WHEN role = 'buyer' THEN 1 END) as buyers
FROM profiles;

-- 2. Check if seller_verification_applications table exists and has data
SELECT 
  'Verification Applications Check' as check_type,
  COUNT(*) as total_applications,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
  COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
  COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected
FROM seller_verification_applications;

-- 3. Check for orphaned verification applications (no matching profile)
SELECT 
  'Orphaned Applications Check' as check_type,
  COUNT(*) as orphaned_count
FROM seller_verification_applications sva
LEFT JOIN profiles p ON sva.user_id = p.user_id
WHERE p.user_id IS NULL;

-- 4. Show sample profiles data
SELECT 
  'Sample Profiles' as data_type,
  id,
  user_id,
  email,
  full_name,
  role,
  is_verified_seller,
  verification_status,
  created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 5;

-- 5. Show sample verification applications
SELECT 
  'Sample Verification Applications' as data_type,
  id,
  user_id,
  full_name,
  status,
  business_type,
  created_at
FROM seller_verification_applications
ORDER BY created_at DESC
LIMIT 5;

-- 6. Check for any RLS policies that might be blocking access
SELECT 
  'RLS Policies Check' as check_type,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('profiles', 'seller_verification_applications')
ORDER BY tablename, policyname;

-- 7. Check table permissions
SELECT 
  'Table Permissions' as check_type,
  table_name,
  privilege_type,
  grantee
FROM information_schema.table_privileges 
WHERE table_name IN ('profiles', 'seller_verification_applications')
ORDER BY table_name, privilege_type;

-- 8. Test basic queries that the admin component uses
-- Test profiles query
SELECT 
  'Profiles Query Test' as test_type,
  'SUCCESS' as status,
  COUNT(*) as record_count
FROM profiles;

-- Test verification applications query
SELECT 
  'Verification Applications Query Test' as test_type,
  'SUCCESS' as status,
  COUNT(*) as record_count
FROM seller_verification_applications;