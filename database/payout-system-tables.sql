-- Advanced Payout System Database Tables
-- Run these SQL commands in your Supabase SQL Editor

-- 1. Seller Payout Methods Table
CREATE TABLE IF NOT EXISTS seller_payout_methods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  method_type TEXT NOT NULL CHECK (method_type IN ('crypto', 'paypal', 'bank', 'wise')),
  method_name TEXT NOT NULL,
  method_address TEXT NOT NULL, -- Wallet address, email, account number, etc.
  currency TEXT NOT NULL DEFAULT 'USD',
  network TEXT, -- For crypto: TRC20, ERC20, etc.
  is_default BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  minimum_amount DECIMAL(10,2) DEFAULT 10.00,
  processing_time TEXT DEFAULT '1-3 days',
  fees TEXT DEFAULT 'Varies',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Seller Pending Balances Table
CREATE TABLE IF NOT EXISTS seller_pending_balances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE UNIQUE,
  amount DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Pending Payout Transactions Table
CREATE TABLE IF NOT EXISTS pending_payout_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enhanced Payouts Table (update existing or create new)
CREATE TABLE IF NOT EXISTS payouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  method_type TEXT NOT NULL CHECK (method_type IN ('crypto', 'paypal', 'bank', 'wise')),
  method_address TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  transaction_id TEXT, -- External transaction ID
  transaction_hash TEXT, -- Blockchain hash for crypto
  description TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Payout Settings Table (for platform configuration)
CREATE TABLE IF NOT EXISTS payout_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default payout settings
INSERT INTO payout_settings (setting_key, setting_value, description) VALUES
('minimum_payout_crypto', '{"amount": 10, "currency": "USD"}', 'Minimum payout amount for cryptocurrency'),
('minimum_payout_paypal', '{"amount": 25, "currency": "USD"}', 'Minimum payout amount for PayPal'),
('minimum_payout_bank', '{"amount": 50, "currency": "USD"}', 'Minimum payout amount for bank transfers'),
('minimum_payout_wise', '{"amount": 30, "currency": "USD"}', 'Minimum payout amount for Wise transfers'),
('auto_payout_enabled', '{"enabled": true}', 'Enable automatic payouts on sale completion'),
('payout_schedule', '{"frequency": "immediate", "batch_time": "00:00"}', 'Payout processing schedule')
ON CONFLICT (setting_key) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_seller_payout_methods_seller_id ON seller_payout_methods(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_payout_methods_default ON seller_payout_methods(seller_id, is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_seller_pending_balances_seller_id ON seller_pending_balances(seller_id);
CREATE INDEX IF NOT EXISTS idx_pending_payout_transactions_seller_id ON pending_payout_transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_pending_payout_transactions_status ON pending_payout_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payouts_seller_id ON payouts(seller_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers (drop existing first to avoid conflicts)
DROP TRIGGER IF EXISTS update_seller_payout_methods_updated_at ON seller_payout_methods;
DROP TRIGGER IF EXISTS update_seller_pending_balances_updated_at ON seller_pending_balances;
DROP TRIGGER IF EXISTS update_payouts_updated_at ON payouts;
DROP TRIGGER IF EXISTS update_payout_settings_updated_at ON payout_settings;
DROP TRIGGER IF EXISTS create_seller_pending_balance_trigger ON profiles;
DROP TRIGGER IF EXISTS automatic_payout_trigger ON orders;

CREATE TRIGGER update_seller_payout_methods_updated_at 
    BEFORE UPDATE ON seller_payout_methods 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seller_pending_balances_updated_at 
    BEFORE UPDATE ON seller_pending_balances 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payouts_updated_at 
    BEFORE UPDATE ON payouts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payout_settings_updated_at 
    BEFORE UPDATE ON payout_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE seller_payout_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_pending_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_payout_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policies for seller_payout_methods
DROP POLICY IF EXISTS "Sellers can view their own payout methods" ON seller_payout_methods;
DROP POLICY IF EXISTS "Sellers can insert their own payout methods" ON seller_payout_methods;
DROP POLICY IF EXISTS "Sellers can update their own payout methods" ON seller_payout_methods;
DROP POLICY IF EXISTS "Sellers can delete their own payout methods" ON seller_payout_methods;

CREATE POLICY "Sellers can view their own payout methods" ON seller_payout_methods
    FOR SELECT USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can insert their own payout methods" ON seller_payout_methods
    FOR INSERT WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update their own payout methods" ON seller_payout_methods
    FOR UPDATE USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can delete their own payout methods" ON seller_payout_methods
    FOR DELETE USING (auth.uid() = seller_id);

-- Policies for seller_pending_balances
DROP POLICY IF EXISTS "Sellers can view their own pending balance" ON seller_pending_balances;
CREATE POLICY "Sellers can view their own pending balance" ON seller_pending_balances
    FOR SELECT USING (auth.uid() = seller_id);

-- Policies for pending_payout_transactions
DROP POLICY IF EXISTS "Sellers can view their own pending transactions" ON pending_payout_transactions;
CREATE POLICY "Sellers can view their own pending transactions" ON pending_payout_transactions
    FOR SELECT USING (auth.uid() = seller_id);

-- Policies for payouts
DROP POLICY IF EXISTS "Sellers can view their own payouts" ON payouts;
CREATE POLICY "Sellers can view their own payouts" ON payouts
    FOR SELECT USING (auth.uid() = seller_id);

-- Policies for notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;

CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON seller_payout_methods TO authenticated;
GRANT SELECT ON seller_pending_balances TO authenticated;
GRANT SELECT ON pending_payout_transactions TO authenticated;
GRANT SELECT ON payouts TO authenticated;
GRANT SELECT, UPDATE ON notifications TO authenticated;
GRANT SELECT ON payout_settings TO authenticated;

-- Create a function to automatically create pending balance record for new sellers
CREATE OR REPLACE FUNCTION create_seller_pending_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.role = 'seller' OR NEW.role = 'admin' THEN
        INSERT INTO seller_pending_balances (seller_id, amount)
        VALUES (NEW.user_id, 0.00)
        ON CONFLICT (seller_id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_seller_pending_balance_trigger
    AFTER INSERT OR UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION create_seller_pending_balance();

-- Create a function to process automatic payouts
CREATE OR REPLACE FUNCTION process_automatic_payout()
RETURNS TRIGGER AS $$
DECLARE
    seller_payout_method RECORD;
    pending_balance DECIMAL(10,2);
BEGIN
    -- Only process if order status changed to 'paid'
    IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
        
        -- Get seller's default payout method
        SELECT * INTO seller_payout_method
        FROM seller_payout_methods
        WHERE seller_id = NEW.seller_id 
        AND is_default = true 
        AND is_verified = true
        LIMIT 1;

        -- If no payout method, add to pending balance
        IF seller_payout_method IS NULL THEN
            INSERT INTO seller_pending_balances (seller_id, amount)
            VALUES (NEW.seller_id, NEW.seller_earnings)
            ON CONFLICT (seller_id) 
            DO UPDATE SET 
                amount = seller_pending_balances.amount + NEW.seller_earnings,
                updated_at = NOW();
                
            -- Add to pending transactions
            INSERT INTO pending_payout_transactions (seller_id, order_id, amount)
            VALUES (NEW.seller_id, NEW.id, NEW.seller_earnings);
            
        ELSE
            -- Check if amount meets minimum threshold
            IF NEW.seller_earnings >= seller_payout_method.minimum_amount THEN
                -- Create immediate payout record (will be processed by webhook)
                INSERT INTO payouts (
                    seller_id, 
                    order_id, 
                    amount, 
                    currency, 
                    method_type, 
                    method_address, 
                    status,
                    description
                ) VALUES (
                    NEW.seller_id,
                    NEW.id,
                    NEW.seller_earnings,
                    seller_payout_method.currency,
                    seller_payout_method.method_type,
                    seller_payout_method.method_address,
                    'pending',
                    'Automatic payout for order: ' || NEW.order_number
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
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic payouts
CREATE TRIGGER automatic_payout_trigger
    AFTER UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION process_automatic_payout();

COMMENT ON TABLE seller_payout_methods IS 'Stores seller payout method configurations';
COMMENT ON TABLE seller_pending_balances IS 'Tracks pending earnings for sellers below minimum payout threshold';
COMMENT ON TABLE pending_payout_transactions IS 'Individual transactions contributing to pending balance';
COMMENT ON TABLE payouts IS 'Records of all payout transactions to sellers';
COMMENT ON TABLE notifications IS 'User notifications for payout events';
COMMENT ON TABLE payout_settings IS 'Platform-wide payout configuration settings';