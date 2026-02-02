-- SUPER SIMPLE FIX - Just run this!
-- This removes ALL restrictions for product uploads

-- Remove all existing policies
DROP POLICY IF EXISTS "Users can view approved products" ON products;
DROP POLICY IF EXISTS "Sellers can view their own products" ON products;
DROP POLICY IF EXISTS "Sellers can insert their own products" ON products;
DROP POLICY IF EXISTS "Sellers can update their own products" ON products;
DROP POLICY IF EXISTS "Admins can manage all products" ON products;
DROP POLICY IF EXISTS "Public can view approved products" ON products;
DROP POLICY IF EXISTS "Users can view own products" ON products;
DROP POLICY IF EXISTS "Users can update own products" ON products;
DROP POLICY IF EXISTS "Anyone can insert products" ON products;
DROP POLICY IF EXISTS "Allow all authenticated users to insert products" ON products;
DROP POLICY IF EXISTS "Allow all authenticated users to view products" ON products;
DROP POLICY IF EXISTS "Allow all authenticated users to update products" ON products;
DROP POLICY IF EXISTS "Allow all authenticated users to delete products" ON products;

-- Create ONE simple policy that allows everything
DROP POLICY IF EXISTS "allow_all" ON products;
CREATE POLICY "allow_all" ON products USING (true) WITH CHECK (true);

-- Make everyone a seller EXCEPT keep se1cethan@gmail.com as admin
UPDATE profiles 
SET role = 'seller', is_verified_seller = true 
WHERE email != 'se1cethan@gmail.com';

-- Ensure se1cethan@gmail.com stays as admin
UPDATE profiles 
SET role = 'admin', is_verified_seller = true 
WHERE email = 'se1cethan@gmail.com';

-- Grant permissions
GRANT ALL ON products TO authenticated;
GRANT ALL ON profiles TO authenticated;

-- Done!
SELECT 'DONE! Anyone can upload products now!' as result;
SELECT 'se1cethan@gmail.com is set as admin, everyone else is a seller!' as admin_info;