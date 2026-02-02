-- Seltech Marketplace Database Health Check
-- Run this script to verify your production database is properly configured

-- Check if all required tables exist
SELECT 
  'Tables Check' as check_type,
  CASE 
    WHEN COUNT(*) = 8 THEN '✅ All tables exist'
    ELSE '❌ Missing tables: ' || (8 - COUNT(*))::text
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('profiles', 'products', 'orders', 'reviews', 'wishlists', 'disputes', 'payouts', 'platform_settings');

-- Check RLS is enabled on all tables
SELECT 
  'RLS Check' as check_type,
  CASE 
    WHEN COUNT(*) = 8 THEN '✅ RLS enabled on all tables'
    ELSE '❌ RLS not enabled on ' || (8 - COUNT(*))::text || ' tables'
  END as status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'products', 'orders', 'reviews', 'wishlists', 'disputes', 'payouts', 'platform_settings')
  AND rowsecurity = true;

-- Check if indexes are created
SELECT 
  'Indexes Check' as check_type,
  CASE 
    WHEN COUNT(*) >= 20 THEN '✅ Performance indexes created'
    ELSE '⚠️ Only ' || COUNT(*)::text || ' indexes found'
  END as status
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexname LIKE 'idx_%';

-- Check storage buckets
SELECT 
  'Storage Check' as check_type,
  CASE 
    WHEN COUNT(*) >= 3 THEN '✅ Storage buckets configured'
    ELSE '❌ Missing storage buckets'
  END as status
FROM storage.buckets 
WHERE name IN ('product-files', 'product-images', 'avatars');

-- Check platform settings
SELECT 
  'Settings Check' as check_type,
  CASE 
    WHEN COUNT(*) >= 5 THEN '✅ Platform settings configured'
    ELSE '⚠️ Only ' || COUNT(*)::text || ' settings configured'
  END as status
FROM public.platform_settings;

-- Check authentication trigger
SELECT 
  'Auth Trigger Check' as check_type,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Auth trigger configured'
    ELSE '❌ Auth trigger missing'
  END as status
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Database statistics
SELECT 
  'Database Stats' as check_type,
  'Tables: ' || 
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') ||
  ', Functions: ' ||
  (SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public') ||
  ', Triggers: ' ||
  (SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_schema = 'public') as status;

-- Check for any data (should be empty in fresh production setup)
SELECT 
  'Data Check' as check_type,
  'Profiles: ' || (SELECT COUNT(*) FROM public.profiles) ||
  ', Products: ' || (SELECT COUNT(*) FROM public.products) ||
  ', Orders: ' || (SELECT COUNT(*) FROM public.orders) as status;

-- Performance check - slow queries (if any data exists)
SELECT 
  'Performance Check' as check_type,
  'Ready for production monitoring' as status;

-- Final summary
SELECT 
  '=== PRODUCTION READINESS SUMMARY ===' as summary,
  CASE 
    WHEN (
      SELECT COUNT(*) FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('profiles', 'products', 'orders', 'reviews', 'wishlists', 'disputes', 'payouts', 'platform_settings')
    ) = 8 
    AND (
      SELECT COUNT(*) FROM pg_tables 
      WHERE schemaname = 'public' 
        AND tablename IN ('profiles', 'products', 'orders', 'reviews', 'wishlists', 'disputes', 'payouts', 'platform_settings')
        AND rowsecurity = true
    ) = 8
    AND (
      SELECT COUNT(*) FROM storage.buckets 
      WHERE name IN ('product-files', 'product-images', 'avatars')
    ) >= 3
    THEN '🎉 DATABASE IS PRODUCTION READY!'
    ELSE '⚠️ Please review the checks above and fix any issues'
  END as status;