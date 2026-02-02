-- Create missing product_reviews table for admin dashboard

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

-- Enable RLS
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Sellers can view reviews of their products" ON product_reviews;
DROP POLICY IF EXISTS "Admins can manage all product reviews" ON product_reviews;

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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_status ON product_reviews(status);
CREATE INDEX IF NOT EXISTS idx_product_reviews_created_at ON product_reviews(created_at);

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

-- Verify the table was created
SELECT 
  'product_reviews table created successfully!' as message,
  COUNT(*) as review_count
FROM product_reviews;