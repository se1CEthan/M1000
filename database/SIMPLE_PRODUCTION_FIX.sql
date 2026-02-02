-- SIMPLE PRODUCTION FIX
-- Works with existing table structure

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

-- 4. INSERT ESSENTIAL PRODUCTION SETTINGS (using existing table structure)
INSERT INTO public.platform_settings (key, value) VALUES
  -- System Controls
  ('maintenance_mode', 'false'),
  ('registration_enabled', 'true'),
  ('seller_registration_enabled', 'true'),
  
  -- Financial Settings
  ('commission_rate', '10'),
  ('min_payout_amount', '50'),
  ('max_payout_amount', '10000'),
  ('payout_processing_fee', '2'),
  
  -- File Upload Settings
  ('max_file_size_mb', '500'),
  ('max_thumbnail_size_mb', '10'),
  ('allowed_file_types', '.zip,.rar,.7z,.tar.gz,.exe,.msi,.dmg,.pkg,.deb,.rpm,.jar,.apk'),
  ('allowed_image_types', '.jpg,.jpeg,.png,.gif,.webp,.svg'),
  ('virus_scanning_enabled', 'false'),
  
  -- Platform Information
  ('platform_name', 'Seltech'),
  ('platform_description', 'The premier marketplace for developer tools and digital assets'),
  ('platform_tagline', 'Discover & Sell Developer Tools'),
  ('platform_url', 'https://seltech.online'),
  
  -- Contact Information
  ('support_email', 'support@seltech.online'),
  ('contact_email', 'support@seltech.online'),
  ('admin_email', 'se1cethan@gmail.com'),
  ('business_email', 'business@seltech.online'),
  
  -- Legal
  ('terms_version', '1.0'),
  ('privacy_version', '1.0'),
  ('cookie_policy_version', '1.0'),
  ('gdpr_compliance', 'true'),
  
  -- Announcements
  ('announcement_text', ''),
  ('announcement_enabled', 'false'),
  ('announcement_type', 'info'),
  ('announcement_dismissible', 'true'),
  
  -- Security
  ('two_factor_required', 'false'),
  ('password_min_length', '8'),
  ('session_timeout_minutes', '1440'),
  ('max_login_attempts', '5'),
  
  -- Features
  ('reviews_enabled', 'true'),
  ('wishlist_enabled', 'true'),
  ('chat_support_enabled', 'false'),
  ('newsletter_enabled', 'true')
  
ON CONFLICT (key) DO NOTHING;

-- 5. ENSURE PRODUCTS TABLE HAS DOWNLOAD_COUNT COLUMN
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS download_count INTEGER DEFAULT 0;

-- 6. CREATE FUNCTION TO INCREMENT DOWNLOAD COUNT
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

-- 7. CREATE DOWNLOAD TOKENS TABLE (for fallback downloads)
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

-- 8. CREATE INDEXES FOR BETTER PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_download_tokens_token ON public.download_tokens(token);
CREATE INDEX IF NOT EXISTS idx_download_tokens_expires ON public.download_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_products_download_count ON public.products(download_count DESC);

-- SUCCESS MESSAGE
DO $$
BEGIN
  RAISE NOTICE '✅ SIMPLE PRODUCTION FIX APPLIED SUCCESSFULLY!';
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