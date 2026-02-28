-- Add crypto wallet columns to seller_profiles table
-- This replaces mobile money with crypto wallet for payouts

-- Add crypto wallet columns
ALTER TABLE seller_profiles
ADD COLUMN IF NOT EXISTS crypto_wallet_address TEXT,
ADD COLUMN IF NOT EXISTS crypto_wallet_network TEXT DEFAULT 'TRC20',
ADD COLUMN IF NOT EXISTS crypto_wallet_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS crypto_wallet_verified_at TIMESTAMPTZ;

-- Remove mobile money columns (if they exist)
ALTER TABLE seller_profiles
DROP COLUMN IF EXISTS mobile_money_number,
DROP COLUMN IF EXISTS mobile_money_provider,
DROP COLUMN IF EXISTS mobile_money_name;

-- Create index for faster wallet lookups
CREATE INDEX IF NOT EXISTS idx_seller_profiles_crypto_wallet 
ON seller_profiles(crypto_wallet_address) 
WHERE crypto_wallet_address IS NOT NULL;

-- Add comment
COMMENT ON COLUMN seller_profiles.crypto_wallet_address IS 'Seller crypto wallet address for receiving 90% payouts';
COMMENT ON COLUMN seller_profiles.crypto_wallet_network IS 'Blockchain network (TRC20, ERC20, BEP20, etc.)';
