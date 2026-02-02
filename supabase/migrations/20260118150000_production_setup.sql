-- Production setup for Seltech marketplace
-- This migration sets up indexes, constraints, and production optimizations

-- Create indexes for better performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_email ON public.profiles(email);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_seller_id ON public.products(seller_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_is_featured ON public.products(is_featured);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_created_at ON public.products(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_price ON public.products(price);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_average_rating ON public.products(average_rating DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_download_count ON public.products(download_count DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_tags ON public.products USING GIN(tags);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_search ON public.products USING GIN(to_tsvector('english', title || ' ' || description));

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_buyer_id ON public.orders(buyer_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_seller_id ON public.orders(seller_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_product_id ON public.orders(product_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_product_id ON public.reviews(product_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_buyer_id ON public.reviews(buyer_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_rating ON public.reviews(rating);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_is_hidden ON public.reviews(is_hidden);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_wishlists_user_id ON public.wishlists(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_wishlists_product_id ON public.wishlists(product_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_disputes_order_id ON public.disputes(order_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_disputes_status ON public.disputes(status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payouts_seller_id ON public.payouts(seller_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payouts_status ON public.payouts(status);

-- Add constraints for data integrity
ALTER TABLE public.products ADD CONSTRAINT check_price_positive CHECK (price >= 0);
ALTER TABLE public.products ADD CONSTRAINT check_subscription_prices CHECK (
  (pricing_type = 'subscription_monthly' AND subscription_price_monthly > 0) OR
  (pricing_type = 'subscription_yearly' AND subscription_price_yearly > 0) OR
  (pricing_type IN ('one_time', 'custom'))
);

ALTER TABLE public.orders ADD CONSTRAINT check_order_amounts CHECK (
  price >= 0 AND platform_fee >= 0 AND seller_earnings >= 0
);

ALTER TABLE public.reviews ADD CONSTRAINT check_rating_range CHECK (rating >= 1 AND rating <= 5);

-- Create function for full-text search
CREATE OR REPLACE FUNCTION public.search_products(search_query TEXT)
RETURNS SETOF public.products AS $$
BEGIN
  RETURN QUERY
  SELECT p.*
  FROM public.products p
  WHERE p.status = 'approved'
    AND (
      to_tsvector('english', p.title || ' ' || p.description) @@ plainto_tsquery('english', search_query)
      OR p.title ILIKE '%' || search_query || '%'
      OR p.description ILIKE '%' || search_query || '%'
      OR search_query = ANY(p.tags)
    )
  ORDER BY 
    ts_rank(to_tsvector('english', p.title || ' ' || p.description), plainto_tsquery('english', search_query)) DESC,
    p.average_rating DESC,
    p.download_count DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Create function to get featured products
CREATE OR REPLACE FUNCTION public.get_featured_products(limit_count INTEGER DEFAULT 6)
RETURNS SETOF public.products AS $$
BEGIN
  RETURN QUERY
  SELECT p.*
  FROM public.products p
  WHERE p.status = 'approved' AND p.is_featured = true
  ORDER BY p.average_rating DESC, p.download_count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- Create function to get products by category
CREATE OR REPLACE FUNCTION public.get_products_by_category(
  category_filter product_category,
  sort_by TEXT DEFAULT 'newest',
  limit_count INTEGER DEFAULT 50,
  offset_count INTEGER DEFAULT 0
)
RETURNS SETOF public.products AS $$
BEGIN
  RETURN QUERY
  SELECT p.*
  FROM public.products p
  WHERE p.status = 'approved' AND p.category = category_filter
  ORDER BY 
    CASE 
      WHEN sort_by = 'newest' THEN p.created_at
      ELSE NULL
    END DESC,
    CASE 
      WHEN sort_by = 'oldest' THEN p.created_at
      ELSE NULL
    END ASC,
    CASE 
      WHEN sort_by = 'price_low' THEN p.price
      ELSE NULL
    END ASC,
    CASE 
      WHEN sort_by = 'price_high' THEN p.price
      ELSE NULL
    END DESC,
    CASE 
      WHEN sort_by = 'popular' THEN p.download_count
      ELSE NULL
    END DESC,
    CASE 
      WHEN sort_by = 'rating' THEN p.average_rating
      ELSE NULL
    END DESC
  LIMIT limit_count OFFSET offset_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- Create function to handle profile creation on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'buyer')::user_role
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to generate unique product slug
CREATE OR REPLACE FUNCTION public.generate_product_slug(title TEXT)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Create base slug from title
  base_slug := lower(regexp_replace(trim(title), '[^a-zA-Z0-9\s]', '', 'g'));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := trim(base_slug, '-');
  
  final_slug := base_slug;
  
  -- Check if slug exists and increment counter if needed
  WHILE EXISTS (SELECT 1 FROM public.products WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Create function to automatically set slug on product insert
CREATE OR REPLACE FUNCTION public.set_product_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := public.generate_product_slug(NEW.title);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_product_slug_trigger
  BEFORE INSERT ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_product_slug();

-- Create function for calculating platform fee
CREATE OR REPLACE FUNCTION public.calculate_platform_fee(order_price DECIMAL)
RETURNS DECIMAL AS $$
DECLARE
  commission_rate DECIMAL;
BEGIN
  SELECT (value->>'percentage')::DECIMAL / 100 
  INTO commission_rate 
  FROM public.platform_settings 
  WHERE key = 'commission_rate';
  
  IF commission_rate IS NULL THEN
    commission_rate := 0.10; -- Default 10%
  END IF;
  
  RETURN ROUND(order_price * commission_rate, 2);
END;
$$ LANGUAGE plpgsql STABLE;

-- Create function to set order calculations
CREATE OR REPLACE FUNCTION public.set_order_calculations()
RETURNS TRIGGER AS $$
BEGIN
  NEW.platform_fee := public.calculate_platform_fee(NEW.price);
  NEW.seller_earnings := NEW.price - NEW.platform_fee;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_order_calculations_trigger
  BEFORE INSERT OR UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_order_calculations();

-- Insert essential platform settings for production
INSERT INTO public.platform_settings (key, value) VALUES
  ('commission_rate', '{"percentage": 10, "description": "Platform commission rate"}'::jsonb),
  ('featured_products_limit', '{"limit": 6, "description": "Number of featured products to display"}'::jsonb),
  ('max_file_size_mb', '{"size": 500, "description": "Maximum file size for uploads in MB"}'::jsonb),
  ('supported_currencies', '{"currencies": ["BTC", "ETH", "USDT", "USDC", "LTC"], "description": "Supported cryptocurrencies"}'::jsonb),
  ('maintenance_mode', '{"enabled": false, "message": "Site under maintenance", "description": "Maintenance mode toggle"}'::jsonb),
  ('seller_verification_required', '{"enabled": true, "description": "Require seller verification for product approval"}'::jsonb),
  ('auto_approve_products', '{"enabled": false, "description": "Automatically approve products from verified sellers"}'::jsonb),
  ('min_payout_amount', '{"amount": 50, "currency": "USD", "description": "Minimum amount for seller payouts"}'::jsonb)
ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value,
  updated_at = now();

-- Create admin user function (to be called manually for first admin)
CREATE OR REPLACE FUNCTION public.create_admin_user(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.profiles 
  SET role = 'admin'
  WHERE email = user_email;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Create view for public product data (for better performance)
CREATE OR REPLACE VIEW public.products_public AS
SELECT 
  p.id,
  p.title,
  p.slug,
  p.description,
  p.short_description,
  p.category,
  p.tags,
  p.price,
  p.pricing_type,
  p.subscription_price_monthly,
  p.subscription_price_yearly,
  p.thumbnail_url,
  p.preview_images,
  p.demo_url,
  p.documentation_url,
  p.download_count,
  p.view_count,
  p.average_rating,
  p.review_count,
  p.is_featured,
  p.created_at,
  p.updated_at,
  pr.id as seller_id,
  pr.full_name as seller_name,
  pr.avatar_url as seller_avatar,
  pr.is_verified_seller
FROM public.products p
JOIN public.profiles pr ON p.seller_id = pr.id
WHERE p.status = 'approved';

-- Grant access to the view
GRANT SELECT ON public.products_public TO anon, authenticated;