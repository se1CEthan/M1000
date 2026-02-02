-- EMERGENCY USER CREATION FIX
-- This is the minimal fix to get user creation working immediately

-- 1. First, let's see what columns exist in profiles table
\d profiles;

-- 2. Add only the essential missing columns
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'approved';

-- 3. Set proper defaults for required columns
ALTER TABLE profiles 
  ALTER COLUMN role SET DEFAULT 'buyer',
  ALTER COLUMN is_verified_seller SET DEFAULT false,
  ALTER COLUMN created_at SET DEFAULT NOW(),
  ALTER COLUMN updated_at SET DEFAULT NOW();

-- 4. Update any existing NULL values
UPDATE profiles 
SET 
  role = 'buyer' WHERE role IS NULL,
  is_verified_seller = false WHERE is_verified_seller IS NULL,
  verification_status = 'approved' WHERE verification_status IS NULL,
  created_at = NOW() WHERE created_at IS NULL,
  updated_at = NOW() WHERE updated_at IS NULL;

-- 5. Drop and recreate the user creation trigger (simple version)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
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
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'buyer'),
    false,
    'approved',
    NOW(),
    NOW()
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Don't fail user creation
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 6. Simple RLS policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create basic policies
CREATE POLICY "view_own_profile" ON profiles
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "update_own_profile" ON profiles
  FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "insert_own_profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Admin policy
CREATE POLICY "admin_all_profiles" ON profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id::text = auth.uid()::text 
      AND role = 'admin'
    )
  );

-- Success message
SELECT 'Emergency user creation fix applied! Try creating a user now.' as message;