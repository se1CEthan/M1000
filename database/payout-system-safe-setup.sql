-- Safe Payout System Setup - Handles Existing Tables and Policies
-- Run this SQL script in your Supabase SQL Editor

-- 1. Create tables only if they don't exist
CREATE TABLE IF NOT EXISTS seller_payout_methods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  method_type TEXT NOT NULL CHECK (method_type IN ('crypto', 'paypal', 'bank', 'wise')),
  method_name TEXT NOT NULL,
  method_address TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  network TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  minimum_amount DECIMAL(10,2) DEFAULT 10.00,
  processing_time TEXT DEFAULT '1-3 days',
  fees TEXT DEFAULT 'Varies',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS seller_pending_balances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE UNIQUE,
  amount DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pending_payout_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS payout_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add columns to existing payouts table if they don't exist
DO $$ 
BEGIN
    -- Add new columns to payouts table if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payouts' AND column_name = 'currency') THEN
        ALTER TABLE payouts ADD COLUMN currency TEXT DEFAULT 'USD';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payouts' AND column_name = 'method_type') THEN
        ALTER TABLE payouts ADD COLUMN method_type TEXT CHECK (method_type IN ('crypto', 'paypal', 'bank', 'wise'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payouts' AND column_name = 'method_address') THEN
        ALTER TABLE payouts ADD COLUMN method_address TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payouts' AND column_name = 'order_id') THEN
        ALTER TABLE payouts ADD COLUMN order_id UUID REFERENCES orders(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payouts' AND column_name = 'description') THEN
        ALTER TABLE payouts ADD COLUMN description TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payouts' AND column_name = 'error_message') THEN
        ALTER TABLE payouts ADD COLUMN error_message TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payouts' AND column_name = 'updated_at') THEN
        ALTER TABLE payouts ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- 3. Insert default settings (only if they don't exist)
INSERT INTO payout_settings (setting_key, setting_value, description) VALUES
('minimum_payout_crypto', '{"amount": 10, "currency": "USD"}', 'Minimum payout amount for cryptocurrency'),
('minimum_payout_paypal', '{"amount": 25, "currency": "USD"}', 'Minimum payout amount for PayPal'),
('minimum_payout_bank', '{"amount": 50, "currency": "USD"}', 'Minimum payout amount for bank transfers'),
('minimum_payout_wise', '{"amount": 30, "currency": "USD"}', 'Minimum payout amount for Wise transfers'),
('auto_payout_enabled', '{"enabled": true}', 'Enable automatic payouts on sale completion'),
('payout_schedule', '{"frequency": "immediate", "batch_time": "00:00"}', 'Payout processing schedule')
ON CONFLICT (setting_key) DO NOTHING;

-- 4. Create indexes (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_seller_payout_methods_seller_id ON seller_payout_methods(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_payout_methods_default ON seller_payout_methods(seller_id, is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_seller_pending_balances_seller_id ON seller_pending_balances(seller_id);
CREATE INDEX IF NOT EXISTS idx_pending_payout_transactions_seller_id ON pending_payout_transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_pending_payout_transactions_status ON pending_payout_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payouts_seller_id ON payouts(seller_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- 5. Create or replace functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Enable RLS on tables
ALTER TABLE seller_payout_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_pending_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_payout_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 7. Drop and recreate policies to avoid conflicts
DO $$ 
BEGIN
    -- seller_payout_methods policies
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
    
    -- seller_pending_balances policies
    DROP POLICY IF EXISTS "Sellers can view their own pending balance" ON seller_pending_balances;
    CREATE POLICY "Sellers can view their own pending balance" ON seller_pending_balances
        FOR SELECT USING (auth.uid() = seller_id);
    
    -- pending_payout_transactions policies
    DROP POLICY IF EXISTS "Sellers can view their own pending transactions" ON pending_payout_transactions;
    CREATE POLICY "Sellers can view their own pending transactions" ON pending_payout_transactions
        FOR SELECT USING (auth.uid() = seller_id);
    
    -- payouts policies
    DROP POLICY IF EXISTS "Sellers can view their own payouts" ON payouts;
    CREATE POLICY "Sellers can view their own payouts" ON payouts
        FOR SELECT USING (auth.uid() = seller_id);
    
    -- notifications policies
    DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
    DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
    CREATE POLICY "Users can view their own notifications" ON notifications
        FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can update their own notifications" ON notifications
        FOR UPDATE USING (auth.uid() = user_id);
END $$;

-- 8. Drop and recreate triggers to avoid conflicts
DROP TRIGGER IF EXISTS update_seller_payout_methods_updated_at ON seller_payout_methods;
DROP TRIGGER IF EXISTS update_seller_pending_balances_updated_at ON seller_pending_balances;
DROP TRIGGER IF EXISTS update_payouts_updated_at ON payouts;
DROP TRIGGER IF EXISTS update_payout_settings_updated_at ON payout_settings;

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

-- 9. Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON seller_payout_methods TO authenticated;
GRANT SELECT ON seller_pending_balances TO authenticated;
GRANT SELECT ON pending_payout_transactions TO authenticated;
GRANT SELECT ON payouts TO authenticated;
GRANT SELECT, UPDATE ON notifications TO authenticated;
GRANT SELECT ON payout_settings TO authenticated;

-- 10. Create seller balance initialization function
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

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS create_seller_pending_balance_trigger ON profiles;
CREATE TRIGGER create_seller_pending_balance_trigger
    AFTER INSERT OR UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION create_seller_pending_balance();

-- 11. Create automatic payout processing function
CREATE OR REPLACE FUNCTION process_automatic_payout()
RETURNS TRIGGER AS $$
DECLARE
    seller_payout_method RECORD;
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
            
            -- Create notification
            INSERT INTO notifications (user_id, type, title, message, data)
            VALUES (
                NEW.seller_id,
                'pending_balance',
                'Earnings Added to Pending Balance',
                'Your earnings of $' || NEW.seller_earnings || ' have been added to your pending balance. Configure a payout method to receive automatic payments.',
                jsonb_build_object('amount', NEW.seller_earnings, 'order_id', NEW.id)
            );
            
        ELSE
            -- Check if amount meets minimum threshold
            IF NEW.seller_earnings >= seller_payout_method.minimum_amount THEN
                -- Create immediate payout record
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
                
                -- Create notification
                INSERT INTO notifications (user_id, type, title, message, data)
                VALUES (
                    NEW.seller_id,
                    'payout_processing',
                    'Payout Processing',
                    'Your payout of $' || NEW.seller_earnings || ' is being processed and will arrive in ' || seller_payout_method.processing_time || '.',
                    jsonb_build_object('amount', NEW.seller_earnings, 'method', seller_payout_method.method_name)
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
                    'Earnings Added to Pending Balance',
                    'Your earnings of $' || NEW.seller_earnings || ' have been added to your pending balance. You need $' || seller_payout_method.minimum_amount || ' minimum for automatic payout.',
                    jsonb_build_object('amount', NEW.seller_earnings, 'minimum', seller_payout_method.minimum_amount)
                );
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate the automatic payout trigger
DROP TRIGGER IF EXISTS automatic_payout_trigger ON orders;
CREATE TRIGGER automatic_payout_trigger
    AFTER UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION process_automatic_payout();

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE '🎉 Payout System Setup Complete!';
    RAISE NOTICE '✅ All tables created successfully';
    RAISE NOTICE '✅ Policies and triggers configured';
    RAISE NOTICE '✅ Automatic payout processing enabled';
    RAISE NOTICE '🚀 Your live payout system is ready!';
END $$;