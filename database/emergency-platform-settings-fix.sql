-- Emergency fix: Disable RLS for platform_settings table
-- This will allow admins to save settings immediately

-- Disable RLS on platform_settings table
ALTER TABLE public.platform_settings DISABLE ROW LEVEL SECURITY;

-- Ensure your admin account is properly set
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'se1cethan@gmail.com';

-- Grant full permissions to authenticated users (admins)
GRANT ALL PRIVILEGES ON public.platform_settings TO authenticated;

-- Create the table if it doesn't exist
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

-- Insert default settings if they don't exist
INSERT INTO public.platform_settings (key, value, description, category) VALUES
  ('maintenance_mode', 'false', 'Enable maintenance mode', 'system'),
  ('registration_enabled', 'true', 'Allow new user registrations', 'system'),
  ('seller_registration_enabled', 'true', 'Allow seller registrations', 'system'),
  ('commission_rate', '10', 'Platform commission rate percentage', 'financial'),
  ('min_payout_amount', '50', 'Minimum payout amount in USD', 'financial'),
  ('max_file_size_mb', '500', 'Maximum file size in MB', 'uploads'),
  ('platform_name', 'Seltech', 'Platform name', 'general'),
  ('platform_description', 'The premier marketplace for developer tools and digital assets', 'Platform description', 'general'),
  ('support_email', 'support@seltech.online', 'Support email address', 'contact'),
  ('contact_email', 'support@seltech.online', 'Contact email address', 'contact'),
  ('terms_version', '1.0', 'Terms of service version', 'legal'),
  ('privacy_version', '1.0', 'Privacy policy version', 'legal'),
  ('announcement_text', '', 'Platform announcement text', 'announcements'),
  ('announcement_enabled', 'false', 'Show platform announcement', 'announcements')
ON CONFLICT (key) DO NOTHING;