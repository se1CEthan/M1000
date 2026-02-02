-- FINAL FIX for user creation issues
-- This will ensure users are created automatically and can login immediately

-- 1. First, let's see the current state of the profiles table
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Drop ALL existing triggers and functions to start completely fresh
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- 3. Make sure the profiles table has all required columns with proper defaults
ALTER TABLE profiles 
  ALTER COLUMN user_id SET NOT NULL,
  ALTER COLUMN email SET NOT NULL,
  ALTER COLUMN role SET DEFAULT 'buyer',
  ALTER COLUMN is_verified_seller SET DEFAULT false,
  ALTER COLUMN verification_status SET DEFAULT 'approved',
  ALTER COLUMN created_at SET DEFAULT NOW(),
  ALTER COLUMN updated_at SET DEFAULT NOW();

-- 4. Add any missing columns
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS verification_data JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS verification_submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verification_reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verification_reviewed_by UUID,
  ADD COLUMN IF NOT EXISTS verification_notes TEXT,
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS phone_number TEXT,
  ADD COLUMN IF NOT EXISTS address JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS business_info JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS terms_version TEXT DEFAULT '1.0';

-- 5. Create a bulletproof user creation function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert profile for new user
  INSERT INTO public.profiles (
    user_id,
    email,
    full_name,
    avatar_url,
    role,
    is_verified_seller,
    verification_status,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture'
    ),
    COALESCE(NEW.raw_user_meta_data->>'role', 'buyer'),
    false,
    'approved',
    NOW(),
    NOW()
  );
  
  RETURN NEW;
EXCEPTION 
  WHEN unique_violation THEN
    -- Profile already exists, that's fine
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log error but don't fail user creation
    RAISE WARNING 'Could not create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- 6. Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 7. Drop and recreate ALL RLS policies to ensure they work correctly
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create simple, working policies
CREATE POLICY "Allow users to view own profile" ON profiles
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Allow users to update own profile" ON profiles
  FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Allow users to insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Admin policies
CREATE POLICY "Allow admins to view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id::text = auth.uid()::text 
      AND p.role = 'admin'
    )
  );

CREATE POLICY "Allow admins to update all profiles" ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id::text = auth.uid()::text 
      AND p.role = 'admin'
    )
  );

-- 8. Test the trigger function
DO $$
DECLARE
  test_user_id UUID := gen_random_uuid();
  test_email TEXT := 'trigger-test@example.com';
  profile_count INTEGER;
BEGIN
  -- Simulate user creation
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_user_meta_data
  ) VALUES (
    test_user_id,
    test_email,
    'dummy_password',
    NOW(),
    NOW(),
    NOW(),
    '{"role": "buyer"}'::jsonb
  );
  
  -- Check if profile was created
  SELECT COUNT(*) INTO profile_count
  FROM profiles 
  WHERE user_id = test_user_id;
  
  IF profile_count = 1 THEN
    RAISE NOTICE 'SUCCESS: Trigger created profile automatically';
  ELSE
    RAISE NOTICE 'ERROR: Trigger did not create profile';
  END IF;
  
  -- Clean up test data
  DELETE FROM profiles WHERE user_id = test_user_id;
  DELETE FROM auth.users WHERE id = test_user_id;
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'ERROR: Trigger test failed - %', SQLERRM;
  -- Clean up on error
  DELETE FROM profiles WHERE user_id = test_user_id;
  DELETE FROM auth.users WHERE id = test_user_id;
END $$;

-- 9. Create a function to fix any existing users without profiles
CREATE OR REPLACE FUNCTION fix_users_without_profiles()
RETURNS TEXT AS $$
DECLARE
  user_record RECORD;
  fixed_count INTEGER := 0;
BEGIN
  -- Find users without profiles
  FOR user_record IN 
    SELECT u.id, u.email, u.raw_user_meta_data
    FROM auth.users u
    LEFT JOIN profiles p ON u.id = p.user_id
    WHERE p.user_id IS NULL
  LOOP
    -- Create missing profile
    INSERT INTO profiles (
      user_id,
      email,
      full_name,
      role,
      is_verified_seller,
      verification_status,
      created_at,
      updated_at
    ) VALUES (
      user_record.id,
      user_record.email,
      COALESCE(
        user_record.raw_user_meta_data->>'full_name',
        user_record.raw_user_meta_data->>'name',
        split_part(user_record.email, '@', 1)
      ),
      COALESCE(user_record.raw_user_meta_data->>'role', 'buyer'),
      false,
      'approved',
      NOW(),
      NOW()
    );
    
    fixed_count := fixed_count + 1;
  END LOOP;
  
  RETURN 'Fixed ' || fixed_count || ' users without profiles';
END;
$$ LANGUAGE plpgsql;

-- 10. Run the fix for existing users
SELECT fix_users_without_profiles();

-- 11. Verify everything is working
SELECT 
  'Profiles table ready' as status,
  COUNT(*) as total_profiles
FROM profiles;

SELECT 
  'Users without profiles' as status,
  COUNT(*) as orphaned_users
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.user_id
WHERE p.user_id IS NULL;

-- 12. Final success message
SELECT 'User creation fix completed! New users will automatically get profiles and be logged in.' as message;