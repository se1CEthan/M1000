-- 🚀 SELLER DASHBOARD SIMPLE SETUP - No ON CONFLICT issues
-- This creates seller dashboard functionality using basic SQL only

-- 1. Create seller_pending_balances table
CREATE TABLE IF NOT EXISTS public.seller_pending_balances (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id uuid REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  amount decimal(10,2) DEFAULT 0.00,
  last_updated timestamp with time zone DEFAULT timezone('utc'::text, now()),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Add unique constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'seller_pending_balances_seller_id_key'
  ) THEN
    ALTER TABLE public.seller_pending_balances 
    ADD CONSTRAINT seller_pending_balances_seller_id_key UNIQUE (seller_id);
  END IF;
END $$;

-- 2. Create seller_crypto_wallets table
CREATE TABLE IF NOT EXISTS public.seller_crypto_wallets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id uuid REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  currency text NOT NULL,
  network text NOT NULL,
  address text NOT NULL,
  label text,
  is_default boolean DEFAULT false,
  is_verified boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Add unique constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'seller_crypto_wallets_seller_id_address_key'
  ) THEN
    ALTER TABLE public.seller_crypto_wallets 
    ADD CONSTRAINT seller_crypto_wallets_seller_id_address_key UNIQUE (seller_id, address);
  END IF;
END $$;

-- 3. Create payouts table
CREATE TABLE IF NOT EXISTS public.payouts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id uuid REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  amount decimal(10,2) NOT NULL,
  currency text DEFAULT 'USD',
  crypto_currency text,
  crypto_network text,
  wallet_address text,
  transaction_id text,
  status text DEFAULT 'pending',
  description text,
  processed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 4. Create seller_analytics table
CREATE TABLE IF NOT EXISTS public.seller_analytics (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id uuid REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  date date NOT NULL,
  views integer DEFAULT 0,
  downloads integer DEFAULT 0,
  sales integer DEFAULT 0,
  revenue decimal(10,2) DEFAULT 0.00,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Add unique constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'seller_analytics_seller_id_date_key'
  ) THEN
    ALTER TABLE public.seller_analytics 
    ADD CONSTRAINT seller_analytics_seller_id_date_key UNIQUE (seller_id, date);
  END IF;
END $$;

-- 5. Create seller_notifications table
CREATE TABLE IF NOT EXISTS public.seller_notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id uuid REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  data jsonb,
  read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 6. Create seller_settings table
CREATE TABLE IF NOT EXISTS public.seller_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id uuid REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  auto_payout_enabled boolean DEFAULT false,
  auto_payout_threshold decimal(10,2) DEFAULT 100.00,
  notification_preferences jsonb DEFAULT '{"sales": true, "payouts": true, "reviews": true}',
  tax_info jsonb,
  business_info jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Add unique constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'seller_settings_seller_id_key'
  ) THEN
    ALTER TABLE public.seller_settings 
    ADD CONSTRAINT seller_settings_seller_id_key UNIQUE (seller_id);
  END IF;
END $$;

-- 7. Add missing columns to existing tables (safely)
DO $$ 
BEGIN
  -- Add columns to products table
  BEGIN
    ALTER TABLE public.products ADD COLUMN view_count integer DEFAULT 0;
  EXCEPTION
    WHEN duplicate_column THEN NULL;
  END;
  
  BEGIN
    ALTER TABLE public.products ADD COLUMN download_count integer DEFAULT 0;
  EXCEPTION
    WHEN duplicate_column THEN NULL;
  END;
  
  BEGIN
    ALTER TABLE public.products ADD COLUMN average_rating decimal(3,2) DEFAULT 0.00;
  EXCEPTION
    WHEN duplicate_column THEN NULL;
  END;
  
  BEGIN
    ALTER TABLE public.products ADD COLUMN total_reviews integer DEFAULT 0;
  EXCEPTION
    WHEN duplicate_column THEN NULL;
  END;
  
  BEGIN
    ALTER TABLE public.products ADD COLUMN featured boolean DEFAULT false;
  EXCEPTION
    WHEN duplicate_column THEN NULL;
  END;
  
  BEGIN
    ALTER TABLE public.products ADD COLUMN last_updated timestamp with time zone DEFAULT timezone('utc'::text, now());
  EXCEPTION
    WHEN duplicate_column THEN NULL;
  END;

  -- Add columns to orders table
  BEGIN
    ALTER TABLE public.orders ADD COLUMN seller_earnings decimal(10,2);
  EXCEPTION
    WHEN duplicate_column THEN NULL;
  END;
  
  BEGIN
    ALTER TABLE public.orders ADD COLUMN platform_fee decimal(10,2);
  EXCEPTION
    WHEN duplicate_column THEN NULL;
  END;
  
  BEGIN
    ALTER TABLE public.orders ADD COLUMN completed_at timestamp with time zone;
  EXCEPTION
    WHEN duplicate_column THEN NULL;
  END;
  
  BEGIN
    ALTER TABLE public.orders ADD COLUMN order_number text;
  EXCEPTION
    WHEN duplicate_column THEN NULL;
  END;

  -- Add columns to profiles table
  BEGIN
    ALTER TABLE public.profiles ADD COLUMN total_earnings decimal(10,2) DEFAULT 0.00;
  EXCEPTION
    WHEN duplicate_column THEN NULL;
  END;
  
  BEGIN
    ALTER TABLE public.profiles ADD COLUMN total_sales integer DEFAULT 0;
  EXCEPTION
    WHEN duplicate_column THEN NULL;
  END;
  
  BEGIN
    ALTER TABLE public.profiles ADD COLUMN seller_rating decimal(3,2) DEFAULT 0.00;
  EXCEPTION
    WHEN duplicate_column THEN NULL;
  END;
  
  BEGIN
    ALTER TABLE public.profiles ADD COLUMN seller_level text DEFAULT 'bronze';
  EXCEPTION
    WHEN duplicate_column THEN NULL;
  END;
END $$;

-- 8. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_seller_pending_balances_seller_id ON public.seller_pending_balances(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_crypto_wallets_seller_id ON public.seller_crypto_wallets(seller_id);
CREATE INDEX IF NOT EXISTS idx_payouts_seller_id ON public.payouts(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_analytics_seller_date ON public.seller_analytics(seller_id, date);
CREATE INDEX IF NOT EXISTS idx_seller_notifications_seller_id ON public.seller_notifications(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_settings_seller_id ON public.seller_settings(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_seller_status ON public.products(seller_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_seller_status ON public.orders(seller_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);

-- 9. Create simple function to generate order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS text AS $$
BEGIN
  RETURN 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- 10. Create simple function to update seller earnings (without ON CONFLICT)
CREATE OR REPLACE FUNCTION update_seller_earnings()
RETURNS TRIGGER AS $$
DECLARE
    existing_balance decimal(10,2);
    existing_analytics_id uuid;
BEGIN
  -- Generate order number if not exists
  IF NEW.order_number IS NULL THEN
    NEW.order_number = generate_order_number();
  END IF;

  -- Calculate seller earnings (90% of order price)
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
    NEW.seller_earnings = NEW.price * 0.90;
    NEW.platform_fee = NEW.price * 0.10;
    NEW.completed_at = NOW();
    
    -- Update seller's total earnings and sales count
    UPDATE public.profiles 
    SET 
      total_earnings = COALESCE(total_earnings, 0) + NEW.seller_earnings,
      total_sales = COALESCE(total_sales, 0) + 1
    WHERE user_id = NEW.seller_id;
    
    -- Update or create pending balance (manual approach)
    SELECT amount INTO existing_balance 
    FROM public.seller_pending_balances 
    WHERE seller_id = NEW.seller_id;
    
    IF existing_balance IS NOT NULL THEN
      UPDATE public.seller_pending_balances 
      SET 
        amount = existing_balance + NEW.seller_earnings,
        last_updated = NOW()
      WHERE seller_id = NEW.seller_id;
    ELSE
      INSERT INTO public.seller_pending_balances (seller_id, amount)
      VALUES (NEW.seller_id, NEW.seller_earnings);
    END IF;
      
    -- Update daily analytics (manual approach)
    SELECT id INTO existing_analytics_id
    FROM public.seller_analytics 
    WHERE seller_id = NEW.seller_id AND date = CURRENT_DATE;
    
    IF existing_analytics_id IS NOT NULL THEN
      UPDATE public.seller_analytics 
      SET 
        sales = sales + 1,
        revenue = revenue + NEW.seller_earnings
      WHERE id = existing_analytics_id;
    ELSE
      INSERT INTO public.seller_analytics (seller_id, date, sales, revenue)
      VALUES (NEW.seller_id, CURRENT_DATE, 1, NEW.seller_earnings);
    END IF;
      
    -- Create sale notification
    INSERT INTO public.seller_notifications (seller_id, type, title, message, data)
    VALUES (
      NEW.seller_id, 
      'sale', 
      'New Sale! 🎉', 
      'You earned $' || NEW.seller_earnings || ' from order ' || NEW.order_number,
      jsonb_build_object('order_id', NEW.id, 'amount', NEW.seller_earnings)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. Create triggers (drop existing first)
DROP TRIGGER IF EXISTS trigger_update_seller_earnings ON public.orders;
DROP TRIGGER IF EXISTS trigger_new_order_earnings ON public.orders;

CREATE TRIGGER trigger_update_seller_earnings
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION update_seller_earnings();

CREATE TRIGGER trigger_new_order_earnings
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION update_seller_earnings();

-- 12. Disable RLS for seller tables
ALTER TABLE public.seller_pending_balances DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_crypto_wallets DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_analytics DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_settings DISABLE ROW LEVEL SECURITY;

-- 13. Grant permissions
GRANT ALL ON public.seller_pending_balances TO authenticated;
GRANT ALL ON public.seller_crypto_wallets TO authenticated;
GRANT ALL ON public.payouts TO authenticated;
GRANT ALL ON public.seller_analytics TO authenticated;
GRANT ALL ON public.seller_notifications TO authenticated;
GRANT ALL ON public.seller_settings TO authenticated;

-- 14. Create sample data (simple approach - no ON CONFLICT)
DO $$
DECLARE
    admin_user_id uuid;
    existing_balance_id uuid;
    existing_wallet_id uuid;
BEGIN
    -- Get admin user ID
    SELECT user_id INTO admin_user_id 
    FROM public.profiles 
    WHERE email = 'se1cethan@gmail.com' 
    LIMIT 1;
    
    IF admin_user_id IS NOT NULL THEN
        -- Check if balance exists
        SELECT id INTO existing_balance_id 
        FROM public.seller_pending_balances 
        WHERE seller_id = admin_user_id;
        
        IF existing_balance_id IS NULL THEN
            INSERT INTO public.seller_pending_balances (seller_id, amount)
            VALUES (admin_user_id, 247.85);
        END IF;
        
        -- Check if wallet exists
        SELECT id INTO existing_wallet_id 
        FROM public.seller_crypto_wallets 
        WHERE seller_id = admin_user_id AND address = 'TXYZabc123...sample';
        
        IF existing_wallet_id IS NULL THEN
            INSERT INTO public.seller_crypto_wallets (seller_id, currency, network, address, label, is_default, is_verified)
            VALUES (admin_user_id, 'USDT', 'TRC20', 'TXYZabc123...sample', 'Main USDT Wallet', true, true);
        END IF;
        
        -- Insert sample notifications (always insert new ones)
        INSERT INTO public.seller_notifications (seller_id, type, title, message, data)
        VALUES 
        (admin_user_id, 'sale', 'New Sale! 🎉', 'You earned $45.50 from order ORD-20241223-1234', '{"order_id": "sample", "amount": 45.50}'),
        (admin_user_id, 'payout', 'Payout Completed 💰', 'Your payout of $200.00 has been sent to your USDT wallet', '{"amount": 200.00, "currency": "USDT"}');
        
        -- Create seller settings if not exists
        IF NOT EXISTS (SELECT 1 FROM public.seller_settings WHERE seller_id = admin_user_id) THEN
            INSERT INTO public.seller_settings (seller_id) VALUES (admin_user_id);
        END IF;
    END IF;
END $$;

-- Success message
SELECT '🎉 SELLER DASHBOARD SIMPLE SETUP COMPLETE! No ON CONFLICT issues.' as result;