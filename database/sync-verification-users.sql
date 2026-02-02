-- Sync Verification Applications with User Profiles
-- This script ensures all verification applications have corresponding user profiles

-- 1. Check for verification applications without corresponding profiles
SELECT 
  'Verification Applications without Profiles' as issue,
  COUNT(*) as count
FROM seller_verification_applications sva
LEFT JOIN profiles p ON sva.user_id = p.user_id
WHERE p.user_id IS NULL;

-- 2. Show the problematic applications
SELECT 
  sva.id,
  sva.user_id,
  sva.full_name,
  sva.created_at,
  'No matching profile' as issue
FROM seller_verification_applications sva
LEFT JOIN profiles p ON sva.user_id = p.user_id
WHERE p.user_id IS NULL;

-- 3. Create missing profiles for verification applications
-- This creates basic profiles for users who submitted applications but don't have profiles
INSERT INTO profiles (
  user_id,
  email,
  full_name,
  role,
  is_verified_seller,
  verification_status,
  created_at,
  updated_at
)
SELECT 
  sva.user_id,
  COALESCE(sva.full_name || '@temp.email', 'temp_' || sva.user_id || '@seltech.online') as email,
  sva.full_name,
  'buyer' as role,
  false as is_verified_seller,
  'pending' as verification_status,
  sva.created_at,
  NOW()
FROM seller_verification_applications sva
LEFT JOIN profiles p ON sva.user_id = p.user_id
WHERE p.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- 4. Update existing profiles to match verification application data
UPDATE profiles 
SET 
  full_name = COALESCE(profiles.full_name, sva.full_name),
  verification_status = CASE 
    WHEN sva.status = 'approved' THEN 'approved'
    WHEN sva.status = 'rejected' THEN 'rejected'
    ELSE 'pending'
  END,
  is_verified_seller = CASE 
    WHEN sva.status = 'approved' THEN true
    ELSE false
  END,
  role = CASE 
    WHEN sva.status = 'approved' THEN 'seller'
    ELSE profiles.role
  END,
  updated_at = NOW()
FROM seller_verification_applications sva
WHERE profiles.user_id = sva.user_id;

-- 5. Clean up any verification applications with invalid user_id format
-- Remove applications where user_id is not a valid UUID
DELETE FROM seller_verification_applications 
WHERE user_id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- 6. Verify the sync results
SELECT 
  'Sync Results' as summary,
  (SELECT COUNT(*) FROM seller_verification_applications) as total_applications,
  (SELECT COUNT(*) FROM profiles) as total_profiles,
  (SELECT COUNT(*) 
   FROM seller_verification_applications sva
   INNER JOIN profiles p ON sva.user_id = p.user_id) as synced_applications;

-- 7. Show applications with their corresponding profiles
SELECT 
  sva.id as application_id,
  sva.full_name as application_name,
  sva.status as application_status,
  p.id as profile_id,
  p.full_name as profile_name,
  p.email as profile_email,
  p.role as profile_role,
  p.is_verified_seller,
  CASE 
    WHEN p.user_id IS NOT NULL THEN '✅ Synced'
    ELSE '❌ Missing Profile'
  END as sync_status
FROM seller_verification_applications sva
LEFT JOIN profiles p ON sva.user_id = p.user_id
ORDER BY sva.created_at DESC;

-- 8. Update admin dashboard to show correct counts
SELECT 
  'Dashboard Counts' as section,
  (SELECT COUNT(*) FROM profiles WHERE role = 'admin') as admins,
  (SELECT COUNT(*) FROM profiles WHERE role = 'seller') as sellers,
  (SELECT COUNT(*) FROM profiles WHERE role = 'buyer') as buyers,
  (SELECT COUNT(*) FROM seller_verification_applications WHERE status = 'pending') as pending_applications,
  (SELECT COUNT(*) FROM seller_verification_applications WHERE status = 'approved') as approved_applications,
  (SELECT COUNT(*) FROM seller_verification_applications WHERE status = 'rejected') as rejected_applications;