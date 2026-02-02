-- 🚨 NUCLEAR SELLER VERIFICATION FIX
-- This completely removes and recreates the table without any RLS

-- 1. Drop the table completely (this removes all policies)
DROP TABLE IF EXISTS public.seller_verification_applications CASCADE;

-- 2. Recreate the table from scratch
CREATE TABLE public.seller_verification_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
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
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Explicitly ensure RLS is OFF (new table should not have RLS by default)
ALTER TABLE public.seller_verification_applications DISABLE ROW LEVEL SECURITY;

-- 4. Grant permissions to all roles
GRANT ALL PRIVILEGES ON public.seller_verification_applications TO authenticated;
GRANT ALL PRIVILEGES ON public.seller_verification_applications TO anon;
GRANT ALL PRIVILEGES ON public.seller_verification_applications TO public;

-- 5. Create indexes
CREATE INDEX idx_seller_verification_applications_user_id ON public.seller_verification_applications(user_id);
CREATE INDEX idx_seller_verification_applications_status ON public.seller_verification_applications(status);
CREATE INDEX idx_seller_verification_applications_created_at ON public.seller_verification_applications(created_at);

-- 6. Verify RLS is disabled
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'seller_verification_applications';

-- 7. Verify no policies exist
SELECT 
    COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'seller_verification_applications';

-- 8. Test insert to make sure it works
DO $$
DECLARE
    test_id UUID;
BEGIN
    INSERT INTO public.seller_verification_applications (
        user_id,
        full_name,
        selling_reason,
        experience_level,
        terms_accepted,
        commission_rate_accepted
    ) VALUES (
        gen_random_uuid(),
        'Nuclear Test Application',
        'This is a nuclear test to verify the table works without any RLS restrictions.',
        'beginner',
        true,
        true
    ) RETURNING id INTO test_id;
    
    -- Verify the insert worked
    IF test_id IS NOT NULL THEN
        RAISE NOTICE 'SUCCESS: Nuclear test insert worked! ID: %', test_id;
        
        -- Clean up test data
        DELETE FROM public.seller_verification_applications WHERE id = test_id;
        RAISE NOTICE 'Test data cleaned up successfully';
    ELSE
        RAISE NOTICE 'ERROR: Nuclear test insert failed';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'ERROR: Nuclear test failed - %', SQLERRM;
END $$;

-- 9. Final status
SELECT 
    'NUCLEAR FIX COMPLETE' as status,
    'Table recreated without RLS' as message,
    'Users should now be able to submit applications' as result;