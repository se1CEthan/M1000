-- Add mobile money columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS mobile_money_number TEXT,
ADD COLUMN IF NOT EXISTS mobile_money_provider TEXT;

-- Create index for mobile money number for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_mobile_money_number ON public.profiles(mobile_money_number);

-- Fix seller_payouts table to reference profiles correctly
-- First, check if seller_payouts table exists and fix its structure
DO $$
BEGIN
    -- Check if seller_payouts table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'seller_payouts') THEN
        -- Drop existing foreign key constraint if it exists
        ALTER TABLE seller_payouts DROP CONSTRAINT IF EXISTS seller_payouts_seller_id_fkey;
        
        -- Add new foreign key constraint to profiles table
        ALTER TABLE seller_payouts 
        ADD CONSTRAINT seller_payouts_seller_id_fkey 
        FOREIGN KEY (seller_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
        
        -- Update currency to UGX if it's still KES
        UPDATE seller_payouts SET currency = 'UGX' WHERE currency = 'KES';
        
        -- Add missing columns if they don't exist
        ALTER TABLE seller_payouts ADD COLUMN IF NOT EXISTS payout_method TEXT DEFAULT 'mobile_money';
        ALTER TABLE seller_payouts ADD COLUMN IF NOT EXISTS mobile_number TEXT;
        
    ELSE
        -- Create seller_payouts table if it doesn't exist
        CREATE TABLE public.seller_payouts (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            seller_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
            order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
            amount DECIMAL(10,2) NOT NULL,
            currency TEXT DEFAULT 'UGX',
            payout_method TEXT DEFAULT 'mobile_money',
            mobile_number TEXT,
            status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'completed', 'failed')),
            processed_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        -- Enable RLS
        ALTER TABLE public.seller_payouts ENABLE ROW LEVEL SECURITY;
        
        -- Create RLS policies
        CREATE POLICY "Sellers can view their own payouts" ON public.seller_payouts
            FOR SELECT USING (seller_id IN (SELECT user_id FROM public.profiles WHERE user_id = auth.uid()));
            
        CREATE POLICY "Admins can manage all payouts" ON public.seller_payouts
            FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'));
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_seller_payouts_seller ON public.seller_payouts(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_payouts_status ON public.seller_payouts(status);
CREATE INDEX IF NOT EXISTS idx_seller_payouts_order ON public.seller_payouts(order_id);

-- Grant necessary permissions
GRANT ALL ON public.seller_payouts TO authenticated;
GRANT ALL ON public.seller_payouts TO service_role;