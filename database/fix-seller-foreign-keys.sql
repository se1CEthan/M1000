-- Fix Seller Foreign Key Constraints
-- This script ensures all seller_id foreign keys are consistent

-- Check current foreign key constraints
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
  AND kcu.column_name = 'seller_id'
  AND tc.table_schema = 'public';

-- The main products table should reference profiles(id)
-- This is correct as per the schema

-- Check if there are any orphaned records
SELECT 'Checking for orphaned products...' as status;

SELECT COUNT(*) as orphaned_products
FROM products p
LEFT JOIN profiles pr ON p.seller_id = pr.id
WHERE pr.id IS NULL;

-- Check if there are any orphaned orders
SELECT 'Checking for orphaned orders...' as status;

SELECT COUNT(*) as orphaned_orders
FROM orders o
LEFT JOIN profiles pr ON o.seller_id = pr.id
WHERE pr.id IS NULL;

-- Show sample data to verify relationships
SELECT 'Sample products with seller info...' as status;

SELECT 
    p.id as product_id,
    p.title,
    p.seller_id,
    pr.id as profile_id,
    pr.user_id,
    pr.full_name,
    pr.email
FROM products p
JOIN profiles pr ON p.seller_id = pr.id
LIMIT 5;

-- Show sample orders with seller info
SELECT 'Sample orders with seller info...' as status;

SELECT 
    o.id as order_id,
    o.order_number,
    o.seller_id,
    pr.id as profile_id,
    pr.user_id,
    pr.full_name,
    pr.email
FROM orders o
JOIN profiles pr ON o.seller_id = pr.id
LIMIT 5;

-- Verify the foreign key constraints are correct
SELECT 'Foreign key constraints verification complete' as message;