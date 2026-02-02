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
  ('commission_rate', '{"percentage": 10}'::jsonb),
  ('featured_products_limit', '{"limit": 6}'::jsonb);

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

-- Create storage bucket for product files
INSERT INTO storage.buckets (id, name, public) VALUES ('product-files', 'product-files', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Storage policies for product images (public read, seller write)
CREATE POLICY "Product images are publicly accessible" 
ON storage.objects FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can upload product images" 
ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own product images" 
ON storage.objects FOR UPDATE USING (bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own product images" 
ON storage.objects FOR DELETE USING (bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for avatars
CREATE POLICY "Avatars are publicly accessible" 
ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" 
ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar" 
ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for product files (private, only buyers/sellers can access)
CREATE POLICY "Sellers can upload product files" 
ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-files' AND auth.role() = 'authenticated');

CREATE POLICY "Sellers can update their product files" 
ON storage.objects FOR UPDATE USING (bucket_id = 'product-files' AND auth.uid()::text = (storage.foldername(name))[1]);

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