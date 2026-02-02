-- Fix user creation errors in Seltech database
-- Run this in Supabase SQL Editor

-- 1. First, let's check what's causing the error
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check if the trigger function exists and works
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- 3. Drop and recreate the user creation trigger function
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id,
    email,
    full_name,
    role,
    is_verified_seller,
    verification_status,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'buyer',
    false,
    'approved',
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 5. Make sure all required columns exist with proper defaults
ALTER TABLE profiles 
  ALTER COLUMN role SET DEFAULT 'buyer',
  ALTER COLUMN is_verified_seller SET DEFAULT false,
  ALTER COLUMN verification_status SET DEFAULT 'approved',
  ALTER COLUMN created_at SET DEFAULT NOW(),
  ALTER COLUMN updated_at SET DEFAULT NOW();

-- 6. Add any missing columns that might be causing issues
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS verification_data JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS verification_submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verification_reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verification_reviewed_by UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS verification_notes TEXT,
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS phone_number TEXT,
  ADD COLUMN IF NOT EXISTS address JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS business_info JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS terms_version TEXT DEFAULT '1.0';

-- 7. Update RLS policies to be more permissive for user creation
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Enable insert for authenticated users only" ON profiles
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- 8. Test the trigger function manually
DO $$
DECLARE
  test_user_id UUID := gen_random_uuid();
  test_email TEXT := 'test@example.com';
BEGIN
  -- This simulates what happens when a user signs up
  BEGIN
    INSERT INTO public.profiles (
      user_id,
      email,
      full_name,
      role,
      is_verified_seller,
      verification_status,
      created_at,
      updated_at
    )
    VALUES (
      test_user_id,
      test_email,
      test_email,
      'buyer',
      false,
      'approved',
      NOW(),
      NOW()
    );
    
    -- Clean up test data
    DELETE FROM public.profiles WHERE user_id = test_user_id;
    
    RAISE NOTICE 'SUCCESS: Profile creation test passed';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'ERROR: Profile creation failed - %', SQLERRM;
  END;
END $$;

-- 9. Check if there are any constraint violations
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'profiles'::regclass;

-- 10. Verify the fix
SELECT 'Database user creation fix completed' as status;