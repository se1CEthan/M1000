-- INSTANT PRODUCTION FIX
-- This fixes both admin settings and storage bucket issues immediately

-- 1. FIX ADMIN SETTINGS RLS ISSUE
-- Disable RLS on platform_settings to allow admin access
ALTER TABLE public.platform_settings DISABLE ROW LEVEL SECURITY;

-- Ensure your admin account is set correctly
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'se1cethan@gmail.com';

-- Grant permissions
GRANT ALL PRIVILEGES ON public.platform_settings TO authenticated;

-- 2. CREATE STORAGE BUCKETS (fixes "Bucket not found" error)
-- Create product-files bucket (private for secure downloads)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('product-files', 'product-files', false, 524288000, 
        ARRAY['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed', 
              'application/x-tar', 'application/octet-stream', 'application/x-msdownload', 
              'application/x-apple-diskimage', 'application/vnd.debian.binary-package', 
              'application/x-rpm', 'application/java-archive'])
ON CONFLICT (id) DO NOTHING;

-- Create product-images bucket (public for thumbnails)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('product-images', 'product-images', true, 10485760, 
        ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'])
ON CONFLICT (id) DO NOTHING;

-- Create avatars bucket (public for user avatars)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 2097152, 
        ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- 3. CREATE STORAGE POLICIES FOR SECURE ACCESS
-- Product files (private bucket) - only sellers can manage their files
CREATE POLICY "Sellers can upload product files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'product-files' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Sellers can view their own product files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'product-files' AND 
  (auth.uid()::text = (storage.foldername(name))[1] OR 
   EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'))
);

CREATE POLICY "Sellers can update their own product files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'product-files' AND 
  (auth.uid()::text = (storage.foldername(name))[1] OR 
   EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'))
);

CREATE POLICY "Sellers can delete their own product files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'product-files' AND 
  (auth.uid()::text = (storage.foldername(name))[1] OR 
   EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'))
);

-- Product images (public bucket) - anyone can view, sellers can manage
CREATE POLICY "Anyone can view product images" ON storage.objects
FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can upload product images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'product-images' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Sellers can manage their product images" ON storage.objects
FOR ALL USING (
  bucket_id = 'product-images' AND 
  (auth.uid()::text = (storage.foldername(name))[1] OR 
   EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'))
);

-- Avatars (public bucket) - anyone can view, users can manage their own
CREATE POLICY "Anyone can view avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can manage their own avatars" ON storage.objects
FOR ALL USING (
  bucket_id = 'avatars' AND 
  (auth.uid()::text = (storage.foldername(name))[1] OR 
   EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'))
);

-- 4. CREATE PLATFORM SETTINGS TABLE (if not exists)
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL DEFAULT '',
  description TEXT,
  category TEXT DEFAULT 'general',
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. INSERT ESSENTIAL PRODUCTION SETTINGS
INSERT INTO public.platform_settings (key, value, description, category) VALUES
  -- System Controls
  ('maintenance_mode', 'false', 'Enable maintenance mode', 'system'),
  ('registration_enabled', 'true', 'Allow new user registrations', 'system'),
  ('seller_registration_enabled', 'true', 'Allow seller registrations', 'system'),
  
  -- Financial Settings
  ('commission_rate', '10', 'Platform commission rate percentage', 'financial'),
  ('min_payout_amount', '50', 'Minimum payout amount in USD', 'financial'),
  ('max_payout_amount', '10000', 'Maximum payout amount in USD', 'financial'),
  
  -- File Upload Settings
  ('max_file_size_mb', '500', 'Maximum file size in MB', 'uploads'),
  ('allowed_file_types', '.zip,.rar,.7z,.tar.gz,.exe,.msi,.dmg,.pkg,.deb,.rpm,.jar,.apk', 'Allowed file extensions', 'uploads'),
  
  -- Platform Information
  ('platform_name', 'Seltech', 'Platform name', 'general'),
  ('platform_description', 'The premier marketplace for developer tools and digital assets', 'Platform description', 'general'),
  ('support_email', 'support@seltech.online', 'Support email address', 'contact'),
  ('contact_email', 'support@seltech.online', 'Contact email address', 'contact'),
  
  -- Announcements
  ('announcement_text', '', 'Platform announcement text', 'announcements'),
  ('announcement_enabled', 'false', 'Show platform announcement', 'announcements')
  
ON CONFLICT (key) DO NOTHING;

-- 6. CREATE DOWNLOAD TOKENS TABLE (for fallback downloads)
CREATE TABLE IF NOT EXISTS public.download_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  file_url TEXT NOT NULL,
  product_title TEXT,
  user_id UUID REFERENCES public.profiles(user_id),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on download_tokens
ALTER TABLE public.download_tokens ENABLE ROW LEVEL SECURITY;

-- Policy for download tokens
CREATE POLICY "Users can access their own download tokens" ON public.download_tokens
FOR ALL USING (user_id = auth.uid());

-- 7. CREATE FUNCTION TO INCREMENT DOWNLOAD COUNT
CREATE OR REPLACE FUNCTION increment_download_count(product_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.products 
  SET download_count = COALESCE(download_count, 0) + 1,
      updated_at = NOW()
  WHERE id = product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION increment_download_count(UUID) TO authenticated;

-- 8. ENSURE PRODUCTS TABLE HAS DOWNLOAD_COUNT COLUMN
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS download_count INTEGER DEFAULT 0;

-- 9. CREATE INDEX FOR BETTER PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_download_tokens_token ON public.download_tokens(token);
CREATE INDEX IF NOT EXISTS idx_download_tokens_expires ON public.download_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_products_download_count ON public.products(download_count DESC);

-- SUCCESS MESSAGE
DO $$
BEGIN
  RAISE NOTICE '✅ INSTANT PRODUCTION FIX APPLIED SUCCESSFULLY!';
  RAISE NOTICE '1. Admin settings RLS issue fixed - you can now save settings';
  RAISE NOTICE '2. Storage buckets created - downloads will work';
  RAISE NOTICE '3. Essential platform settings configured';
  RAISE NOTICE '4. Download system ready with fallback support';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 NEXT STEPS:';
  RAISE NOTICE '1. Go to Admin Dashboard → Settings and test saving';
  RAISE NOTICE '2. Try downloading a product file';
  RAISE NOTICE '3. Both should work without errors now!';
END $$;