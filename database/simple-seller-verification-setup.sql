-- Simple Seller Verification Applications Table Setup
-- Run this with: psql $DATABASE_URL -f database/simple-seller-verification-setup.sql

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

-- Create indexes
CREATE INDEX idx_seller_verification_user_id ON public.seller_verification_applications(user_id);
CREATE INDEX idx_seller_verification_status ON public.seller_verification_applications(status);
CREATE INDEX idx_seller_verification_created ON public.seller_verification_applications(created_at);

-- Disable RLS and grant permissions
ALTER TABLE public.seller_verification_applications DISABLE ROW LEVEL SECURITY;
GRANT ALL ON public.seller_verification_applications TO authenticated;
GRANT ALL ON public.seller_verification_applications TO anon;
GRANT ALL ON public.seller_verification_applications TO PUBLIC;

-- Insert sample applications for testing
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
),
(
  gen_random_uuid(),
  'Emma Wilson',
  '1988-11-30',
  '+1-555-0321',
  '{"line1": "321 Elm St", "city": "Austin", "state": "TX", "postal_code": "73301", "country": "USA"}',
  'business',
  'Wilson Web Services',
  'We create premium WordPress themes and plugins for small businesses.',
  ARRAY['plugins', 'templates', 'software'],
  3500.00,
  true,
  true,
  'approved'
),
(
  gen_random_uuid(),
  'David Rodriguez',
  '1995-03-18',
  '+1-555-0654',
  '{"line1": "654 Maple Ave", "city": "Denver", "state": "CO", "postal_code": "80202", "country": "USA"}',
  'individual',
  NULL,
  'I create AI-powered automation tools and want to monetize my work.',
  ARRAY['bots', 'apis', 'software'],
  4000.00,
  true,
  true,
  'rejected'
);

-- Verify setup
SELECT 
  'Setup Complete - Seller Verification Applications Table Created' as message,
  COUNT(*) as total_applications,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_applications,
  COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_applications,
  COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_applications
FROM public.seller_verification_applications;