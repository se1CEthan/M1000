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

-- Add amount column if it doesn't exist (some tables use 'price', some use 'amount')
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
