-- SIMPLE WORKING FIX - Run each statement one by one
-- Copy and paste each section separately in Supabase SQL Editor

-- 1. Add missing column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'approved';

-- 2. Set column defaults
ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'buyer';
ALTER TABLE profiles ALTER COLUMN is_verified_seller SET DEFAULT false;

-- 3. Update NULL values (run each UPDATE separately)
UPDATE profiles SET role = 'buyer' WHERE role IS NULL;

UPDATE profiles SET is_verified_seller = false WHERE is_verified_seller IS NULL;

UPDATE profiles SET verification_status = 'approved' WHERE verification_status IS NULL;

-- 4. Drop existing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- 5. Create simple trigger function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id,
    email,
    full_name,
    role,
    is_verified_seller,
    verification_status
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'buyer'),
    false,
    'approved'
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 7. Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 8. Create basic policies (drop existing first)
DROP POLICY IF EXISTS "view_own_profile" ON profiles;
DROP POLICY IF EXISTS "update_own_profile" ON profiles;
DROP POLICY IF EXISTS "insert_own_profile" ON profiles;

CREATE POLICY "view_own_profile" ON profiles
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "update_own_profile" ON profiles
  FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "insert_own_profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Success message
SELECT 'User creation fix completed!' as message;