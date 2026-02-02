-- Add seller verification fields to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'under_review', 'approved', 'rejected'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verification_data JSONB DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verification_submitted_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verification_reviewed_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verification_reviewed_by UUID REFERENCES profiles(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verification_notes TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address JSONB DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS business_info JSONB DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS terms_version TEXT DEFAULT '1.0';

-- Create seller verification applications table
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

-- Create product review queue table
CREATE TABLE IF NOT EXISTS product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES profiles(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'changes_requested')),
  review_notes TEXT,
  rejection_reason TEXT,
  changes_requested TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create admin activity log
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES profiles(id),
  action_type TEXT NOT NULL CHECK (action_type IN ('seller_approved', 'seller_rejected', 'product_approved', 'product_rejected', 'user_suspended', 'user_unsuspended')),
  target_id UUID NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('user', 'product', 'order')),
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE seller_verification_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;

-- Seller verification applications policies
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

-- Product reviews policies
CREATE POLICY "Sellers can view reviews of their products" ON product_reviews
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM products 
      WHERE products.id = product_reviews.product_id 
      AND products.seller_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Admins can manage all product reviews" ON product_reviews
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id::text = auth.uid()::text 
      AND profiles.role = 'admin'
    )
  );

-- Admin activity log policies
CREATE POLICY "Admins can view activity log" ON admin_activity_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id::text = auth.uid()::text 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can create activity log entries" ON admin_activity_log
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id::text = auth.uid()::text 
      AND profiles.role = 'admin'
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_seller_verification_applications_user_id ON seller_verification_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_seller_verification_applications_status ON seller_verification_applications(status);
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_status ON product_reviews(status);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_admin_id ON admin_activity_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_created_at ON admin_activity_log(created_at);

-- Create function to automatically create product review when product is created
CREATE OR REPLACE FUNCTION create_product_review()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO product_reviews (product_id, status)
  VALUES (NEW.id, 'pending');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic product review creation
DROP TRIGGER IF EXISTS trigger_create_product_review ON products;
CREATE TRIGGER trigger_create_product_review
  AFTER INSERT ON products
  FOR EACH ROW
  EXECUTE FUNCTION create_product_review();

-- Create function to log admin activities
CREATE OR REPLACE FUNCTION log_admin_activity(
  p_admin_id UUID,
  p_action_type TEXT,
  p_target_id UUID,
  p_target_type TEXT,
  p_details JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  activity_id UUID;
BEGIN
  INSERT INTO admin_activity_log (admin_id, action_type, target_id, target_type, details)
  VALUES (p_admin_id, p_action_type, p_target_id, p_target_type, p_details)
  RETURNING id INTO activity_id;
  
  RETURN activity_id;
END;
$$ LANGUAGE plpgsql;

-- Update existing profiles to have verification status
UPDATE profiles 
SET verification_status = CASE 
  WHEN role = 'seller' AND is_verified_seller = true THEN 'approved'
  WHEN role = 'seller' AND is_verified_seller = false THEN 'pending'
  ELSE 'approved'
END
WHERE verification_status IS NULL;