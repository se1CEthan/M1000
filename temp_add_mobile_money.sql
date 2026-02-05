-- Add mobile money columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS mobile_money_number TEXT,
ADD COLUMN IF NOT EXISTS mobile_money_provider TEXT;

-- Create index for mobile money number for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_mobile_money_number ON public.profiles(mobile_money_number);

-- Update the profiles table to allow mobile money updates
-- Note: This assumes RLS is already configured for profiles table