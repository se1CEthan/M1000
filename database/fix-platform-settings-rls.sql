-- Fix platform_settings RLS policies for admin access
-- This allows admins to insert/update platform settings

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Platform settings are readable by everyone" ON public.platform_settings;
DROP POLICY IF EXISTS "Admins can manage platform settings" ON public.platform_settings;

-- Create comprehensive RLS policies for platform_settings
-- 1. Everyone can read platform settings
CREATE POLICY "Platform settings are readable by everyone" 
ON public.platform_settings FOR SELECT 
USING (true);

-- 2. Only admins can insert/update/delete platform settings
CREATE POLICY "Admins can manage platform settings" 
ON public.platform_settings FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Ensure the table exists and has proper structure
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  description TEXT,
  category TEXT DEFAULT 'general',
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Insert default settings if they don't exist
INSERT INTO public.platform_settings (key, value, description, category) VALUES
  ('maintenance_mode', 'false', 'Enable maintenance mode', 'system'),
  ('registration_enabled', 'true', 'Allow new user registrations', 'system'),
  ('seller_registration_enabled', 'true', 'Allow seller registrations', 'system'),
  ('commission_rate', '10', 'Platform commission rate percentage', 'financial'),
  ('min_payout_amount', '50', 'Minimum payout amount in USD', 'financial'),
  ('max_file_size_mb', '500', 'Maximum file size in MB', 'uploads'),
  ('allowed_file_types', '[".zip", ".rar", ".tar.gz", ".exe", ".dmg", ".pkg"]', 'Allowed file extensions', 'uploads'),
  ('platform_name', 'Seltech', 'Platform name', 'general'),
  ('platform_description', 'The premier marketplace for developer tools and digital assets', 'Platform description', 'general'),
  ('support_email', 'support@seltech.online', 'Support email address', 'contact'),
  ('contact_email', 'support@seltech.online', 'Contact email address', 'contact'),
  ('terms_version', '1.0', 'Terms of service version', 'legal'),
  ('privacy_version', '1.0', 'Privacy policy version', 'legal'),
  ('announcement_text', '', 'Platform announcement text', 'announcements'),
  ('announcement_enabled', 'false', 'Show platform announcement', 'announcements')
ON CONFLICT (key) DO NOTHING;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_platform_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for timestamp updates
DROP TRIGGER IF EXISTS update_platform_settings_timestamp ON public.platform_settings;
CREATE TRIGGER update_platform_settings_timestamp
  BEFORE UPDATE ON public.platform_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_platform_settings_timestamp();

-- Grant necessary permissions
GRANT ALL ON public.platform_settings TO authenticated;
GRANT ALL ON public.platform_settings TO service_role;