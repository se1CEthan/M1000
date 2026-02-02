-- Simple Crypto Wallets Setup - Fixed SQL Syntax
-- Run this SQL script in your Supabase SQL Editor

-- 1. Create seller crypto wallets table
CREATE TABLE IF NOT EXISTS seller_crypto_wallets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  currency TEXT NOT NULL,
  network TEXT NOT NULL,
  address TEXT NOT NULL,
  label TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create crypto payouts table
CREATE TABLE IF NOT EXISTS crypto_payouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL,
  network TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  status TEXT DEFAULT 'processing',
  cryptomus_payout_id TEXT,
  transaction_hash TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create indexes
CREATE INDEX IF NOT EXISTS idx_seller_crypto_wallets_seller_id ON seller_crypto_wallets(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_crypto_wallets_default ON seller_crypto_wallets(seller_id) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_crypto_payouts_seller_id ON crypto_payouts(seller_id);
CREATE INDEX IF NOT EXISTS idx_crypto_payouts_status ON crypto_payouts(status);

-- 4. Enable RLS
ALTER TABLE seller_crypto_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE crypto_payouts ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies
CREATE POLICY "Sellers can manage their own crypto wallets" ON seller_crypto_wallets
    FOR ALL USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can view their own crypto payouts" ON crypto_payouts
    FOR SELECT USING (auth.uid() = seller_id);

-- 6. Grant permissions
GRANT ALL ON seller_crypto_wallets TO authenticated;
GRANT SELECT ON crypto_payouts TO authenticated;

-- 7. Create function to ensure only one default wallet per seller
CREATE OR REPLACE FUNCTION ensure_single_default_wallet()
RETURNS TRIGGER AS $$
BEGIN
    -- If setting a wallet as default, remove default from others
    IF NEW.is_default = true THEN
        UPDATE seller_crypto_wallets 
        SET is_default = false 
        WHERE seller_id = NEW.seller_id AND id != NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create trigger for default wallet management
DROP TRIGGER IF EXISTS trigger_ensure_single_default_wallet ON seller_crypto_wallets;
CREATE TRIGGER trigger_ensure_single_default_wallet
    BEFORE INSERT OR UPDATE ON seller_crypto_wallets
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_default_wallet();

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE '🎉 Crypto Wallets Setup Complete!';
    RAISE NOTICE '✅ seller_crypto_wallets table created';
    RAISE NOTICE '✅ crypto_payouts table created';
    RAISE NOTICE '✅ Indexes and policies configured';
    RAISE NOTICE '✅ Default wallet management enabled';
    RAISE NOTICE '🚀 Ready for crypto payouts!';
END $$;