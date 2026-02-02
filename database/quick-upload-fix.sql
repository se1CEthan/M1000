-- Quick Upload Fix - Run this first
-- This fixes the immediate upload permission issue

-- 1. Make sure your user has the right role
UPDATE profiles 
SET role = 'seller', is_verified_seller = true 
WHERE user_id = auth.uid();

-- 2. Simple product insert policy (allows any authenticated user to insert)
DROP POLICY IF EXISTS "Anyone can insert products" ON products;
CREATE POLICY "Anyone can insert products" ON products
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 3. Allow users to view their own products
DROP POLICY IF EXISTS "Users can view own products" ON products;
CREATE POLICY "Users can view own products" ON products
  FOR SELECT USING (auth.uid()::text = seller_id::text OR status = 'approved');

-- 4. Allow users to update their own products
DROP POLICY IF EXISTS "Users can update own products" ON products;
CREATE POLICY "Users can update own products" ON products
  FOR UPDATE USING (auth.uid()::text = seller_id::text);

-- Success
SELECT 'Quick upload fix applied! Try uploading now.' as message;