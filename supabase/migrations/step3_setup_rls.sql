-- Step 3: Enable RLS and create policies
-- Run this after step 2

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