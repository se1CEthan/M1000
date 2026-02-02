-- Check current user role
SELECT 
  id,
  user_id,
  email,
  role,
  is_verified_seller,
  created_at
FROM profiles 
WHERE email = 'se1cethan@gmail.com';

-- Update user to admin role
UPDATE profiles 
SET 
  role = 'admin',
  is_verified_seller = true,
  verification_status = 'approved'
WHERE email = 'se1cethan@gmail.com';

-- Verify the update worked
SELECT 
  id,
  user_id,
  email,
  role,
  is_verified_seller,
  verification_status,
  created_at
FROM profiles 
WHERE email = 'se1cethan@gmail.com';

-- If no user found, let's see all users
SELECT 
  id,
  user_id,
  email,
  role,
  created_at
FROM profiles 
ORDER BY created_at DESC
LIMIT 10;