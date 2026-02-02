-- Check if admin user exists and has correct role
SELECT 
  id,
  email,
  role,
  is_verified_seller,
  created_at
FROM profiles 
WHERE email = 'se1cethan@gmail.com';

-- If the user doesn't have admin role, update it
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'se1cethan@gmail.com';

-- Verify the update
SELECT 
  id,
  email,
  role,
  is_verified_seller,
  created_at
FROM profiles 
WHERE email = 'se1cethan@gmail.com';