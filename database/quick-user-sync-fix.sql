-- Quick Fix: Sync Verification Users
-- Simple approach to ensure all verification applications have corresponding profiles

-- Step 1: Check current state
SELECT 
  'Current State Check' as step,
  (SELECT COUNT(*) FROM seller_verification_applications) as total_applications,
  (SELECT COUNT(*) FROM profiles) as total_profiles,
  (SELECT COUNT(*) FROM seller_verification_applications sva 
   LEFT JOIN profiles p ON sva.user_id = p.user_id 
   WHERE p.user_id IS NULL) as orphaned_applications;

-- Step 2: Create profiles for orphaned applications
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
SELECT DISTINCT
  sva.user_id,
  'user_' || SUBSTRING(sva.user_id::text, 1, 8) || '@seltech.temp' as email,
  COALESCE(sva.full_name, 'Verification User') as full_name,
  'buyer'::user_role as role,
  false as is_verified_seller,
  'pending' as verification_status,
  COALESCE(sva.created_at, NOW()) as created_at,
  NOW() as updated_at
FROM seller_verification_applications sva
WHERE sva.user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM profiles p WHERE p.user_id = sva.user_id
  )
ON CONFLICT (user_id) DO NOTHING;

-- Step 3: Update profiles based on verification status
UPDATE profiles 
SET 
  is_verified_seller = CASE WHEN sva.status = 'approved' THEN true ELSE false END,
  role = CASE WHEN sva.status = 'approved' THEN 'seller'::user_role ELSE role END,
  verification_status = sva.status,
  updated_at = NOW()
FROM seller_verification_applications sva
WHERE profiles.user_id = sva.user_id
  AND sva.status IN ('approved', 'rejected');

-- Step 4: Verify the fix
SELECT 
  'Fix Results' as step,
  (SELECT COUNT(*) FROM seller_verification_applications) as total_applications,
  (SELECT COUNT(*) FROM profiles) as total_profiles,
  (SELECT COUNT(*) FROM seller_verification_applications sva 
   INNER JOIN profiles p ON sva.user_id = p.user_id) as synced_applications,
  (SELECT COUNT(*) FROM seller_verification_applications sva 
   LEFT JOIN profiles p ON sva.user_id = p.user_id 
   WHERE p.user_id IS NULL) as remaining_orphaned;

-- Step 5: Show sample of synced data
SELECT 
  sva.full_name as applicant_name,
  sva.status as application_status,
  p.email as profile_email,
  p.role as profile_role,
  p.is_verified_seller
FROM seller_verification_applications sva
INNER JOIN profiles p ON sva.user_id = p.user_id
ORDER BY sva.created_at DESC
LIMIT 10;