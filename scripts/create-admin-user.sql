-- Create admin user function (if it doesn't exist)
CREATE OR REPLACE FUNCTION create_admin_user(admin_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_exists BOOLEAN;
  profile_exists BOOLEAN;
BEGIN
  -- Check if user exists in auth.users
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = admin_email) INTO user_exists;
  
  IF NOT user_exists THEN
    RAISE NOTICE 'User with email % does not exist in auth.users. Please sign up first.', admin_email;
    RETURN FALSE;
  END IF;
  
  -- Check if profile exists
  SELECT EXISTS(SELECT 1 FROM profiles WHERE email = admin_email) INTO profile_exists;
  
  IF profile_exists THEN
    -- Update existing profile to admin
    UPDATE profiles 
    SET 
      role = 'admin',
      is_verified_seller = true,
      verification_status = 'approved',
      updated_at = NOW()
    WHERE email = admin_email;
    
    RAISE NOTICE 'Updated existing user % to admin role', admin_email;
  ELSE
    -- Create new profile with admin role
    INSERT INTO profiles (
      user_id,
      email,
      role,
      is_verified_seller,
      verification_status,
      created_at,
      updated_at
    )
    SELECT 
      id,
      admin_email,
      'admin',
      true,
      'approved',
      NOW(),
      NOW()
    FROM auth.users 
    WHERE email = admin_email;
    
    RAISE NOTICE 'Created new admin profile for %', admin_email;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Use the function to create/update admin user
SELECT create_admin_user('se1cethan@gmail.com');

-- Verify the result
SELECT 
  id,
  user_id,
  email,
  role,
  is_verified_seller,
  verification_status
FROM profiles 
WHERE email = 'se1cethan@gmail.com';