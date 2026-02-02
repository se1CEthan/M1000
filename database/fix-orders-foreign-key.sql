-- Fix Orders Foreign Key Constraint Issue
-- This script addresses the foreign key constraint violation for orders.buyer_id

-- First, let's check the current foreign key constraints
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_namedomain.com/order-success?order=12345
      
      How it Work
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name='orders';

-- Drop the existing foreign key constraint if it exists
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_buyer_id_fkey;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_seller_id_fkey;

-- Recreate the foreign key constraints with proper references
-- Assuming profiles table has 'user_id' as the primary key
ALTER TABLE orders 
ADD CONSTRAINT orders_buyer_id_fkey 
FOREIGN KEY (buyer_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

ALTER TABLE orders 
ADD CONSTRAINT orders_seller_id_fkey 
FOREIGN KEY (seller_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

-- Alternative: If the constraint should reference auth.users instead
-- ALTER TABLE orders 
-- ADD CONSTRAINT orders_buyer_id_fkey 
-- FOREIGN KEY (buyer_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Alternative: If we need to disable foreign key checks temporarily
-- ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_buyer_id_fkey;
-- ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_seller_id_fkey;

-- Check the results
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name='orders';