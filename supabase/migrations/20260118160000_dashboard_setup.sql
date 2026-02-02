-- Production setup for Seltech marketplace (Dashboard Compatible)
-- This migration is optimized for running in Supabase SQL Editor

-- Create enum types for user roles and product/order status
CREATE TYPE user_role AS ENUM ('buyer', 'seller', 'admin');
CREATE TYPE product_status AS ENUM ('draft', 'pending', 'approved', 'rejected', 'suspended');
CREATE TYPE order_status AS ENUM ('pending', 'paid', 'completed', 'refunded', 'disputed');
CREATE TYPE pricing_type AS ENUM ('one_time', 'subscription_monthly', 'subscription_yearly', 'custom');
CREATE TYPE product_category AS ENUM ('bots', 'software', 'templates', 'assets', 'apis', 'plugins');
CREATE TYPE dispute_status AS ENUM ('open', 'under_review', 'resolved', 'closed');

-- Profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  role user_role NOT NULL DEFAULT 'buyer',
  is_verified_seller BOOLEAN DEFAULT FALSE,
  website_url TEXT,
  github_url TEXT,
  twitter_url TEXT,
  wallet_address TEXT,
  total_earnings DECIMAL(12,2) DEFAULT 0,
  total_sales INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  short_description TEXT,
  category product_category NOT NULL,
  tags TEXT[] DEFAULT '{}',
  price DECIMAL(10,2) NOT NULL,
  pricing_type pricing_type NOT NULL DEFAULT 'one_time',
  subscription_price_monthly DECIMAL(10,2),
  subscription_price_yearly DECIMAL(10,2),
  status product_status NOT NULL DEFAULT 'pending',
  version TEXT DEFAULT '1.0.0',
  changelog TEXT,
  documentation_url TEXT,
  demo_url TEXT,
  thumbnail_url TEXT,
  preview_images TEXT[] DEFAULT '{}',
  video_url TEXT,
  file_url TEXT,
  file_size BIGINT,
  download_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  average_rating DECIMAL(2,1) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Orders table
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL UNIQUE,
  status order_status NOT NULL DEFAULT 'pending',
  price DECIMAL(10,2) NOT NULL,
  platform_fee DECIMAL(10,2) NOT NULL,
  seller_earnings DECIMAL(10,2) NOT NULL,
  payment_id TEXT,
  payment_method TEXT DEFAULT 'crypto',
  currency TEXT DEFAULT 'USD',
  crypto_currency TEXT,
  crypto_amount DECIMAL(20,8),
  download_url TEXT,
  download_expires_at TIMESTAMP WITH TIME ZONE,
  license_key TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Reviews table
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT,
  seller_response TEXT,
  is_verified_purchase BOOLEAN DEFAULT TRUE,
  is_hidden BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id, buyer_id)
);

-- Wishlists table
CREATE TABLE public.wishlists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Disputes table
CREATE TABLE public.disputes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  initiated_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  description TEXT NOT NULL,
  status dispute_status NOT NULL DEFAULT 'open',
  admin_notes TEXT,
  resolution TEXT,
  resolved_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Payouts table for seller withdrawals
CREATE TABLE public.payouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  wallet_address TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  transaction_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Platform settings table (for admin configuration)
CREATE TABLE public.platform_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default platform settings
INSERT INTO public.platform_settings (key, value) VALUES
  ('commission_rate', '{"percentage": 10, "description": "Platform commission rate"}'::jsonb),
  ('featured_products_limit', '{"limit": 6, "description": "Number of featured products to display"}'::jsonb),
  ('max_file_size_mb', '{"size": 500, "description": "Maximum file size for uploads in MB"}'::jsonb),
  ('supported_currencies', '{"currencies": ["BTC", "ETH", "USDT", "USDC", "LTC"], "description": "Supported cryptocurrencies"}'::jsonb),
  ('maintenance_mode', '{"enabled": false, "message": "Site under maintenance", "description": "Maintenance mode toggle"}'::jsonb),
  ('seller_verification_required', '{"enabled": true, "description": "Require seller verification for product approval"}'::jsonb),
  ('auto_approve_products', '{"enabled": false, "description": "Automatically approve products from verified sellers"}'::jsonb),
  ('min_payout_amount', '{"amount": 50, "currency": "USD", "description": "Minimum amount for seller payouts"}'::jsonb);

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

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Products policies
CREATE POLICY "Approved products are viewable by everyone" 
ON public.products FOR SELECT USING (status = 'approved' OR seller_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Sellers can create products" 
ON public.products FOR INSERT WITH CHECK (
  seller_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid() AND role IN ('seller', 'admin'))
);

CREATE POLICY "Sellers can update their own products" 
ON public.products FOR UPDATE USING (
  seller_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Sellers can delete their own products" 
ON public.products FOR DELETE USING (
  seller_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

-- Orders policies
CREATE POLICY "Users can view their own orders" 
ON public.orders FOR SELECT USING (
  buyer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
  seller_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Buyers can create orders" 
ON public.orders FOR INSERT WITH CHECK (
  buyer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

-- Reviews policies
CREATE POLICY "Reviews are viewable by everyone" 
ON public.reviews FOR SELECT USING (is_hidden = false);

CREATE POLICY "Buyers can create reviews for their purchases" 
ON public.reviews FOR INSERT WITH CHECK (
  buyer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Buyers can update their own reviews" 
ON public.reviews FOR UPDATE USING (
  buyer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

-- Wishlists policies
CREATE POLICY "Users can view their own wishlist" 
ON public.wishlists FOR SELECT USING (
  user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can add to their wishlist" 
ON public.wishlists FOR INSERT WITH CHECK (
  user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can remove from their wishlist" 
ON public.wishlists FOR DELETE USING (
  user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

-- Disputes policies
CREATE POLICY "Users can view disputes they're involved in" 
ON public.disputes FOR SELECT USING (
  initiated_by IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
  order_id IN (SELECT id FROM public.orders WHERE buyer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR seller_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
);

CREATE POLICY "Users can create disputes for their orders" 
ON public.disputes FOR INSERT WITH CHECK (
  initiated_by IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

-- Payouts policies
CREATE POLICY "Sellers can view their own payouts" 
ON public.payouts FOR SELECT USING (
  seller_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Sellers can request payouts" 
ON public.payouts FOR INSERT WITH CHECK (
  seller_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid() AND role IN ('seller', 'admin'))
);

-- Platform settings (read-only for everyone, admin update only via edge function)
CREATE POLICY "Platform settings are readable by everyone" 
ON public.platform_settings FOR SELECT USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at
BEFORE UPDATE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to update product rating when review is added
CREATE OR REPLACE FUNCTION public.update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.products
  SET 
    average_rating = (SELECT ROUND(AVG(rating)::numeric, 1) FROM public.reviews WHERE product_id = NEW.product_id AND is_hidden = false),
    review_count = (SELECT COUNT(*) FROM public.reviews WHERE product_id = NEW.product_id AND is_hidden = false)
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_product_rating_on_review
AFTER INSERT OR UPDATE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.update_product_rating();

-- Create function to update seller stats when order completes
CREATE OR REPLACE FUNCTION public.update_seller_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    UPDATE public.profiles
    SET 
      total_earnings = total_earnings + NEW.seller_earnings,
      total_sales = total_sales + 1
    WHERE id = NEW.seller_id;
    
    UPDATE public.products
    SET download_count = download_count + 1
    WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_seller_stats_on_order
AFTER INSERT OR UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.update_seller_stats();

-- Generate order number function
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number = 'SEL-' || EXTRACT(YEAR FROM now()) || '-' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER generate_order_number_trigger
BEFORE INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.generate_order_number();

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