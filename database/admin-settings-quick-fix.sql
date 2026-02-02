-- Quick fix for admin settings RLS issue
-- This allows admins to save platform settings

-- Create admin policy for platform_settings if it doesn't exist
DO $$
BEGIN
  -- Check if the policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'platform_settings' 
    AND policyname = 'Admins can manage platform settings'
  ) THEN
    -- Create the policy
    EXECUTE 'CREATE POLICY "Admins can manage platform settings" 
    ON public.platform_settings FOR ALL 
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.user_id = auth.uid() 
        AND profiles.role = ''admin''
      )
    )';
  END IF;
END $$;

-- Ensure se1cethan@gmail.com is admin (your admin account)
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'se1cethan@gmail.com';

-- Alternative: Temporarily disable RLS for platform_settings (if above doesn't work)
-- ALTER TABLE public.platform_settings DISABLE ROW LEVEL SECURITY;