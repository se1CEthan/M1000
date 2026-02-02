-- Debug user ID and RLS issues for seller verification

-- 1. Check current authenticated user
SELECT 
  auth.uid() as current_user_id,
  auth.jwt() ->> 'email' as current_user_email;

-- 2. Check if profiles table has the user
SELECT 
  id,
  user_id,
  email,
  role
FROM profiles 
WHERE user_id = auth.uid();

-- 3. Check RLS status on seller_verification_applications
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'seller_verification_applications';

-- 4. Check existing policies
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'seller_verification_applications';

-- 5. Test if we can insert (this will show the exact error)
-- Note: This will fail but show us why
DO $$
BEGIN
  INSERT INTO seller_verification_applications (
    user_id,
    full_name,
    date_of_birth,
    phone_number,
    address,
    business_type,
    selling_reason,
    experience_level,
    product_categories,
    terms_accepted,
    commission_rate_accepted
  ) VALUES (
    auth.uid(),
    'Test User',
    '1990-01-01',
    '+1234567890',
    '{"line1": "123 Test St", "city": "Test City", "state": "TS", "postal_code": "12345", "country": "Test Country"}',
    'individual',
    'Testing the seller verification system',
    'beginner',
    ARRAY['bots'],
    true,
    true
  );
  
  RAISE NOTICE 'SUCCESS: Test insertion worked';
  
  -- Clean up test data
  DELETE FROM seller_verification_applications WHERE full_name = 'Test User';
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'ERROR: %', SQLERRM;
END $$;