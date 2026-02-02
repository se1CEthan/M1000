-- COMPLETE FIX for seller verification submission
-- This creates all missing tables and storage needed for seller verification

-- 1. Create seller verification applications table
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

-- 2. Create product reviews table (for admin product approval)
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

-- 3. Create admin activity log table
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES profiles(id),
  action_type TEXT NOT NULL CHECK (action_type IN ('seller_approved', 'seller_rejected', 'product_approved', 'product_rejected', 'user_suspended', 'user_unsuspended')),
  target_id UUID NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('user', 'product', 'order')),
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable RLS on all new tables
ALTER TABLE seller_verification_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for seller_verification_applications
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

-- 6. Create RLS policies for product_reviews
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

-- 7. Create RLS policies for admin_activity_log
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

-- 8. Create storage bucket for verification documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('verification-documents', 'verification-documents', false)
ON CONFLICT (id) DO NOTHING;

-- 9. Create storage policies for verification documents
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

-- 10. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_seller_verification_applications_user_id ON seller_verification_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_seller_verification_applications_status ON seller_verification_applications(status);
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_status ON product_reviews(status);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_admin_id ON admin_activity_log(admin_id);

-- 11. Create function to automatically create product review when product is created
CREATE OR REPLACE FUNCTION create_product_review()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO product_reviews (product_id, status)
  VALUES (NEW.id, 'pending');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 12. Create trigger for automatic product review creation
DROP TRIGGER IF EXISTS trigger_create_product_review ON products;
CREATE TRIGGER trigger_create_product_review
  AFTER INSERT ON products
  FOR EACH ROW
  EXECUTE FUNCTION create_product_review();

-- 13. Create function to log admin activities
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

-- 14. Verify all tables were created
SELECT 
  table_name,
  CASE 
    WHEN table_name IN ('seller_verification_applications', 'product_reviews', 'admin_activity_log') 
    THEN 'NEWLY CREATED'
    ELSE 'EXISTING'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name IN ('profiles', 'products', 'seller_verification_applications', 'product_reviews', 'admin_activity_log')
ORDER BY table_name;

-- Success message
SELECT 'All seller verification tables created successfully! You can now submit seller applications and use admin features.' as message;