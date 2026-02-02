-- EMERGENCY FIX - Just the essentials to get things working

-- 1. FIX ADMIN SETTINGS RLS ISSUE
ALTER TABLE public.platform_settings DISABLE ROW LEVEL SECURITY;
UPDATE public.profiles SET role = 'admin' WHERE email = 'se1cethan@gmail.com';
GRANT ALL PRIVILEGES ON public.platform_settings TO authenticated;

-- 2. CREATE STORAGE BUCKETS (fixes "Bucket not found" error)
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('product-files', 'product-files', false),
  ('product-images', 'product-images', true),
  ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 3. BASIC STORAGE POLICIES
DO $$
BEGIN
  CREATE POLICY "Allow all for product-files" ON storage.objects FOR ALL USING (bucket_id = 'product-files');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Allow all for product-images" ON storage.objects FOR ALL USING (bucket_id = 'product-images');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Allow all for avatars" ON storage.objects FOR ALL USING (bucket_id = 'avatars');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- SUCCESS
SELECT '✅ Emergency fix applied! Try admin settings and downloads now.' as status;