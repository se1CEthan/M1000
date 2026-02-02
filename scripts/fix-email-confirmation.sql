-- Fix email confirmation issues
-- This will confirm all existing users and show you how to disable confirmations

-- 1. First, let's see which users need confirmation
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  CASE 
    WHEN email_confirmed_at IS NULL THEN 'NOT CONFIRMED'
    ELSE 'CONFIRMED'
  END as status
FROM auth.users
ORDER BY created_at DESC;

-- 2. Confirm all existing users (so they can login)
UPDATE auth.users 
SET 
  email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
  updated_at = NOW()
WHERE email_confirmed_at IS NULL;

-- 3. Check the results
SELECT 
  COUNT(*) as total_users,
  COUNT(email_confirmed_at) as confirmed_users,
  COUNT(*) - COUNT(email_confirmed_at) as unconfirmed_users
FROM auth.users;

-- Success message
SELECT 'All existing users have been confirmed and can now login!' as message;