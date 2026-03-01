-- Add Cryptomus-specific columns to orders table
-- This migration adds columns needed for the Cryptomus payment flow

-- Add cryptomus_payment_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'cryptomus_payment_id'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN cryptomus_payment_id TEXT;
    COMMENT ON COLUMN public.orders.cryptomus_payment_id IS 'Cryptomus payment UUID';
  END IF;
END $$;

-- Add payment_url column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'payment_url'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN payment_url TEXT;
    COMMENT ON COLUMN public.orders.payment_url IS 'Cryptomus payment page URL';
  END IF;
END $$;

-- Add payment_status column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN payment_status TEXT DEFAULT 'pending';
    COMMENT ON COLUMN public.orders.payment_status IS 'Payment status: pending, completed, failed';
  END IF;
END $$;

-- Add paid_at column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'paid_at'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN paid_at TIMESTAMP WITH TIME ZONE;
    COMMENT ON COLUMN public.orders.paid_at IS 'Timestamp when payment was confirmed';
  END IF;
END $$;

-- Make price column nullable if it's not already (some tables use 'amount' instead)
DO $$ 
BEGIN
  ALTER TABLE public.orders ALTER COLUMN price DROP NOT NULL;
EXCEPTION
  WHEN undefined_column THEN
    -- Column doesn't exist, that's fine
    NULL;
  WHEN others THEN
    -- Column already nullable or other issue, continue
    NULL;
END $$;

-- Add amount column if it doesn't exist (alternative to price)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'amount'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN amount DECIMAL(10,2);
    COMMENT ON COLUMN public.orders.amount IS 'Order amount (alternative to price)';
  END IF;
END $$;

-- Make platform_fee nullable if needed
DO $$ 
BEGIN
  ALTER TABLE public.orders ALTER COLUMN platform_fee DROP NOT NULL;
EXCEPTION
  WHEN undefined_column THEN
    NULL;
  WHEN others THEN
    NULL;
END $$;

-- Make seller_earnings nullable if needed
DO $$ 
BEGIN
  ALTER TABLE public.orders ALTER COLUMN seller_earnings DROP NOT NULL;
EXCEPTION
  WHEN undefined_column THEN
    NULL;
  WHEN others THEN
    NULL;
END $$;

-- Create index on cryptomus_payment_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_cryptomus_payment_id 
ON public.orders(cryptomus_payment_id);

-- Create index on payment_status for faster filtering
CREATE INDEX IF NOT EXISTS idx_orders_payment_status 
ON public.orders(payment_status);

-- Create index on status for faster filtering
CREATE INDEX IF NOT EXISTS idx_orders_status 
ON public.orders(status);

COMMENT ON TABLE public.orders IS 'Orders table with Cryptomus payment integration';
