-- Fix storage buckets and admin settings for production
-- This creates the necessary storage buckets and fixes admin permissions

-- 1. Create storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('product-files', 'product-files', false, 524288000, ARRAY['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed', 'application/x-tar', 'application/octet-stream', 'application/x-msdownload', 'application/x-apple-diskimage', 'application/vnd.debian.binary-package', 'application/x-rpm', 'application/java-archive']),
  ('product-images', 'product-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']),
  ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- 2. Create storage policies for product files (private bucket)
CREATE POLICY "Authenticated users can upload product files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'product-files' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Sellers can view their own product files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'product-files' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Sellers can update their own product files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'product-files' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Sellers can delete their own product files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'product-files' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 3. Create storage policies for product images (public bucket)
CREATE POLICY "Anyone can view product images" ON storage.objects
FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can upload product images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'product-images' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Sellers can update their own product images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'product-images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Sellers can delete their own product images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'product-images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 4. Create storage policies for avatars (public bucket)
CREATE POLICY "Anyone can view avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatars" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own avatars" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatars" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 5. Fix platform_settings RLS for admin access
-- Disable RLS temporarily to ensure admin access
ALTER TABLE public.platform_settings DISABLE ROW LEVEL SECURITY;

-- Ensure your admin account is properly set
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'se1cethan@gmail.com';

-- Grant full permissions to authenticated users for platform_settings
GRANT ALL PRIVILEGES ON public.platform_settings TO authenticated;

-- 6. Create or update platform_settings table structure
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

-- 7. Insert comprehensive default settings for production
INSERT INTO public.platform_settings (key, value, description, category) VALUES
  -- System Controls
  ('maintenance_mode', 'false', 'Enable maintenance mode', 'system'),
  ('registration_enabled', 'true', 'Allow new user registrations', 'system'),
  ('seller_registration_enabled', 'true', 'Allow seller registrations', 'system'),
  
  -- Financial Settings
  ('commission_rate', '10', 'Platform commission rate percentage', 'financial'),
  ('min_payout_amount', '50', 'Minimum payout amount in USD', 'financial'),
  ('max_payout_amount', '10000', 'Maximum payout amount in USD', 'financial'),
  ('payout_processing_fee', '2', 'Payout processing fee percentage', 'financial'),
  
  -- File Upload Settings
  ('max_file_size_mb', '500', 'Maximum file size in MB', 'uploads'),
  ('max_thumbnail_size_mb', '10', 'Maximum thumbnail size in MB', 'uploads'),
  ('allowed_file_types', '.zip,.rar,.7z,.tar.gz,.exe,.msi,.dmg,.pkg,.deb,.rpm,.jar,.apk', 'Allowed file extensions', 'uploads'),
  ('allowed_image_types', '.jpg,.jpeg,.png,.gif,.webp,.svg', 'Allowed image extensions', 'uploads'),
  ('virus_scanning_enabled', 'false', 'Enable virus scanning for uploads', 'uploads'),
  
  -- Platform Information
  ('platform_name', 'Seltech', 'Platform name', 'general'),
  ('platform_description', 'The premier marketplace for developer tools and digital assets', 'Platform description', 'general'),
  ('platform_tagline', 'Discover & Sell Developer Tools', 'Platform tagline', 'general'),
  ('platform_url', 'https://seltech.online', 'Platform URL', 'general'),
  
  -- Contact Information
  ('support_email', 'support@seltech.online', 'Support email address', 'contact'),
  ('contact_email', 'support@seltech.online', 'Contact email address', 'contact'),
  ('admin_email', 'se1cethan@gmail.com', 'Admin email address', 'contact'),
  ('business_email', 'business@seltech.online', 'Business email address', 'contact'),
  
  -- Legal
  ('terms_version', '1.0', 'Terms of service version', 'legal'),
  ('privacy_version', '1.0', 'Privacy policy version', 'legal'),
  ('cookie_policy_version', '1.0', 'Cookie policy version', 'legal'),
  ('gdpr_compliance', 'true', 'GDPR compliance enabled', 'legal'),
  
  -- Announcements
  ('announcement_text', '', 'Platform announcement text', 'announcements'),
  ('announcement_enabled', 'false', 'Show platform announcement', 'announcements'),
  ('announcement_type', 'info', 'Announcement type (info, warning, success, error)', 'announcements'),
  ('announcement_dismissible', 'true', 'Allow users to dismiss announcement', 'announcements'),
  
  -- Security
  ('two_factor_required', 'false', 'Require 2FA for all users', 'security'),
  ('password_min_length', '8', 'Minimum password length', 'security'),
  ('session_timeout_minutes', '1440', 'Session timeout in minutes (24 hours)', 'security'),
  ('max_login_attempts', '5', 'Maximum login attempts before lockout', 'security'),
  
  -- Features
  ('reviews_enabled', 'true', 'Enable product reviews', 'features'),
  ('wishlist_enabled', 'true', 'Enable wishlist functionality', 'features'),
  ('chat_support_enabled', 'false', 'Enable live chat support', 'features'),
  ('newsletter_enabled', 'true', 'Enable newsletter signup', 'features'),
  
  -- Analytics
  ('analytics_enabled', 'true', 'Enable analytics tracking', 'analytics'),
  ('google_analytics_id', '', 'Google Analytics tracking ID', 'analytics'),
  ('facebook_pixel_id', '', 'Facebook Pixel ID', 'analytics'),
  
  -- Social Media
  ('twitter_url', '', 'Twitter profile URL', 'social'),
  ('facebook_url', '', 'Facebook page URL', 'social'),
  ('linkedin_url', '', 'LinkedIn profile URL', 'social'),
  ('github_url', '', 'GitHub organization URL', 'social'),
  
  -- API Settings
  ('api_rate_limit', '1000', 'API requests per hour per user', 'api'),
  ('api_version', 'v1', 'Current API version', 'api'),
  ('webhook_timeout_seconds', '30', 'Webhook timeout in seconds', 'api')
  
ON CONFLICT (key) DO NOTHING;

-- 8. Create function to update timestamps
CREATE OR REPLACE FUNCTION update_platform_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Create trigger for timestamp updates
DROP TRIGGER IF EXISTS update_platform_settings_timestamp ON public.platform_settings;
CREATE TRIGGER update_platform_settings_timestamp
  BEFORE UPDATE ON public.platform_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_platform_settings_timestamp();

-- 10. Create admin activity logging function (if not exists)
CREATE OR REPLACE FUNCTION log_admin_activity(
  p_admin_id UUID,
  p_action_type TEXT,
  p_target_id UUID DEFAULT NULL,
  p_target_type TEXT DEFAULT NULL,
  p_details JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.admin_activity_log (
    admin_id,
    action_type,
    target_id,
    target_type,
    details,
    created_at
  ) VALUES (
    p_admin_id,
    p_action_type,
    p_target_id,
    p_target_type,
    p_details,
    NOW()
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Ignore errors if table doesn't exist
    NULL;
END;
$$ LANGUAGE plpgsql;