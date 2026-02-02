-- Step 1: Create enum types
-- Run this first in Supabase SQL Editor

CREATE TYPE user_role AS ENUM ('buyer', 'seller', 'admin');
CREATE TYPE product_status AS ENUM ('draft', 'pending', 'approved', 'rejected', 'suspended');
CREATE TYPE order_status AS ENUM ('pending', 'paid', 'completed', 'refunded', 'disputed');
CREATE TYPE pricing_type AS ENUM ('one_time', 'subscription_monthly', 'subscription_yearly', 'custom');
CREATE TYPE product_category AS ENUM ('bots', 'software', 'templates', 'assets', 'apis', 'plugins');
CREATE TYPE dispute_status AS ENUM ('open', 'under_review', 'resolved', 'closed');