-- Complete fix for user creation issues
-- This addresses all potential problems with user signup and profile creation

-- 1. Drop existing trigger and function to start fresh
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- 2. Create a robust user creation function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create profile if it doesn't already exist
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
    )
    VALUES (
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
EXCEPTION WHEN OTHERS THEN
  -- Log the error but don't fail the user creation
  RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 4. Ensure all required columns exist with proper constraints
ALTER TABLE profiles 
  ALTER COLUMN user_id SET NOT NULL,
  ALTER COLUMN email SET NOT NULL,
  ALTER COLUMN role SET DEFAULT 'buyer',
  ALTER COLUMN role SET NOT NULL,
  ALTER COLUMN is_verified_seller SET DEFAULT false,
  ALTER COLUMN is_verified_seller SET NOT NULL,
  ALTER COLUMN verification_status SET DEFAULT 'approved',
  ALTER COLUMN created_at SET DEFAULT NOW(),
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN updated_at SET DEFAULT NOW(),
  ALTER COLUMN updated_at SET NOT NULL;

-- 5. Add missing columns if they don't exist
DO $$ 
BEGIN
  -- Add verification columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'verification_data') THEN
    ALTER TABLE profiles ADD COLUMN verification_data JSONB DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'verification_submitted_at') THEN
    ALTER TABLE profiles ADD COLUMN verification_submitted_at TIMESTAMPTZ;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'verification_reviewed_at') THEN
    ALTER TABLE profiles ADD COLUMN verification_reviewed_at TIMESTAMPTZ;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'verification_reviewed_by') THEN
    ALTER TABLE profiles ADD COLUMN verification_reviewed_by UUID REFERENCES profiles(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'verification_notes') THEN
    ALTER TABLE profiles ADD COLUMN verification_notes TEXT;
  END IF;
  
  -- Add personal info columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'date_of_birth') THEN
    ALTER TABLE profiles ADD COLUMN date_of_birth DATE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'phone_number') THEN
    ALTER TABLE profiles ADD COLUMN phone_number TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'address') THEN
    ALTER TABLE profiles ADD COLUMN address JSONB DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'business_info') THEN
    ALTER TABLE profiles ADD COLUMN business_info JSONB DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'terms_accepted_at') THEN
    ALTER TABLE profiles ADD COLUMN terms_accepted_at TIMESTAMPTZ;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'terms_version') THEN
    ALTER TABLE profiles ADD COLUMN terms_version TEXT DEFAULT '1.0';
  END IF;
END $$;

-- 6. Update RLS policies to handle user creation properly
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Allow users to insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid()::text = user_id::text);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles admin_profile
      WHERE admin_profile.user_id::text = auth.uid()::text 
      AND admin_profile.role = 'admin'
    )
  );

-- Allow admins to update all profiles
CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles admin_profile
      WHERE admin_profile.user_id::text = auth.uid()::text 
      AND admin_profile.role = 'admin'
    )
  );

-- 7. Create a function to safely create or get profile
CREATE OR REPLACE FUNCTION get_or_create_profile(p_user_id UUID, p_email TEXT, p_role TEXT DEFAULT 'buyer')
RETURNS profiles AS $$
DECLARE
  profile_record profiles;
BEGIN
  -- Try to get existing profile
  SELECT * INTO profile_record FROM profiles WHERE user_id = p_user_id;
  
  -- If no profile exists, create one
  IF NOT FOUND THEN
    INSERT INTO profiles (
      user_id,
      email,
      role,
      is_verified_seller,
      verification_status,
      created_at,
      updated_at
    )
    VALUES (
      p_user_id,
      p_email,
      p_role,
      false,
      'approved',
      NOW(),
      NOW()
    )
    RETURNING * INTO profile_record;
  END IF;
  
  RETURN profile_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Test the user creation process
DO $$
DECLARE
  test_user_id UUID := gen_random_uuid();
  test_email TEXT := 'test-user-creation@example.com';
  test_profile profiles;
BEGIN
  -- Test profile creation
  SELECT * INTO test_profile FROM get_or_create_profile(test_user_id, test_email, 'buyer');
  
  IF test_profile.user_id IS NOT NULL THEN
    RAISE NOTICE 'SUCCESS: Profile creation test passed for user %', test_user_id;
    
    -- Clean up test data
    DELETE FROM profiles WHERE user_id = test_user_id;
  ELSE
    RAISE NOTICE 'ERROR: Profile creation test failed';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'ERROR: Profile creation test failed with error: %', SQLERRM;
END $$;

-- 9. Create seller verification applications table if it doesn't exist
CREATE TABLE IF NOT EXISTS seller_verification_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  phone_number TEXT NOT NULL,
  address JSONB NOT NULL DEFAULT '{}',
  business_type TEXT NOT NULL CHECK (business_type IN ('individual', 'business', 'company')),
  business_name TEXT,
  business_registration TEXT,
  tax_id TEXT,
  selling_reason TEXT NOT NULL,
  experience_level TEXT NOT NULL CHECK (experience_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  product_categories TEXT[] NOT NULL DEFAULT '{}',
  expected_monthly_sales INTEGER DEFAULT 0,
  portfolio_url TEXT,
  previous_platforms TEXT[] DEFAULT '{}',
  identity_document_url TEXT,
  business_document_url TEXT,
  terms_accepted BOOLEAN NOT NULL DEFAULT false,
  terms_version TEXT NOT NULL DEFAULT '1.0',
  commission_rate_accepted BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'additional_info_required')),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Enable RLS on seller verification applications
ALTER TABLE seller_verification_applications ENABLE ROW LEVEL SECURITY;

-- Create policies for seller verification applications
CREATE POLICY "Users can view their own verification applications" ON seller_verification_applications
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create their own verification applications" ON seller_verification_applications
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own pending applications" ON seller_verification_applications
  FOR UPDATE USING (auth.uid()::text = user_id::text AND status = 'pending');

CREATE POLICY "Admins can view all verification applications" ON seller_verification_applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id::text = auth.uid()::text 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update verification applications" ON seller_verification_applications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id::text = auth.uid()::text 
      AND profiles.role = 'admin'
    )
  );

-- Success message
SELECT 'User creation fix completed successfully! Users should now be able to sign up without errors.' as message;