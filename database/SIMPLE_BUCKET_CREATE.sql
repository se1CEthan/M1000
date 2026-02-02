-- 🚀 SIMPLE BUCKET CREATION - Manual method
-- If the previous script didn't work, try this simpler approach

-- Method 1: Direct INSERT (bypasses any functions that might not exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types, created_at, updated_at) 
VALUES 
  ('product-files', 'product-files', false, 524288000, null, now(), now()),
  ('product-images', 'product-images', true, 10485760, array['image/jpeg', 'image/png', 'image/gif', 'image/webp'], now(), now()),
  ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/gif', 'image/webp'], now(), now())
ON CONFLICT (id) DO NOTHING;

-- Verify buckets were created
SELECT 'BUCKETS CREATED:' as status;
SELECT id, name, public FROM storage.buckets WHERE name IN ('product-files', 'product-images', 'avatars');

-- Create simple storage policies
CREATE POLICY IF NOT EXISTS "Allow all access to product-files" ON storage.objects
FOR ALL USING (bucket_id = 'product-files');

CREATE POLICY IF NOT EXISTS "Allow all access to product-images" ON storage.objects
FOR ALL USING (bucket_id = 'product-images');

CREATE POLICY IF NOT EXISTS "Allow all access to avatars" ON storage.objects
FOR ALL USING (bucket_id = 'avatars');

-- Ensure admin access
UPDATE public.profiles SET role = 'admin' WHERE email = 'se1cethan@gmail.com';

-- Disable RLS on platform_settings
ALTER TABLE public.platform_settings DISABLE ROW LEVEL SECURITY;

SELECT '✅ SIMPLE BUCKET CREATION COMPLETE!' as result;