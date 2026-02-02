-- Fix Automatic Login After Signup
-- This script ensures all users can login immediately without email confirmation

-- Step 1: Confirm all existing users so they can login
UPDATE auth.users 
SET 
  email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
  updated_at = NOW()
WHERE email_confirmed_at IS NULL;

-- Step 2: Verify all users are now confirmed
SELECT 
  'Users confirmed' as action,
  COUNT(*) as total_users,
  COUNT(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 END) as confirmed_users,
  COUNT(CASE WHEN email_confirmed_at IS NULL THEN 1 END) as unconfirmed_users
FROM auth.users;

-- Step 3: Check recent signups and their confirmation status
SELECT 
  email,
  CASE 
    WHEN email_confirmed_at IS NULL THEN '❌ NOT CONFIRMED'
    ELSE '✅ CONFIRMED'
  END as status,
  created_at,
  email_confirmed_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- Step 4: Verify profile creation trigger exists
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name LIKE '%profile%' 
  AND event_object_table = 'users'
  AND event_object_schema = 'auth';

-- Step 5: Check that profiles exist for all users
SELECT 
  'Profile status' as check_type,
  COUNT(u.id) as total_users,
  COUNT(p.user_id) as users_with_profiles,
  COUNT(u.id) - COUNT(p.user_id) as users_without_profiles
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id;

-- Step 6: Create profiles for users who don't have them (fallback)
INSERT INTO public.profiles (user_id, email, full_name, role, is_verified_seller, created_at, updated_at)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name'),
  COALESCE(u.raw_user_meta_data->>'role', 'buyer'),
  false,
  NOW(),
  NOW()
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
WHERE p.user_id IS NULL;

-- Step 7: Final verification
SELECT 
  u.email,
  CASE 
    WHEN u.email_confirmed_at IS NULL THEN '❌ NOT CONFIRMED'
    ELSE '✅ CONFIRMED'
  END as email_status,
  CASE 
    WHEN p.user_id IS NULL THEN '❌ NO PROFILE'
    ELSE '✅ HAS PROFILE'
  END as profile_status,
  p.role,
  u.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
ORDER BY u.created_at DESC;

SELECT '🎉 All users are now confirmed and have profiles. Automatic login should work!' as result;