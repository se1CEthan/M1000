-- Simple RLS Fix for Product Upload
-- This script fixes the most common RLS policy violations

-- Fix products table policies
DROP POLICY IF EXISTS "Users can view approved products" ON products;
DROP POLICY IF EXISTS "Sellers can view their own products" ON products;
DROP POLICY IF EXISTS "Sellers can insert their own products" ON products;
DROP POLICY IF EXISTS "Sellers can update their own products" ON products;
DROP POLICY IF EXISTS "Admins can manage all products" ON products;

-- Create simple, working RLS policies
CREATE POLICY "Public can view approved products" ON products
  FOR SELECT USING (status = 'approved');

CREATE POLICY "Sellers can view their own products" ON products
  FOR SELECT USING (auth.uid()::text = seller_id::text);

CREATE POLICY "Sellers can insert their own products" ON products
  FOR INSERT WITH CHECK (auth.uid()::text = seller_id::text);

CREATE POLICY "Sellers can update their own products" ON products
  FOR UPDATE USING (auth.uid()::text = seller_id::text);

CREATE POLICY "Admins can manage all products" ON products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Fix profiles table policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Fix orders table policies
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
DROP POLICY IF EXISTS "Sellers can view orders for their products" ON orders;
DROP POLICY IF EXISTS "Users can create orders" ON orders;
DROP POLICY IF EXISTS "Buyers can view their own orders" ON orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
DROP POLICY IF EXISTS "System can update orders" ON orders;

CREATE POLICY "Buyers can view their own orders" ON orders
  FOR SELECT USING (auth.uid()::text = buyer_id::text);

CREATE POLICY "Sellers can view orders for their products" ON orders
  FOR SELECT USING (auth.uid()::text = seller_id::text);

CREATE POLICY "Users can create orders" ON orders
  FOR INSERT WITH CHECK (auth.uid()::text = buyer_id::text);

CREATE POLICY "System can update orders" ON orders
  FOR UPDATE USING (true);

-- Grant necessary permissions
GRANT ALL ON products TO authenticated;
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON orders TO authenticated;

-- Success message
SELECT 'Simple RLS policies applied successfully!' as message;