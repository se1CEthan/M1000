-- Fix Seller Verification Schema - Remove Non-Existent Columns
-- This script ensures the database matches our simplified schema

-- Drop and recreate the table with the correct simplified schema
DROP TABLE IF EXISTS public.seller_verification_applications CASCADE;

-- Create seller verification applications table with simplified schema
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
  product_categories TEXT[] DEFAULT '{}',
  expected_monthly_sales DECIMAL(10,2) DEFAULT 0,
  terms_accepted BOOLEAN NOT NULL DEFAULT false,
  terms_version TEXT DEFAULT '1.0',
  commission_rate_accepted BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_seller_verification_user_id ON public.seller_verification_applications(user_id);
CREATE INDEX idx_seller_verification_status ON public.seller_verification_applications(status);
CREATE INDEX idx_seller_verification_created ON public.seller_verification_applications(created_at);

-- Disable RLS and grant full permissions
ALTER TABLE public.seller_verification_applications DISABLE ROW LEVEL SECURITY;
GRANT ALL ON public.seller_verification_applications TO authenticated;
GRANT ALL ON public.seller_verification_applications TO anon;
GRANT ALL ON public.seller_verification_applications TO PUBLIC;

-- Verify the setup
SELECT 
  'Schema Fix Complete - Seller Verification Table Ready' as message,
  COUNT(*) as total_applications
FROM public.seller_verification_applications;

-- Show table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'seller_verification_applications' 
AND table_schema = 'public'
ORDER BY ordinal_position;