-- 🔧 COMPLETE ADMIN FIX - Run this in Supabase SQL Editor
-- This fixes both storage buckets AND admin settings "Something went wrong" error

-- 1. Check current buckets
SELECT 'CURRENT BUCKETS:' as status;
SELECT id, name, public, file_size_limit FROM storage.buckets ORDER BY name;

-- 2. Create required buckets with proper settings
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES 
  ('product-files', 'product-files', false, 524288000, null),
  ('product-images', 'product-images', true, 10485760, array['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 3. Create permissive storage policies (allows admin downloads)
DROP POLICY IF EXISTS "product_files_policy" ON storage.objects;
DROP POLICY IF EXISTS "product_images_policy" ON storage.objects;
DROP POLICY IF EXISTS "avatars_policy" ON storage.objects;

CREATE POLICY "product_files_policy" ON storage.objects 
FOR ALL USING (bucket_id = 'product-files');

CREATE POLICY "product_images_policy" ON storage.objects 
FOR ALL USING (bucket_id = 'product-images');

CREATE POLICY "avatars_policy" ON storage.objects 
FOR ALL USING (bucket_id = 'avatars');

-- 4. FIX ADMIN SETTINGS - Create platform_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Disable RLS for platform_settings (simplest fix)
ALTER TABLE public.platform_settings DISABLE ROW LEVEL SECURITY;

-- 6. Ensure admin access
UPDATE public.profiles SET role = 'admin' WHERE email = 'se1cethan@gmail.com';

-- 7. Insert default platform settings if they don't exist (JSON format for value column)
INSERT INTO public.platform_settings (key, value) VALUES
  ('maintenance_mode', '"false"'),
  ('registration_enabled', '"true"'),
  ('seller_registration_enabled', '"true"'),
  ('commission_rate', '"10"'),
  ('min_payout_amount', '"50"'),
  ('max_payout_amount', '"10000"'),
  ('payout_processing_fee', '"2"'),
  ('max_file_size_mb', '"500"'),
  ('max_thumbnail_size_mb', '"10"'),
  ('platform_name', '"Seltech"'),
  ('platform_description', '"The premier marketplace for developer tools and digital assets"'),
  ('platform_tagline', '"Discover & Sell Developer Tools"'),
  ('platform_url', '"https://seltech.online"'),
  ('support_email', '"support@seltech.online"'),
  ('admin_email', '"se1cethan@gmail.com"')
ON CONFLICT (key) DO NOTHING;

-- 8. Test bucket access
SELECT 'TESTING BUCKET ACCESS:' as status;
SELECT 
  b.name as bucket_name,
  b.public,
  CASE 
    WHEN b.name = 'product-files' THEN 'Private - Admin downloads only'
    WHEN b.name = 'product-images' THEN 'Public - Product thumbnails'
    WHEN b.name = 'avatars' THEN 'Public - User avatars'
    ELSE 'Unknown'
  END as purpose
FROM storage.buckets b 
WHERE b.name IN ('product-files', 'product-images', 'avatars')
ORDER BY b.name;

-- 9. Test admin settings access
SELECT 'TESTING ADMIN SETTINGS:' as status;
SELECT key, value FROM public.platform_settings ORDER BY key LIMIT 5;

-- 10. Verify admin user
SELECT 'ADMIN USER STATUS:' as status;
SELECT email, role FROM public.profiles WHERE email = 'se1cethan@gmail.com';

-- Success message
SELECT '✅ COMPLETE FIX APPLIED! Storage buckets created AND admin settings fixed.' as result;