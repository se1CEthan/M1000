-- Fix orders table to make price column nullable
-- This allows orders to work with both 'price' and 'amount' columns

-- Make price nullable if it exists
DO $$ 
BEGIN
  ALTER TABLE public.orders ALTER COLUMN price DROP NOT NULL;
EXCEPTION
  WHEN undefined_column THEN
    -- Column doesn't exist, that's fine
    NULL;
  WHEN others THEN
    -- Already nullable or other issue
    NULL;
END $$;

-- Make platform_fee nullable if it exists
DO $$ 
BEGIN
  ALTER TABLE public.orders ALTER COLUMN platform_fee DROP NOT NULL;
EXCEPTION
  WHEN undefined_column THEN
    NULL;
  WHEN others THEN
    NULL;
END $$;

-- Make seller_earnings nullable if it exists
DO $$ 
BEGIN
  ALTER TABLE public.orders ALTER COLUMN seller_earnings DROP NOT NULL;
EXCEPTION
  WHEN undefined_column THEN
    NULL;
  WHEN others THEN
    NULL;
END $$;

-- Ensure all required Cryptomus columns exist
ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS cryptomus_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_url TEXT,
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_cryptomus_payment_id ON public.orders(cryptomus_payment_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
