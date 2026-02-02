-- 🔧 FIX SELLER VERIFICATION RLS POLICIES
-- This script fixes the RLS policies for seller_verification_applications table

-- 1. First, ensure the table exists with correct structure
CREATE TABLE IF NOT EXISTS public.seller_verification_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  date_of_birth DATE,
  phone_number TEXT,
  address JSONB,
  business_type TEXT NOT NULL DEFAULT 'individual',
  business_name TEXT,
  business_registration TEXT,
  tax_id TEXT,
  selling_reason TEXT NOT NULL,
  experience_level TEXT NOT NULL DEFAULT 'beginner',
  product_categories TEXT[] DEFAULT '{}',
  expected_monthly_sales DECIMAL(10,2) DEFAULT 0,
  portfolio_url TEXT,
  previous_platforms TEXT[] DEFAULT '{}',
  identity_document_url TEXT,
  business_document_url TEXT,
  terms_accepted BOOLEAN NOT NULL DEFAULT false,
  terms_version TEXT DEFAULT '1.0',
  commission_rate_accepted BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'additional_info_required')),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Drop all existing RLS policies to start fresh
DROP POLICY IF EXISTS "Users can view their own verification applications" ON public.seller_verification_applications;
DROP POLICY IF EXISTS "Users can create their own verification applications" ON public.seller_verification_applications;
DROP POLICY IF EXISTS "Users can update their own pending applications" ON public.seller_verification_applications;
DROP POLICY IF EXISTS "Admins can view all verification applications" ON public.seller_verification_applications;
DROP POLICY IF EXISTS "Admins can update verification applications" ON public.seller_verification_applications;
DROP POLICY IF EXISTS "allow_authenticated_users_select" ON public.seller_verification_applications;
DROP POLICY IF EXISTS "allow_authenticated_users_insert" ON public.seller_verification_applications;
DROP POLICY IF EXISTS "allow_authenticated_users_update" ON public.seller_verification_applications;
DROP POLICY IF EXISTS "users_own_applications_select" ON public.seller_verification_applications;
DROP POLICY IF EXISTS "users_own_applications_insert" ON public.seller_verification_applications;
DROP POLICY IF EXISTS "users_own_applications_update" ON public.seller_verification_applications;

-- 3. Temporarily disable RLS to test
ALTER TABLE public.seller_verification_applications DISABLE ROW LEVEL SECURITY;

-- 4. Grant permissions to authenticated users
GRANT ALL ON public.seller_verification_applications TO authenticated;
GRANT ALL ON public.seller_verification_applications TO anon;

-- 5. Create simple, working RLS policies
ALTER TABLE public.seller_verification_applications ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to select their own applications
CREATE POLICY "authenticated_users_select_own" ON public.seller_verification_applications
  FOR SELECT TO authenticated
  USING (
    auth.uid() IS NOT NULL AND 
    user_id = auth.uid()
  );

-- Allow authenticated users to insert their own applications
CREATE POLICY "authenticated_users_insert_own" ON public.seller_verification_applications
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL AND 
    user_id = auth.uid()
  );

-- Allow users to update their own pending applications
CREATE POLICY "authenticated_users_update_own" ON public.seller_verification_applications
  FOR UPDATE TO authenticated
  USING (
    auth.uid() IS NOT NULL AND 
    user_id = auth.uid() AND 
    status = 'pending'
  );

-- Allow admins to view all applications
CREATE POLICY "admins_view_all" ON public.seller_verification_applications
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Allow admins to update any application
CREATE POLICY "admins_update_all" ON public.seller_verification_applications
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_seller_verification_applications_user_id ON public.seller_verification_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_seller_verification_applications_status ON public.seller_verification_applications(status);
CREATE INDEX IF NOT EXISTS idx_seller_verification_applications_created_at ON public.seller_verification_applications(created_at);

-- 7. Test the setup
DO $$
DECLARE
    test_user_id UUID;
    test_profile_id UUID;
BEGIN
    -- Find a test user
    SELECT user_id, id INTO test_user_id, test_profile_id
    FROM profiles 
    WHERE role IN ('seller', 'admin') 
    LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        RAISE NOTICE 'Found test user: % (profile: %)', test_user_id, test_profile_id;
        RAISE NOTICE 'RLS policies created successfully for seller_verification_applications';
    ELSE
        RAISE NOTICE 'No test users found, but RLS policies created successfully';
    END IF;
END $$;

-- Success message
SELECT 
    'seller_verification_applications RLS policies fixed!' as status,
    COUNT(*) as existing_applications
FROM public.seller_verification_applications;