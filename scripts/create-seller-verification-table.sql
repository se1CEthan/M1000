-- Create seller verification applications table
-- Run this in Supabase SQL Editor to fix seller verification submission

-- 1. First check if table exists
SELECT 
  table_name,
  table_schema
FROM information_schema.tables 
WHERE table_name = 'seller_verification_applications';

-- 2. Create the seller verification applications table
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

-- 3. Enable RLS on the table
ALTER TABLE seller_verification_applications ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for seller verification applications
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

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_seller_verification_applications_user_id ON seller_verification_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_seller_verification_applications_status ON seller_verification_applications(status);
CREATE INDEX IF NOT EXISTS idx_seller_verification_applications_created_at ON seller_verification_applications(created_at);

-- 6. Create storage bucket for verification documents if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('verification-documents', 'verification-documents', false)
ON CONFLICT (id) DO NOTHING;

-- 7. Set up storage policies for verification documents
CREATE POLICY "Users can upload their own verification documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'verification-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own verification documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'verification-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins can view all verification documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'verification-documents' AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id::text = auth.uid()::text 
      AND profiles.role = 'admin'
    )
  );

-- 8. Verify table was created successfully
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'seller_verification_applications'
ORDER BY ordinal_position;

-- Success message
SELECT 'Seller verification table created successfully! You can now submit seller applications.' as message;