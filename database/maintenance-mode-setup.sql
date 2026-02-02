-- Maintenance Mode System Setup
-- Creates platform settings table for admin control

-- Create platform_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  category TEXT DEFAULT 'general',
  is_public BOOLEAN DEFAULT false,
  updated_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_platform_settings_key ON public.platform_settings(key);
CREATE INDEX IF NOT EXISTS idx_platform_settings_updated ON public.platform_settings(updated_at);
CREATE INDEX IF NOT EXISTS idx_platform_settings_category ON public.platform_settings(category);

-- Disable RLS for admin access (temporary for setup)
ALTER TABLE public.platform_settings DISABLE ROW LEVEL SECURITY;
GRANT ALL ON public.platform_settings TO authenticated;
GRANT ALL ON public.platform_settings TO anon;

-- Insert default maintenance mode settings
INSERT INTO public.platform_settings (key, value, description, category, is_public)
VALUES 
  ('maintenance_mode', '"false"', 'Enable/disable maintenance mode for the entire platform', 'system', false),
  ('maintenance_message', '"We are currently performing scheduled maintenance. Please check back soon!"', 'Message displayed during maintenance mode', 'system', false),
  ('maintenance_estimated_time', '""', 'Estimated time when maintenance will be complete', 'system', false),
  ('site_title', '"SelTech Online"', 'Main site title', 'general', true),
  ('site_description', '"Digital Marketplace for Developers"', 'Site description for SEO', 'general', true),
  ('contact_email', '"support@seltech.online"', 'Contact email for support', 'general', true),
  ('max_file_size_mb', '"100"', 'Maximum file size for uploads in MB', 'system', false),
  ('commission_rate', '{"percentage": 10, "description": "Platform commission rate"}', 'Platform commission rate percentage', 'system', false)
ON CONFLICT (key) DO NOTHING;

-- Create function to update settings
CREATE OR REPLACE FUNCTION update_platform_setting(
  p_key TEXT,
  p_value TEXT,
  p_admin_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.platform_settings 
  SET 
    value = to_jsonb(p_value),
    updated_by = p_admin_id,
    updated_at = NOW()
  WHERE key = p_key;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Create function to get setting value
CREATE OR REPLACE FUNCTION get_platform_setting(p_key TEXT)
RETURNS TEXT AS $$
DECLARE
  result TEXT;
BEGIN
  SELECT (value #>> '{}') INTO result
  FROM public.platform_settings
  WHERE key = p_key;
  
  RETURN COALESCE(result, '');
END;
$$ LANGUAGE plpgsql;

-- Verify setup
SELECT 
  'Maintenance Mode System Setup Complete' as message,
  COUNT(*) as total_settings
FROM public.platform_settings;

-- Show current settings
SELECT 
  key,
  value,
  description,
  category,
  is_public,
  updated_at
FROM public.platform_settings
ORDER BY key;