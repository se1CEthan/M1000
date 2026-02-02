-- 🔍 DEBUG SELLER VERIFICATION ISSUES
-- This script helps debug the seller verification RLS issues

-- 1. Check current table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'seller_verification_applications' 
ORDER BY ordinal_position;

-- 2. Check current RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'seller_verification_applications';

-- 3. Check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'seller_verification_applications';

-- 4. Check profiles table structure for reference
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('id', 'user_id', 'role')
ORDER BY ordinal_position;

-- 5. Check if there are any existing applications
SELECT 
    COUNT(*) as total_applications,
    COUNT(DISTINCT user_id) as unique_users,
    array_agg(DISTINCT status) as statuses
FROM seller_verification_applications;

-- 6. Check profiles that could submit applications
SELECT 
    COUNT(*) as total_profiles,
    COUNT(*) FILTER (WHERE role = 'seller') as sellers,
    COUNT(*) FILTER (WHERE role = 'admin') as admins,
    COUNT(*) FILTER (WHERE role = 'buyer') as buyers
FROM profiles;

-- 7. Temporarily create a very permissive policy for testing
DROP POLICY IF EXISTS "debug_allow_all" ON seller_verification_applications;

CREATE POLICY "debug_allow_all" ON seller_verification_applications
  FOR ALL TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- 8. Show current policies after adding debug policy
SELECT 
    policyname,
    cmd,
    permissive,
    roles
FROM pg_policies 
WHERE tablename = 'seller_verification_applications'
ORDER BY policyname;