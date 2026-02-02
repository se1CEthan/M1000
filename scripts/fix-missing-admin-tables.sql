-- Fix Missing Admin Tables - Complete Database Migration
-- This script creates all missing tables needed for the admin dashboard

-- Create seller_verification_applications table
CREATE TABLE IF NOT EXISTS seller_verification_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  date_of_birth DATE,
  phone_number TEXT,
  address JSONB DEFAULT '{}',
  business_type TEXT NOT NULL CHECK (business_type IN ('individual', 'business', 'company')),
  business_name TEXT,
  business_registration TEXT,
  tax_id TEXT,
  selling_reason TEXT NOT NULL,
  experience_level TEXT NOT NULL CHECK (experience_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  product_categories TEXT[] DEFAULT '{}',
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

-- Create product_reviews table (for admin product review queue)
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

-- Create admin_activity_log table
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES profiles(id),
  action_type TEXT NOT NULL CHECK (action_type IN ('seller_approved', 'seller_rejected', 'product_approved', 'product_rejected', 'user_suspended', 'user_unsuspended')),
  target_id UUID NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('user', 'product', 'order')),
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create notifications table (if not exists)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  read BOOLEAN NOT NULL DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE seller_verification_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own verification applications" ON seller_verification_applications;
DROP POLICY IF EXISTS "Users can create their own verification applications" ON seller_verification_applications;
DROP POLICY IF EXISTS "Users can update their own pending applications" ON seller_verification_applications;
DROP POLICY IF EXISTS "Admins can view all verification applications" ON seller_verification_applications;
DROP POLICY IF EXISTS "Admins can update verification applications" ON seller_verification_applications;

DROP POLICY IF EXISTS "Sellers can view reviews of their products" ON product_reviews;
DROP POLICY IF EXISTS "Admins can manage all product reviews" ON product_reviews;

DROP POLICY IF EXISTS "Admins can view activity log" ON admin_activity_log;
DROP POLICY IF EXISTS "Admins can create activity log entries" ON admin_activity_log;

DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;

-- Create RLS policies for seller_verification_applications
CREATE POLICY "Users can view their own verification applications" ON seller_verification_applications
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      user_id::text = auth.uid()::text OR
      EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.user_id::text = auth.uid()::text 
        AND p.role = 'admin'
      )
    )
  );

CREATE POLICY "Users can create their own verification applications" ON seller_verification_applications
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND user_id::text = auth.uid()::text);

CREATE POLICY "Users can update their own pending applications" ON seller_verification_applications
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND (
      (user_id::text = auth.uid()::text AND status = 'pending') OR
      EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.user_id::text = auth.uid()::text 
        AND p.role = 'admin'
      )
    )
  );

-- Create RLS policies for product_reviews
CREATE POLICY "Sellers can view reviews of their products" ON product_reviews
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      EXISTS (
        SELECT 1 FROM products 
        WHERE products.id = product_reviews.product_id 
        AND products.seller_id::text = auth.uid()::text
      ) OR
      EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.user_id::text = auth.uid()::text 
        AND p.role = 'admin'
      )
    )
  );

CREATE POLICY "Admins can manage all product reviews" ON product_reviews
  FOR ALL USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.user_id::text = auth.uid()::text 
      AND p.role = 'admin'
    )
  );

-- Create RLS policies for admin_activity_log
CREATE POLICY "Admins can manage activity log" ON admin_activity_log
  FOR ALL USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.user_id::text = auth.uid()::text 
      AND p.role = 'admin'
    )
  );

-- Create RLS policies for notifications
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() IS NOT NULL AND user_id::text = auth.uid()::text);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() IS NOT NULL AND user_id::text = auth.uid()::text);

CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_seller_verification_applications_user_id ON seller_verification_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_seller_verification_applications_status ON seller_verification_applications(status);
CREATE INDEX IF NOT EXISTS idx_seller_verification_applications_created_at ON seller_verification_applications(created_at);

CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_status ON product_reviews(status);
CREATE INDEX IF NOT EXISTS idx_product_reviews_created_at ON product_reviews(created_at);

CREATE INDEX IF NOT EXISTS idx_admin_activity_log_admin_id ON admin_activity_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_created_at ON admin_activity_log(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_target_id ON admin_activity_log(target_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION log_admin_activity TO authenticated;
GRANT EXECUTE ON FUNCTION create_product_review TO authenticated;

-- Insert sample data for testing
INSERT INTO seller_verification_applications (
  user_id, full_name, business_type, selling_reason, experience_level, 
  product_categories, status, created_at
)
SELECT 
  p.id,
  COALESCE(p.full_name, 'Test Seller'),
  'individual',
  'I want to sell digital products',
  'intermediate',
  ARRAY['software', 'templates'],
  CASE 
    WHEN p.role = 'seller' AND p.is_verified_seller = true THEN 'approved'
    WHEN p.role = 'seller' THEN 'pending'
    ELSE 'pending'
  END,
  NOW() - INTERVAL '1 day'
FROM profiles p
WHERE p.role IN ('seller', 'buyer')
  AND NOT EXISTS (
    SELECT 1 FROM seller_verification_applications sva 
    WHERE sva.user_id = p.id
  )
LIMIT 5;

-- Create product reviews for existing products
INSERT INTO product_reviews (product_id, status, created_at)
SELECT 
  p.id,
  CASE 
    WHEN p.status = 'approved' THEN 'approved'
    WHEN p.status = 'rejected' THEN 'rejected'
    ELSE 'pending'
  END,
  p.created_at
FROM products p
WHERE NOT EXISTS (
  SELECT 1 FROM product_reviews pr 
  WHERE pr.product_id = p.id
);

-- Verify the fix
SELECT 
  'Tables Check' as check_type,
  CASE 
    WHEN (
      SELECT COUNT(*) FROM information_schema.tables 
      WHERE table_name IN ('seller_verification_applications', 'product_reviews', 'admin_activity_log', 'notifications')
    ) = 4 THEN '✅ All required tables created successfully'
    ELSE '❌ Some tables are missing'
  END as status;

-- Check data
SELECT 
  'Data Check' as check_type,
  CONCAT(
    '✅ Created ', 
    (SELECT COUNT(*) FROM seller_verification_applications)::text, 
    ' seller applications and ',
    (SELECT COUNT(*) FROM product_reviews)::text,
    ' product reviews'
  ) as status;

-- Success message
SELECT '🎉 Admin dashboard tables created successfully!' as message;