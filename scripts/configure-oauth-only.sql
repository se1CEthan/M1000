-- Configure Supabase to only allow OAuth authentication
-- This script should be run in your Supabase SQL Editor

-- First, let's check current auth settings
SELECT * FROM auth.config;

-- Update auth configuration to disable email/password signup
-- Note: This requires Supabase CLI or direct database access
-- You'll need to configure this in your Supabase Dashboard under Authentication > Settings

-- Create a function to ensure users can only be created via OAuth
CREATE OR REPLACE FUNCTION public.check_oauth_only()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the user was created via OAuth (has provider info)
  IF NEW.raw_app_meta_data IS NULL OR 
     NEW.raw_app_meta_data->>'provider' IS NULL OR
     NEW.raw_app_meta_data->>'provider' = 'email' THEN
    RAISE EXCEPTION 'Email/password authentication is disabled. Please use OAuth providers (Google, GitHub, Discord, Twitch, or Apple).';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to enforce OAuth-only authentication
DROP TRIGGER IF EXISTS enforce_oauth_only ON auth.users;
CREATE TRIGGER enforce_oauth_only
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.check_oauth_only();

-- Update existing email users to prevent login (optional - be careful with this)
-- UPDATE auth.users 
-- SET email_confirmed_at = NULL, 
--     confirmation_token = gen_random_uuid()::text
-- WHERE raw_app_meta_data->>'provider' = 'email' OR raw_app_meta_data->>'provider' IS NULL;

-- Create a view to show only OAuth users
CREATE OR REPLACE VIEW public.oauth_users AS
SELECT 
  id,
  email,
  raw_app_meta_data->>'provider' as provider,
  raw_user_meta_data->>'full_name' as full_name,
  raw_user_meta_data->>'avatar_url' as avatar_url,
  created_at,
  last_sign_in_at
FROM auth.users
WHERE raw_app_meta_data->>'provider' IN ('google', 'github')
ORDER BY created_at DESC;

-- Grant access to the view
GRANT SELECT ON public.oauth_users TO authenticated;
GRANT SELECT ON public.oauth_users TO service_role;

COMMENT ON VIEW public.oauth_users IS 'View showing only users authenticated via OAuth providers';
COMMENT ON FUNCTION public.check_oauth_only() IS 'Ensures only OAuth authentication is allowed';