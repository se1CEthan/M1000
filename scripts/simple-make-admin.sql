-- First, let's see what users exist
SELECT 
  id,
  user_id,
  email,
  role,
  is_verified_seller
FROM profiles 
ORDER BY created_at DESC;

-- Update your user to admin (replace with your actual email if different)
UPDATE profiles 
SET 
  role = 'admin',
  is_verified_seller = true
WHERE email = 'se1cethan@gmail.com';

-- Verify it worked
SELECT 
  id,
  user_id,
  email,
  role,
  is_verified_seller
FROM profiles 
WHERE email = 'se1cethan@gmail.com';