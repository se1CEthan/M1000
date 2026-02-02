-- MINIMAL FIX - Just the essentials

-- Disable RLS on products
ALTER TABLE products DISABLE ROW LEVEL SECURITY;

-- Make users sellers
UPDATE profiles SET role = 'seller', is_verified_seller = true WHERE email != 'se1cethan@gmail.com';
UPDATE profiles SET role = 'admin', is_verified_seller = true WHERE email = 'se1cethan@gmail.com';

-- Done
SELECT 'Minimal fix applied!' as result;