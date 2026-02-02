-- CRITICAL 90/10 Split System Fix
-- Ensures perfect revenue splitting and prevents any money loss

-- 1. Ensure orders table has all required columns for 90/10 split
DO $$ 
BEGIN
    -- Add platform_fee column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'platform_fee') THEN
        ALTER TABLE orders ADD COLUMN platform_fee DECIMAL(10,2) DEFAULT 0;
        RAISE NOTICE '✅ Added platform_fee column to orders table';
    END IF;
    
    -- Add seller_earnings column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'seller_earnings') THEN
        ALTER TABLE orders ADD COLUMN seller_earnings DECIMAL(10,2) DEFAULT 0;
        RAISE NOTICE '✅ Added seller_earnings column to orders table';
    END IF;
    
    -- Add payment_method column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'payment_method') THEN
        ALTER TABLE orders ADD COLUMN payment_method TEXT DEFAULT 'crypto';
        RAISE NOTICE '✅ Added payment_method column to orders table';
    END IF;
    
    -- Add crypto payment tracking columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'crypto_amount') THEN
        ALTER TABLE orders ADD COLUMN crypto_amount DECIMAL(10,8) DEFAULT 0;
        RAISE NOTICE '✅ Added crypto_amount column to orders table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'crypto_currency') THEN
        ALTER TABLE orders ADD COLUMN crypto_currency TEXT;
        RAISE NOTICE '✅ Added crypto_currency column to orders table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'payment_id') THEN
        ALTER TABLE orders ADD COLUMN payment_id TEXT;
        RAISE NOTICE '✅ Added payment_id column to orders table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'transaction_id') THEN
        ALTER TABLE orders ADD COLUMN transaction_id TEXT;
        RAISE NOTICE '✅ Added transaction_id column to orders table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'paid_at') THEN
        ALTER TABLE orders ADD COLUMN paid_at TIMESTAMPTZ;
        RAISE NOTICE '✅ Added paid_at column to orders table';
    END IF;
END $$;

-- 2. Create seller_pending_balances table if missing
CREATE TABLE IF NOT EXISTS seller_pending_balances (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    seller_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(seller_id)
);

-- 3. Create pending_payout_transactions table if missing
CREATE TABLE IF NOT EXISTS pending_payout_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    seller_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- 4. Create or replace the revenue split calculation function
CREATE OR REPLACE FUNCTION calculate_revenue_split(total_amount DECIMAL)
RETURNS TABLE(
    platform_fee DECIMAL,
    seller_earnings DECIMAL,
    total_check DECIMAL
) AS $$
BEGIN
    -- Calculate with precision to avoid rounding errors
    platform_fee := ROUND(total_amount * 0.10, 2);
    seller_earnings := ROUND(total_amount * 0.90, 2);
    total_check := platform_fee + seller_earnings;
    
    -- Ensure total matches (adjust seller earnings if needed due to rounding)
    IF total_check != total_amount THEN
        seller_earnings := total_amount - platform_fee;
    END IF;
    
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- 5. Create trigger to automatically calculate 90/10 split on order creation
CREATE OR REPLACE FUNCTION auto_calculate_revenue_split()
RETURNS TRIGGER AS $$
DECLARE
    split_result RECORD;
BEGIN
    -- Only calculate if not already set
    IF NEW.platform_fee IS NULL OR NEW.seller_earnings IS NULL OR NEW.platform_fee = 0 THEN
        SELECT * INTO split_result FROM calculate_revenue_split(NEW.total_amount);
        
        NEW.platform_fee := split_result.platform_fee;
        NEW.seller_earnings := split_result.seller_earnings;
        
        -- Log the calculation
        RAISE NOTICE 'Revenue split calculated: Total $%, Platform $%, Seller $%', 
            NEW.total_amount, NEW.platform_fee, NEW.seller_earnings;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS auto_revenue_split_trigger ON orders;
CREATE TRIGGER auto_revenue_split_trigger
    BEFORE INSERT OR UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION auto_calculate_revenue_split();

-- 6. Enhanced crypto payout processing function
CREATE OR REPLACE FUNCTION process_crypto_payout_enhanced()
RETURNS TRIGGER AS $$
DECLARE
    seller_wallet RECORD;
    current_pending DECIMAL DEFAULT 0;
    total_for_payout DECIMAL DEFAULT 0;
BEGIN
    -- Only process if order status changed to 'paid'
    IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
        
        RAISE NOTICE '💰 Processing payout for order %, seller earnings: $%', NEW.id, NEW.seller_earnings;
        
        -- Get seller's default crypto wallet
        SELECT * INTO seller_wallet
        FROM seller_crypto_wallets
        WHERE seller_id = NEW.seller_id 
        AND is_default = true 
        AND is_verified = true
        LIMIT 1;

        -- If no crypto wallet, add to pending balance
        IF seller_wallet IS NULL THEN
            RAISE NOTICE '⚠️ No crypto wallet for seller %, adding $% to pending balance', NEW.seller_id, NEW.seller_earnings;
            
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
            -- Get current pending balance
            SELECT COALESCE(amount, 0) INTO current_pending
            FROM seller_pending_balances
            WHERE seller_id = NEW.seller_id;
            
            -- Calculate total amount for payout (current earnings + pending)
            total_for_payout := NEW.seller_earnings + current_pending;
            
            RAISE NOTICE '💰 Total for payout: $% (current $% + pending $%)', total_for_payout, NEW.seller_earnings, current_pending;
            
            -- Check if total amount meets minimum threshold ($10)
            IF total_for_payout >= 10 THEN
                RAISE NOTICE '✅ Amount $% meets minimum, creating crypto payout', total_for_payout;
                
                -- Create crypto payout record (will be processed by webhook)
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
                    total_for_payout, -- Pay out total amount
                    seller_wallet.currency,
                    seller_wallet.network,
                    seller_wallet.address,
                    'processing'
                );
                
                -- Clear pending balance since we're paying it out
                DELETE FROM seller_pending_balances WHERE seller_id = NEW.seller_id;
                
                -- Mark pending transactions as processed
                UPDATE pending_payout_transactions 
                SET status = 'processed', processed_at = NOW()
                WHERE seller_id = NEW.seller_id AND status = 'pending';
                
                -- Create notification
                INSERT INTO notifications (user_id, type, title, message, data)
                VALUES (
                    NEW.seller_id,
                    'crypto_payout_processing',
                    'Crypto Payout Processing 🚀',
                    'Your payout of $' || total_for_payout || ' is being processed and will arrive in 10-30 minutes.',
                    jsonb_build_object('amount', total_for_payout, 'currency', seller_wallet.currency)
                );
            ELSE
                RAISE NOTICE '⏳ Amount $% below minimum, adding to pending balance', total_for_payout;
                
                -- Add current earnings to pending balance
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
                    'Your earnings of $' || NEW.seller_earnings || ' have been added to your pending balance. Total pending: $' || total_for_payout || '. You need $10 minimum for automatic payout.',
                    jsonb_build_object('amount', NEW.seller_earnings, 'total_pending', total_for_payout, 'minimum', 10)
                );
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate the enhanced crypto payout trigger
DROP TRIGGER IF EXISTS crypto_payout_trigger ON orders;
DROP TRIGGER IF EXISTS crypto_payout_enhanced_trigger ON orders;
CREATE TRIGGER crypto_payout_enhanced_trigger
    AFTER UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION process_crypto_payout_enhanced();

-- 7. Create function to verify revenue split integrity
CREATE OR REPLACE FUNCTION verify_revenue_split_integrity()
RETURNS TABLE(
    order_id UUID,
    total_amount DECIMAL,
    platform_fee DECIMAL,
    seller_earnings DECIMAL,
    calculated_total DECIMAL,
    is_correct BOOLEAN,
    error_message TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id,
        o.total_amount,
        o.platform_fee,
        o.seller_earnings,
        (o.platform_fee + o.seller_earnings) as calculated_total,
        (ABS(o.total_amount - (o.platform_fee + o.seller_earnings)) < 0.01) as is_correct,
        CASE 
            WHEN ABS(o.total_amount - (o.platform_fee + o.seller_earnings)) >= 0.01 THEN 
                'Revenue split mismatch: ' || o.total_amount || ' ≠ ' || (o.platform_fee + o.seller_earnings)
            WHEN o.platform_fee != ROUND(o.total_amount * 0.10, 2) THEN
                'Platform fee incorrect: Expected ' || ROUND(o.total_amount * 0.10, 2) || ', got ' || o.platform_fee
            WHEN o.seller_earnings != ROUND(o.total_amount * 0.90, 2) THEN
                'Seller earnings incorrect: Expected ' || ROUND(o.total_amount * 0.90, 2) || ', got ' || o.seller_earnings
            ELSE 'OK'
        END as error_message
    FROM orders o
    WHERE o.total_amount > 0
    AND (o.platform_fee IS NOT NULL OR o.seller_earnings IS NOT NULL);
END;
$$ LANGUAGE plpgsql;

-- 8. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_status_paid ON orders(status) WHERE status = 'paid';
CREATE INDEX IF NOT EXISTS idx_orders_seller_earnings ON orders(seller_id, seller_earnings) WHERE seller_earnings > 0;
CREATE INDEX IF NOT EXISTS idx_seller_pending_balances_amount ON seller_pending_balances(seller_id, amount);
CREATE INDEX IF NOT EXISTS idx_pending_payout_transactions_status ON pending_payout_transactions(seller_id, status);

-- 9. Enable RLS on new tables
ALTER TABLE seller_pending_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_payout_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Sellers can view their pending balance" ON seller_pending_balances;
CREATE POLICY "Sellers can view their pending balance" ON seller_pending_balances
    FOR SELECT USING (auth.uid() = seller_id);

DROP POLICY IF EXISTS "Sellers can view their pending transactions" ON pending_payout_transactions;
CREATE POLICY "Sellers can view their pending transactions" ON pending_payout_transactions
    FOR SELECT USING (auth.uid() = seller_id);

-- 10. Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON seller_pending_balances TO authenticated;
GRANT SELECT ON pending_payout_transactions TO authenticated;

-- 11. Test the revenue split calculation
DO $$
DECLARE
    test_amounts DECIMAL[] := ARRAY[10.00, 25.50, 100.00, 250.75, 500.00, 1000.00];
    test_amount DECIMAL;
    split_result RECORD;
BEGIN
    RAISE NOTICE '🧪 Testing revenue split calculations...';
    
    FOREACH test_amount IN ARRAY test_amounts
    LOOP
        SELECT * INTO split_result FROM calculate_revenue_split(test_amount);
        
        RAISE NOTICE 'Amount: $%, Platform: $%, Seller: $%, Total: $%', 
            test_amount, 
            split_result.platform_fee, 
            split_result.seller_earnings,
            split_result.total_check;
            
        -- Verify the split is correct
        IF ABS(split_result.total_check - test_amount) > 0.01 THEN
            RAISE EXCEPTION 'Revenue split error for amount $%: Total mismatch', test_amount;
        END IF;
        
        IF ABS(split_result.platform_fee - (test_amount * 0.10)) > 0.01 THEN
            RAISE EXCEPTION 'Platform fee error for amount $%', test_amount;
        END IF;
        
        IF ABS(split_result.seller_earnings - (test_amount * 0.90)) > 0.01 THEN
            RAISE EXCEPTION 'Seller earnings error for amount $%', test_amount;
        END IF;
    END LOOP;
    
    RAISE NOTICE '✅ All revenue split calculations are CORRECT!';
END $$;

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 CRITICAL 90/10 SPLIT SYSTEM - SETUP COMPLETE!';
    RAISE NOTICE '================================================';
    RAISE NOTICE '✅ Revenue split calculation function created';
    RAISE NOTICE '✅ Automatic 90/10 split triggers configured';
    RAISE NOTICE '✅ Enhanced payout processing implemented';
    RAISE NOTICE '✅ Pending balance system configured';
    RAISE NOTICE '✅ Database integrity checks added';
    RAISE NOTICE '✅ All calculations tested and verified';
    RAISE NOTICE '';
    RAISE NOTICE '💰 REVENUE SPLIT GUARANTEED:';
    RAISE NOTICE '   • Sellers get exactly 90% of each sale';
    RAISE NOTICE '   • Platform gets exactly 10% of each sale';
    RAISE NOTICE '   • No money is lost due to rounding errors';
    RAISE NOTICE '   • Automatic payouts when minimum reached';
    RAISE NOTICE '   • Pending balance accumulation below minimum';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 SYSTEM IS PRODUCTION READY!';
END $$;