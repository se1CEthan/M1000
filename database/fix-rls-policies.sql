-- Fix Row Level Security Policies for Product Upload
-- This script fixes RLS policy violations when uploading products

-- First, let's check and fix the products table policies
DROP POLICY IF EXISTS "Users can view approved products" ON products;
DROP POLICY IF EXISTS "Sellers can view their own products" ON products;
DROP POLICY IF EXISTS "Sellers can insert their own products" ON products;
DROP POLICY IF EXISTS "Sellers can update their own products" ON products;
DROP POLICY IF EXISTS "Admins can manage all products" ON products;

-- Create comprehensive RLS policies for products table
CREATE POLICY "Public can view approved products" ON products
  FOR SELECT USING (status = 'approved');

CREATE POLICY "Sellers can view their own products" ON products
  FOR SELECT USING (
    auth.uid()::text = seller_id::text OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role IN ('admin', 'seller')
    )
  );

CREATE POLICY "Sellers can insert their own products" ON products
  FOR INSERT WITH CHECK (
    auth.uid()::text = seller_id::text AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role IN ('seller', 'admin')
      AND profiles.is_verified_seller = true
    )
  );

CREATE POLICY "Sellers can update their own products" ON products
  FOR UPDATE USING (
    auth.uid()::text = seller_id::text AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role IN ('seller', 'admin')
    )
  );

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

CREATE POLICY "Buyers can view their own orders" ON orders
  FOR SELECT USING (auth.uid()::text = buyer_id::text);

CREATE POLICY "Sellers can view orders for their products" ON orders
  FOR SELECT USING (auth.uid()::text = seller_id::text);

CREATE POLICY "Admins can view all orders" ON orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can create orders" ON orders
  FOR INSERT WITH CHECK (auth.uid()::text = buyer_id::text);

CREATE POLICY "System can update orders" ON orders
  FOR UPDATE USING (true);

-- Fix storage policies for file uploads
-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing storage policies
DROP POLICY IF EXISTS "Users can upload their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own files" ON storage.objects;
DROP POLICY IF EXISTS "Sellers can upload product files" ON storage.objects;
DROP POLICY IF EXISTS "Public can view approved product images" ON storage.objects;

-- Create storage policies
CREATE POLICY "Sellers can upload product files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'product-files' AND
    auth.uid()::text = (storage.foldername(name))[1] AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role IN ('seller', 'admin')
    )
  );

CREATE POLICY "Sellers can view their own product files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'product-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Public can view product images" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Users can upload product images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'product-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can upload avatars" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'user-avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Public can view avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'user-avatars');

-- Create function to automatically set seller_id on product insert
CREATE OR REPLACE FUNCTION set_seller_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Set seller_id to the current user's ID
  NEW.seller_id = auth.uid();
  
  -- Set default status to pending
  IF NEW.status IS NULL THEN
    NEW.status = 'pending';
  END IF;
  
  -- Set timestamps
  NEW.created_at = NOW();
  NEW.updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically set seller_id
DROP TRIGGER IF EXISTS set_seller_id_trigger ON products;
CREATE TRIGGER set_seller_id_trigger
  BEFORE INSERT ON products
  FOR EACH ROW
  EXECUTE FUNCTION set_seller_id();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Grant necessary permissions
GRANT ALL ON products TO authenticated;
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON orders TO authenticated;

-- Grant storage permissions
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;

-- Create storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('product-files', 'product-files', false),
  ('product-images', 'product-images', true),
  ('user-avatars', 'user-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Success message
SELECT 'RLS policies fixed successfully! Users can now upload products.' as message;

-- Display current policies for verification
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('products', 'profiles', 'orders')
ORDER BY tablename, policyname;