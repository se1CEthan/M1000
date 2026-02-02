-- =====================================================
-- Seltech Marketplace - Production Database Setup
-- =====================================================
-- Run this script in your Supabase SQL Editor for production setup

-- 1. Create all required storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('product-images', 'product-images', true),
  ('product-files', 'product-files', false),
  ('avatars', 'avatars', true),
  ('verification-documents', 'verification-documents', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Set up storage policies for product images (public)
CREATE POLICY "Anyone can view product images" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Sellers can upload product images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'product-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Sellers can update their product images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'product-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- 3. Set up storage policies for product files (private)
CREATE POLICY "Buyers can download purchased files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'product-files' AND
    (
      -- File owner can access
      auth.uid()::text = (storage.foldername(name))[1] OR
      -- Buyers who purchased can access (implement purchase check)
      EXISTS (
        SELECT 1 FROM orders o
        JOIN products p ON o.product_id = p.id
        WHERE o.buyer_id::text = auth.uid()::text
        AND o.status = 'completed'
        AND p.file_url LIKE '%' || name || '%'
      )
    )
  );

CREATE POLICY "Sellers can upload product files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'product-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- 4. Set up storage policies for avatars (public)
CREATE POLICY "Anyone can view avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- 5. Set up storage policies for verification documents (private)
CREATE POLICY "Users can upload their own verification documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'verification-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own verification documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'verification-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins can view all verification documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'verification-documents' AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id::text = auth.uid()::text 
      AND profiles.role = 'admin'
    )
  );

-- 6. Create production admin user function
CREATE OR REPLACE FUNCTION create_production_admin(admin_email TEXT)
RETURNS TEXT AS $$
DECLARE
  user_exists BOOLEAN;
  profile_exists BOOLEAN;
  result_message TEXT;
BEGIN
  -- Check if user exists in auth.users
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = admin_email) INTO user_exists;
  
  IF NOT user_exists THEN
    result_message := 'ERROR: User with email ' || admin_email || ' does not exist. Please sign up first.';
    RETURN result_message;
  END IF;
  
  -- Check if profile exists
  SELECT EXISTS(SELECT 1 FROM profiles WHERE email = admin_email) INTO profile_exists;
  
  IF profile_exists THEN
    -- Update existing profile to admin
    UPDATE profiles 
    SET 
      role = 'admin',
      is_verified_seller = true,
      verification_status = 'approved',
      updated_at = NOW()
    WHERE email = admin_email;
    
    result_message := 'SUCCESS: Updated user ' || admin_email || ' to admin role';
  ELSE
    -- Create new profile with admin role
    INSERT INTO profiles (
      user_id,
      email,
      role,
      is_verified_seller,
      verification_status,
      created_at,
      updated_at
    )
    SELECT 
      id,
      admin_email,
      'admin',
      true,
      'approved',
      NOW(),
      NOW()
    FROM auth.users 
    WHERE email = admin_email;
    
    result_message := 'SUCCESS: Created admin profile for ' || admin_email;
  END IF;
  
  RETURN result_message;
END;
$$ LANGUAGE plpgsql;

-- 7. Set up platform settings
INSERT INTO platform_settings (key, value) VALUES 
  ('commission_rate', '{"percentage": 10, "description": "Platform commission rate"}'),
  ('featured_products_limit', '{"limit": 6, "description": "Number of featured products to display"}'),
  ('max_file_size', '{"size_mb": 500, "description": "Maximum file size for product uploads"}'),
  ('supported_file_types', '{"types": [".zip", ".rar", ".7z", ".tar.gz", ".exe", ".dmg", ".pkg"], "description": "Supported file types for products"}'),
  ('verification_required', '{"enabled": true, "description": "Seller verification required"}'),
  ('auto_approve_products', '{"enabled": false, "description": "Automatically approve products without review"}')
ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value,
  updated_at = NOW();

-- 8. Create sample product categories (if needed)
INSERT INTO products (
  seller_id,
  title,
  slug,
  description,
  short_description,
  category,
  tags,
  price,
  pricing_type,
  status,
  is_featured,
  created_at
) 
SELECT 
  p.id,
  'Sample Discord Bot',
  'sample-discord-bot-' || extract(epoch from now()),
  'A powerful Discord bot with moderation, music, and utility features. Perfect for server management and community engagement.',
  'Discord bot with moderation and music features',
  'bots',
  ARRAY['discord', 'moderation', 'music', 'utility'],
  29.99,
  'one_time',
  'approved',
  true,
  NOW()
FROM profiles p 
WHERE p.role = 'admin' 
LIMIT 1
ON CONFLICT DO NOTHING;

-- 9. Create indexes for better performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_category_status ON products(category, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_featured ON products(is_featured) WHERE is_featured = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_buyer_status ON orders(buyer_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_seller_status ON orders(seller_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_product_rating ON reviews(product_id, rating);

-- 10. Enable realtime for important tables
ALTER PUBLICATION supabase_realtime ADD TABLE products;
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE seller_verification_applications;
ALTER PUBLICATION supabase_realtime ADD TABLE product_reviews;

-- 11. Create production health check function
CREATE OR REPLACE FUNCTION production_health_check()
RETURNS TABLE (
  check_name TEXT,
  status TEXT,
  details TEXT
) AS $$
BEGIN
  -- Check if all required tables exist
  RETURN QUERY
  SELECT 
    'Required Tables'::TEXT,
    CASE WHEN COUNT(*) = 8 THEN 'PASS' ELSE 'FAIL' END::TEXT,
    'Found ' || COUNT(*) || ' of 8 required tables'::TEXT
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name IN ('profiles', 'products', 'orders', 'reviews', 'wishlists', 'disputes', 'payouts', 'platform_settings');
  
  -- Check if storage buckets exist
  RETURN QUERY
  SELECT 
    'Storage Buckets'::TEXT,
    CASE WHEN COUNT(*) = 4 THEN 'PASS' ELSE 'FAIL' END::TEXT,
    'Found ' || COUNT(*) || ' of 4 required buckets'::TEXT
  FROM storage.buckets 
  WHERE name IN ('product-images', 'product-files', 'avatars', 'verification-documents');
  
  -- Check if RLS is enabled
  RETURN QUERY
  SELECT 
    'Row Level Security'::TEXT,
    CASE WHEN COUNT(*) > 0 THEN 'PASS' ELSE 'FAIL' END::TEXT,
    'RLS enabled on ' || COUNT(*) || ' tables'::TEXT
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' 
  AND c.relrowsecurity = true;
  
  -- Check if admin user exists
  RETURN QUERY
  SELECT 
    'Admin User'::TEXT,
    CASE WHEN COUNT(*) > 0 THEN 'PASS' ELSE 'FAIL' END::TEXT,
    'Found ' || COUNT(*) || ' admin users'::TEXT
  FROM profiles 
  WHERE role = 'admin';
  
END;
$$ LANGUAGE plpgsql;

-- 12. Final verification
SELECT * FROM production_health_check();

-- Success message
SELECT 'Production database setup completed successfully!' as message;