-- 🚨 TEMPORARY FIX FOR SELLER VERIFICATION RLS
-- This temporarily disables RLS to allow seller verification submissions
-- Use this only for debugging/testing purposes

-- 1. Temporarily disable RLS on seller_verification_applications
ALTER TABLE public.seller_verification_applications DISABLE ROW LEVEL SECURITY;

-- 2. Ensure proper permissions
GRANT ALL ON public.seller_verification_applications TO authenticated;
GRANT ALL ON public.seller_verification_applications TO anon;

-- 3. Create the table if it doesn't exist
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

-- 4. Create indexes
CREATE INDEX IF NOT EXISTS idx_seller_verification_applications_user_id ON public.seller_verification_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_seller_verification_applications_status ON public.seller_verification_applications(status);

-- 5. Test message
SELECT 
  'RLS temporarily disabled for seller_verification_applications' as status,
  'Users should now be able to submit verification applications' as message,
  COUNT(*) as existing_applications
FROM public.seller_verification_applications;

-- NOTE: Remember to re-enable RLS after testing:
-- ALTER TABLE public.seller_verification_applications ENABLE ROW LEVEL SECURITY;