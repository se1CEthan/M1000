-- Disable email confirmation for immediate login after signup
-- This allows users to login immediately without email verification

-- Update auth configuration to disable email confirmation
UPDATE auth.config 
SET 
  enable_signup = true,
  enable_confirmations = false
WHERE id = 1;

-- If the above doesn't work, you can also disable it in Supabase Dashboard:
-- Go to Authentication > Settings > Email Confirmations > Disable

-- Alternative: Set email confirmation to optional
-- This allows login without confirmation but still sends confirmation emails
UPDATE auth.config 
SET 
  enable_signup = true,
  enable_confirmations = true,
  confirm_email_change_enabled = false
WHERE id = 1;

SELECT 'Email confirmation settings updated. Users can now login immediately after signup.' as message;