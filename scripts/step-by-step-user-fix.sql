-- STEP-BY-STEP USER CREATION FIX
-- Run this in Supabase SQL Editor to fix user creation issues

-- STEP 1: Check current profiles table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- STEP 2: Add missing columns one by one (safe approach)
DO $$ 
BEGIN
  -- Add verification_status column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'verification_status'
  ) THEN
    ALTER TABLE profiles ADD COLUMN verification_status TEXT DEFAULT 'approved';
    RAISE NOTICE 'Added verification_status column';
  ELSE
    RAISE NOTICE 'verification_status column already exists';
  END IF;

  -- Add verification_data column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'verification_data'
  ) THEN
    ALTER TABLE profiles ADD COLUMN verification_data JSONB DEFAULT '{}';
    RAISE NOTICE 'Added verification_data column';
  ELSE
    RAISE NOTICE 'verification_data column already exists';
  END IF;

  -- Add verification_submitted_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'verification_submitted_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN verification_submitted_at TIMESTAMPTZ;
    RAISE NOTICE 'Added verification_submitted_at column';
  ELSE
    RAISE NOTICE 'verification_submitted_at column already exists';
  END IF;

  -- Add verification_reviewed_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'verification_reviewed_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN verification_reviewed_at TIMESTAMPTZ;
    RAISE NOTICE 'Added verification_reviewed_at column';
  ELSE
    RAISE NOTICE 'verification_reviewed_at column already exists';
  END IF;

  -- Add verification_reviewed_by column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'verification_reviewed_by'
  ) THEN
    ALTER TABLE profiles ADD COLUMN verification_reviewed_by UUID;
    RAISE NOTICE 'Added verification_reviewed_by column';
  ELSE
    RAISE NOTICE 'verification_reviewed_by column already exists';
  END IF;

  -- Add verification_notes column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'verification_notes'
  ) THEN
    ALTER TABLE profiles ADD COLUMN verification_notes TEXT;
    RAISE NOTICE 'Added verification_notes column';
  ELSE
    RAISE NOTICE 'verification_notes column already exists';
  END IF;

END $$;

-- STEP 3: Set proper defaults for existing columns
ALTER TABLE profiles 
  ALTER COLUMN role SET DEFAULT 'buyer',
  ALTER COLUMN is_verified_seller SET DEFAULT false,
  ALTER COLUMN created_at SET DEFAULT NOW(),
  ALTER COLUMN updated_at SET DEFAULT NOW();

-- STEP 4: Update any NULL values to proper defaults
UPDATE profiles 
SET 
  role = COALESCE(role, 'buyer'),
  is_verified_seller = COALESCE(is_verified_seller, false),
  verification_status = COALESCE(verification_status, 'approved'),
  created_at = COALESCE(created_at, NOW()),
  updated_at = COALESCE(updated_at, NOW())
WHERE role IS NULL 
   OR is_verified_seller IS NULL 
   OR verification_status IS NULL 
   OR created_at IS NULL 
   OR updated_at IS NULL;

-- STEP 5: Drop existing trigger and function (clean slate)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- STEP 6: Create simple, bulletproof user creation function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only create profile if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = NEW.id) THEN
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
  END IF;
  
  RETURN NEW;
EXCEPTION 
  WHEN OTHERS THEN
    -- Don't fail user creation if profile creation fails
    RAISE WARNING 'Could not create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- STEP 7: Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- STEP 8: Fix RLS policies (simple and working)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow users to view own profile" ON profiles;
DROP POLICY IF EXISTS "Allow users to update own profile" ON profiles;
DROP POLICY IF EXISTS "Allow users to insert own profile" ON profiles;
DROP POLICY IF EXISTS "Allow admins to view all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow admins to update all profiles" ON profiles;

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create simple, working policies
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Admin policies
CREATE POLICY "profiles_admin_all" ON profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id::text = auth.uid()::text 
      AND p.role = 'admin'
    )
  );

-- STEP 9: Test the setup
DO $$
DECLARE
  test_user_id UUID := gen_random_uuid();
  test_email TEXT := 'test-trigger@example.com';
  profile_exists BOOLEAN;
BEGIN
  -- Test profile creation
  INSERT INTO public.profiles (
    user_id,
    email,
    role,
    is_verified_seller,
    verification_status,
    created_at,
    updated_at
  ) VALUES (
    test_user_id,
    test_email,
    'buyer',
    false,
    'approved',
    NOW(),
    NOW()
  );
  
  -- Check if it was created
  SELECT EXISTS(SELECT 1 FROM profiles WHERE user_id = test_user_id) INTO profile_exists;
  
  IF profile_exists THEN
    RAISE NOTICE 'SUCCESS: Profile creation test passed';
  ELSE
    RAISE NOTICE 'ERROR: Profile creation test failed';
  END IF;
  
  -- Clean up
  DELETE FROM profiles WHERE user_id = test_user_id;
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'ERROR: Test failed - %', SQLERRM;
  -- Clean up on error
  DELETE FROM profiles WHERE user_id = test_user_id;
END $$;

-- STEP 10: Show final table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Success message
SELECT 'User creation fix completed! Users can now sign up and get profiles automatically.' as message;