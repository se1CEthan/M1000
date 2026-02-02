-- INSTANT ORDER CREATION FIX
-- Fixes "database error please try again" when buying products

-- 1. Check if orders table exists and has correct structure
CREATE TABLE IF NOT EXISTS orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_number TEXT UNIQUE DEFAULT ('ORD-' || extract(epoch from now())::bigint || '-' || substr(gen_random_uuid()::text, 1, 6)),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    buyer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    total_amount DECIMAL(10,2) NOT NULL,
    platform_fee DECIMAL(10,2) DEFAULT 0,
    seller_earnings DECIMAL(10,2) DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid', 'completed', 'failed', 'refunded', 'cancelled')),
    payment_method TEXT DEFAULT 'crypto',
    currency TEXT DEFAULT 'USD',
    crypto_currency TEXT,
    crypto_amount DECIMAL(20,8),
    payment_id TEXT,
    payment_url TEXT,
    transaction_id TEXT,
    payment_status TEXT,
    download_url TEXT,
    download_expires_at TIMESTAMPTZ,
    license_key TEXT,
    completed_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS but allow authenticated users to insert orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can create orders" ON orders;
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Users can update own orders" ON orders;
DROP POLICY IF EXISTS "Allow order creation" ON orders;
DROP POLICY IF EXISTS "Allow order viewing" ON orders;

-- 4. Create permissive policies for order operations
CREATE POLICY "Allow authenticated users to create orders" ON orders
    FOR INSERT 
    TO authenticated
    WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Allow users to view their orders" ON orders
    FOR SELECT 
    TO authenticated
    USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Allow order updates for payment processing" ON orders
    FOR UPDATE 
    TO authenticated
    USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_product_id ON orders(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_id ON orders(payment_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- 6. Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON orders 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 7. Ensure products table exists and is accessible
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Drop existing product policies
DROP POLICY IF EXISTS "Products are viewable by everyone" ON products;
DROP POLICY IF EXISTS "Allow public product access" ON products;

-- Create permissive product policies
CREATE POLICY "Allow public to view approved products" ON products
    FOR SELECT 
    TO public
    USING (status = 'approved');

CREATE POLICY "Allow sellers to manage their products" ON products
    FOR ALL 
    TO authenticated
    USING (auth.uid() = seller_id);

-- 8. Test order creation with sample data
DO $$
DECLARE
    test_user_id UUID;
    test_product_id UUID;
    test_order_id UUID;
BEGIN
    -- Get a test user (first authenticated user)
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    -- Get a test product (first approved product)
    SELECT id INTO test_product_id FROM products WHERE status = 'approved' LIMIT 1;
    
    -- Only run test if we have both user and product
    IF test_user_id IS NOT NULL AND test_product_id IS NOT NULL THEN
        -- Test order creation
        INSERT INTO orders (
            product_id,
            seller_id,
            buyer_id,
            total_amount,
            platform_fee,
            seller_earnings,
            status,
            payment_method,
            currency
        ) VALUES (
            test_product_id,
            test_user_id,
            test_user_id,
            10.00,
            1.00,
            9.00,
            'pending',
            'crypto',
            'USD'
        ) RETURNING id INTO test_order_id;
        
        -- Clean up test order
        DELETE FROM orders WHERE id = test_order_id;
        
        RAISE NOTICE 'Order creation test: SUCCESS';
    ELSE
        RAISE NOTICE 'Order creation test: SKIPPED (no test data available)';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Order creation test: FAILED - %', SQLERRM;
END $$;

-- 9. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON orders TO authenticated;
GRANT ALL ON products TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 10. Verify the fix
SELECT 
    'Orders table' as component,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') 
         THEN '✅ EXISTS' 
         ELSE '❌ MISSING' 
    END as status
UNION ALL
SELECT 
    'RLS enabled',
    CASE WHEN (SELECT relrowsecurity FROM pg_class WHERE relname = 'orders') 
         THEN '✅ ENABLED' 
         ELSE '❌ DISABLED' 
    END
UNION ALL
SELECT 
    'Insert policy',
    CASE WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND cmd = 'INSERT') 
         THEN '✅ EXISTS' 
         ELSE '❌ MISSING' 
    END
UNION ALL
SELECT 
    'Select policy',
    CASE WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND cmd = 'SELECT') 
         THEN '✅ EXISTS' 
         ELSE '❌ MISSING' 
    END;