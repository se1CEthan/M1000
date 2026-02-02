-- Seller Verification Applications Table Setup
-- This creates a comprehensive seller verification system

-- Drop existing table if it exists
DROP TABLE IF EXISTS public.seller_verification_applications CASCADE;

-- Create seller verification applications table
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

-- Create indexes for better performance
CREATE INDEX idx_seller_verification_user_id ON public.seller_verification_applications(user_id);
CREATE INDEX idx_seller_verification_status ON public.seller_verification_applications(status);
CREATE INDEX idx_seller_verification_created ON public.seller_verification_applications(created_at);
CREATE INDEX idx_seller_verification_reviewed ON public.seller_verification_applications(reviewed_at);

-- Disable RLS for simplicity (can be enabled later if needed)
ALTER TABLE public.seller_verification_applications DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON public.seller_verification_applications TO authenticated;
GRANT ALL ON public.seller_verification_applications TO anon;
GRANT ALL ON public.seller_verification_applications TO PUBLIC;

-- Insert sample data for testing
INSERT INTO public.seller_verification_applications (
  user_id,
  full_name,
  date_of_birth,
  phone_number,
  address,
  business_type,
  business_name,
  selling_reason,
  product_categories,
  expected_monthly_sales,
  terms_accepted,
  commission_rate_accepted,
  status
) VALUES 
(
  gen_random_uuid(),
  'John Smith',
  '1990-05-15',
  '+1-555-0123',
  '{"line1": "123 Main St", "city": "New York", "state": "NY", "postal_code": "10001", "country": "USA"}',
  'individual',
  'Smith Digital Solutions',
  'I want to sell my digital products and software tools to help other developers.',
  ARRAY['software', 'templates', 'apis'],
  2500.00,
  true,
  true,
  'pending'
),
(
  gen_random_uuid(),
  'Sarah Johnson',
  '1985-08-22',
  '+1-555-0456',
  '{"line1": "456 Oak Ave", "city": "Los Angeles", "state": "CA", "postal_code": "90210", "country": "USA"}',
  'business',
  'Creative Assets Co',
  'Our company specializes in creating high-quality design assets and templates for businesses.',
  ARRAY['assets', 'templates', 'plugins'],
  5000.00,
  true,
  true,
  'pending'
),
(
  gen_random_uuid(),
  'Mike Chen',
  '1992-12-03',
  '+1-555-0789',
  '{"line1": "789 Pine St", "city": "Seattle", "state": "WA", "postal_code": "98101", "country": "USA"}',
  'individual',
  NULL,
  'I develop automation bots and want to share them with the community.',
  ARRAY['bots', 'software'],
  1500.00,
  true,
  true,
  'under_review'
);

-- Verify the setup
SELECT 
  'Seller Verification Applications Setup Complete' as status,
  COUNT(*) as sample_applications
FROM public.seller_verification_applications;

-- Show table information (using standard SQL instead of psql meta-commands)
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'seller_verification_applications' 
  AND table_schema = 'public'
ORDER BY ordinal_position;