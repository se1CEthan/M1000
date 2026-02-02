-- Quick script to make a user a seller for testing
-- Replace 'your-email@example.com' with the actual user email

-- Method 1: Update user profile directly (for testing)
UPDATE profiles 
SET 
  role = 'seller',
  is_verified_seller = true,
  verification_status = 'approved',
  verification_reviewed_at = NOW()
WHERE email = 'your-email@example.com';

-- Method 2: If you want to see the current user status first
SELECT 
  id,
  email,
  role,
  is_verified_seller,
  verification_status,
  created_at
FROM profiles 
WHERE email = 'your-email@example.com';

-- Method 3: Create a seller verification application and approve it
-- First, get the user ID
-- INSERT INTO seller_verification_applications (
--   user_id,
--   full_name,
--   date_of_birth,
--   phone_number,
--   address,
--   business_type,
--   selling_reason,
--   experience_level,
--   product_categories,
--   terms_accepted,
--   commission_rate_accepted,
--   status
-- ) 
-- SELECT 
--   id,
--   COALESCE(full_name, 'Test Seller'),
--   '1990-01-01',
--   '+1234567890',
--   '{"line1": "123 Test St", "city": "Test City", "state": "TS", "postal_code": "12345", "country": "US"}',
--   'individual',
--   'I want to sell digital products',
--   'intermediate',
--   ARRAY['software', 'bots'],
--   true,
--   true,
--   'approved'
-- FROM profiles 
-- WHERE email = 'your-email@example.com';

-- Verify the changes
SELECT 
  p.email,
  p.role,
  p.is_verified_seller,
  p.verification_status,
  COUNT(sva.id) as application_count
FROM profiles p
LEFT JOIN seller_verification_applications sva ON p.id = sva.user_id
WHERE p.email = 'your-email@example.com'
GROUP BY p.id, p.email, p.role, p.is_verified_seller, p.verification_status;