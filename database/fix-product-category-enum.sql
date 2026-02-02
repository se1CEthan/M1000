-- Fix Product Category Enum - Add Missing Categories
-- This script updates the product_category enum to support more categories

-- First, let's see what categories are currently in use
SELECT DISTINCT category, COUNT(*) as count 
FROM products 
GROUP BY category 
ORDER BY count DESC;

-- Add new enum values to product_category
-- Note: PostgreSQL doesn't allow direct modification of enums with existing data
-- We need to add new values one by one

-- Add 'games' category (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'games' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'product_category')) THEN
        ALTER TYPE product_category ADD VALUE 'games';
    END IF;
END $$;

-- Add 'mobile_apps' category (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'mobile_apps' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'product_category')) THEN
        ALTER TYPE product_category ADD VALUE 'mobile_apps';
    END IF;
END $$;

-- Add 'web_development' category (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'web_development' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'product_category')) THEN
        ALTER TYPE product_category ADD VALUE 'web_development';
    END IF;
END $$;

-- Add 'scripts' category (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'scripts' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'product_category')) THEN
        ALTER TYPE product_category ADD VALUE 'scripts';
    END IF;
END $$;

-- Add 'other' category (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'other' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'product_category')) THEN
        ALTER TYPE product_category ADD VALUE 'other';
    END IF;
END $$;

-- Verify the updated enum values
SELECT enumlabel as category_value 
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'product_category')
ORDER BY enumlabel;

-- Show a success message
SELECT 'Product category enum updated successfully! Now supports: bots, software, templates, assets, apis, plugins, games, mobile_apps, web_development, scripts, other' as message;