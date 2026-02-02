-- Simple Maintenance Mode Setup
-- Works with existing platform_settings table structure

-- Insert maintenance mode settings if they don't exist
INSERT INTO public.platform_settings (key, value, description, category, is_public)
VALUES 
  ('maintenance_mode', '"false"'::jsonb, 'Enable/disable maintenance mode for the entire platform', 'system', false),
  ('maintenance_message', '"We are currently performing scheduled maintenance. Please check back soon!"'::jsonb, 'Message displayed during maintenance mode', 'system', false),
  ('maintenance_estimated_time', '""'::jsonb, 'Estimated time when maintenance will be complete', 'system', false)
ON CONFLICT (key) DO NOTHING;

-- Verify the settings were created
SELECT 
  'Maintenance Mode Settings Added' as status,
  COUNT(*) as maintenance_settings_count
FROM public.platform_settings 
WHERE key IN ('maintenance_mode', 'maintenance_message', 'maintenance_estimated_time');

-- Show current maintenance settings
SELECT 
  key,
  value,
  description,
  created_at
FROM public.platform_settings
WHERE key IN ('maintenance_mode', 'maintenance_message', 'maintenance_estimated_time')
ORDER BY key;