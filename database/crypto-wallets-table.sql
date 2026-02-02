-- Crypto Wallets and Payouts Tables for Live Production System
-- Run this SQL script in your Supabase SQL Editor

-- 1. Create seller crypto wallets table
CREATE TABLE IF NOT EXISTS seller_crypto_wallets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  currency TEXT NOT NULL CHECK (currency IN ('USDT', 'USDC', 'BTC', 'ETH', 'LTC')),
  network TEXT NOT NULL CHECK (network IN ('TRC20', 'ERC20', 'BTC', 'LTC')),
  address TEXT NOT NULL,
  label TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT TRUE, -- Auto-verify for crypto addresses
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique address per seller
  UNIQUE(seller_id, address)
);

-- Create partial unique index for default wallet (only one default per seller)
CREATE UNIQUE INDEX IF NOT EXISTS idx_seller_crypto_wallets_default 
ON seller_crypto_wallets(seller_id) 
WHERE is_default = true;

-- 2. Create crypto payouts table
CREATE TABLE IF NOT EXISTS crypto_payouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL,
  network TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed', 'cancelled')),
  cryptomus_payout_id TEXT,
  transaction_hash TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Update existing tables if needed
DO $ 
BEGIN
    -- Add crypto payout fields to existing payouts table if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payouts' AND column_name = 'crypto_currency') THEN
        ALTER TABLE payouts ADD COLUMN crypto_currency TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payouts' AND column_name = 'crypto_network') THEN
        ALTER TABLE payouts ADD COLUMN crypto_network TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payouts' AND column_name = 'crypto_address') THEN
        ALTER TABLE payouts ADD COLUMN crypto_address TEXT;
    END IF;
END $;

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_seller_crypto_wallets_seller_id ON seller_crypto_wallets(seller_id);
CREATE INDEX IF NOT EXISTS idx_crypto_payouts_seller_id ON crypto_payouts(seller_id);
CREATE INDEX IF NOT EXISTS idx_crypto_payouts_status ON crypto_payouts(status);
CREATE INDEX IF NOT EXISTS idx_crypto_payouts_order_id ON crypto_payouts(order_id);

-- 5. Enable RLS
ALTER TABLE seller_crypto_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE crypto_payouts ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies
DO $ 
BEGIN
    -- seller_crypto_wallets policies
    DROP POLICY IF EXISTS "Sellers can view their own crypto wallets" ON seller_crypto_wallets;
    DROP POLICY IF EXISTS "Sellers can insert their own crypto wallets" ON seller_crypto_wallets;
    DROP POLICY IF EXISTS "Sellers can update their own crypto wallets" ON seller_crypto_wallets;
    DROP POLICY IF EXISTS "Sellers can delete their own crypto wallets" ON seller_crypto_wallets;
    
    CREATE POLICY "Sellers can view their own crypto wallets" ON seller_crypto_wallets
        FOR SELECT USING (auth.uid() = seller_id);
    CREATE POLICY "Sellers can insert their own crypto wallets" ON seller_crypto_wallets
        FOR INSERT WITH CHECK (auth.uid() = seller_id);
    CREATE POLICY "Sellers can update their own crypto wallets" ON seller_crypto_wallets
        FOR UPDATE USING (auth.uid() = seller_id);
    CREATE POLICY "Sellers can delete their own crypto wallets" ON seller_crypto_wallets
        FOR DELETE USING (auth.uid() = seller_id);
    
    -- crypto_payouts policies
    DROP POLICY IF EXISTS "Sellers can view their own crypto payouts" ON crypto_payouts;
    CREATE POLICY "Sellers can view their own crypto payouts" ON crypto_payouts
        FOR SELECT USING (auth.uid() = seller_id);
END $;

-- 7. Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_seller_crypto_wallets_updated_at ON seller_crypto_wallets;
DROP TRIGGER IF EXISTS update_crypto_payouts_updated_at ON crypto_payouts;

CREATE TRIGGER update_seller_crypto_wallets_updated_at 
    BEFORE UPDATE ON seller_crypto_wallets 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crypto_payouts_updated_at 
    BEFORE UPDATE ON crypto_payouts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. Create automatic crypto payout trigger
CREATE OR REPLACE FUNCTION process_crypto_payout()
RETURNS TRIGGER AS $
DECLARE
    seller_wallet RECORD;
BEGIN
    -- Only process if order status changed to 'paid'
    IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
        
        -- Get seller's default crypto wallet
        SELECT * INTO seller_wallet
        FROM seller_crypto_wallets
        WHERE seller_id = NEW.seller_id 
        AND is_default = true 
        AND is_verified = true
        LIMIT 1;

        -- If no crypto wallet, add to pending balance
        IF seller_wallet IS NULL THEN
            INSERT INTO seller_pending_balances (seller_id, amount)
            VALUES (NEW.seller_id, NEW.seller_earnings)
            ON CONFLICT (seller_id) 
            DO UPDATE SET 
                amount = seller_pending_balances.amount + NEW.seller_earnings,
                updated_at = NOW();
                
            -- Add to pending transactions
            INSERT INTO pending_payout_transactions (seller_id, order_id, amount)
            VALUES (NEW.seller_id, NEW.id, NEW.seller_earnings);
            
            -- Create notification
            INSERT INTO notifications (user_id, type, title, message, data)
            VALUES (
                NEW.seller_id,
                'setup_crypto_wallet',
                'Setup Crypto Wallet 💳',
                'You have earnings of $' || NEW.seller_earnings || '! Setup your crypto wallet to receive automatic payouts.',
                jsonb_build_object('amount', NEW.seller_earnings, 'order_id', NEW.id)
            );
            
        ELSE
            -- Check if amount meets minimum threshold ($10)
            IF NEW.seller_earnings >= 10 THEN
                -- Create crypto payout record (will be processed by external service)
                INSERT INTO crypto_payouts (
                    seller_id, 
                    order_id, 
                    amount, 
                    currency, 
                    network, 
                    wallet_address, 
                    status
                ) VALUES (
                    NEW.seller_id,
                    NEW.id,
                    NEW.seller_earnings,
                    seller_wallet.currency,
                    seller_wallet.network,
                    seller_wallet.address,
                    'processing'
                );
                
                -- Create notification
                INSERT INTO notifications (user_id, type, title, message, data)
                VALUES (
                    NEW.seller_id,
                    'crypto_payout_processing',
                    'Crypto Payout Processing 🚀',
                    'Your payout of $' || NEW.seller_earnings || ' is being processed and will arrive in 10-30 minutes.',
                    jsonb_build_object('amount', NEW.seller_earnings, 'currency', seller_wallet.currency)
                );
            ELSE
                -- Add to pending balance
                INSERT INTO seller_pending_balances (seller_id, amount)
                VALUES (NEW.seller_id, NEW.seller_earnings)
                ON CONFLICT (seller_id) 
                DO UPDATE SET 
                    amount = seller_pending_balances.amount + NEW.seller_earnings,
                    updated_at = NOW();
                    
                -- Add to pending transactions
                INSERT INTO pending_payout_transactions (seller_id, order_id, amount)
                VALUES (NEW.seller_id, NEW.id, NEW.seller_earnings);
                
                -- Create notification
                INSERT INTO notifications (user_id, type, title, message, data)
                VALUES (
                    NEW.seller_id,
                    'pending_balance',
                    'Earnings Added to Pending Balance 💰',
                    'Your earnings of $' || NEW.seller_earnings || ' have been added to your pending balance. You need $10 minimum for automatic payout.',
                    jsonb_build_object('amount', NEW.seller_earnings, 'minimum', 10)
                );
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Drop and recreate the crypto payout trigger
DROP TRIGGER IF EXISTS crypto_payout_trigger ON orders;
CREATE TRIGGER crypto_payout_trigger
    AFTER UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION process_crypto_payout();

-- 9. Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON seller_crypto_wallets TO authenticated;
GRANT SELECT ON crypto_payouts TO authenticated;

-- Success message
DO $ 
BEGIN
    RAISE NOTICE '🎉 Crypto Payout System Setup Complete!';
    RAISE NOTICE '✅ Crypto wallets table created';
    RAISE NOTICE '✅ Crypto payouts table created';
    RAISE NOTICE '✅ Automatic triggers configured';
    RAISE NOTICE '✅ RLS policies enabled';
    RAISE NOTICE '🚀 Live crypto-to-crypto payout system ready!';
END $;