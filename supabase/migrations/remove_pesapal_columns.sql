-- Migration: Remove PesaPal columns and update to Cryptomus
-- This migration removes PesaPal-specific columns from the orders table

-- Remove PesaPal-specific columns if they exist
DO $$ 
BEGIN
    -- Remove pesapal_tracking_id column
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'pesapal_tracking_id'
    ) THEN
        ALTER TABLE orders DROP COLUMN pesapal_tracking_id;
        RAISE NOTICE 'Removed pesapal_tracking_id column';
    END IF;

    -- Update payment_method default to 'cryptomus' instead of 'pesapal'
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'payment_method'
    ) THEN
        ALTER TABLE orders ALTER COLUMN payment_method SET DEFAULT 'cryptomus';
        RAISE NOTICE 'Updated payment_method default to cryptomus';
    END IF;

    -- Update existing 'pesapal' payment methods to 'cryptomus'
    UPDATE orders SET payment_method = 'cryptomus' WHERE payment_method = 'pesapal';
    RAISE NOTICE 'Updated existing pesapal orders to cryptomus';

END $$;

-- Drop PesaPal-related indexes if they exist
DROP INDEX IF EXISTS idx_orders_pesapal_tracking;

-- Add comment
COMMENT ON COLUMN orders.payment_method IS 'Payment method used: cryptomus (cryptocurrency), manual, or other';

-- Update seller_payouts table if needed
DO $$ 
BEGIN
    -- Update payout_method for any pesapal references
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'seller_payouts' AND column_name = 'payout_method'
    ) THEN
        UPDATE seller_payouts 
        SET payout_method = 'crypto' 
        WHERE payout_method IN ('pesapal', 'bank_transfer', 'mobile_money');
        RAISE NOTICE 'Updated seller payout methods';
    END IF;
END $$;

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE '✅ Successfully migrated from PesaPal to Cryptomus';
    RAISE NOTICE '✅ All PesaPal references have been removed';
    RAISE NOTICE '✅ Payment system now uses Cryptomus for cryptocurrency payments';
END $$;
