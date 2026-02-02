-- Step 5: Insert platform settings and final setup
-- Run this after step 4

-- Insert default platform settings
INSERT INTO public.platform_settings (key, value) VALUES
  ('commission_rate', '{"percentage": 10, "description": "Platform commission rate"}'::jsonb),
  ('featured_products_limit', '{"limit": 6, "description": "Number of featured products to display"}'::jsonb),
  ('max_file_size_mb', '{"size": 500, "description": "Maximum file size for uploads in MB"}'::jsonb),
  ('supported_currencies', '{"currencies": ["BTC", "ETH", "USDT", "USDC", "LTC"], "description": "Supported cryptocurrencies"}'::jsonb),
  ('maintenance_mode', '{"enabled": false, "message": "Site under maintenance", "description": "Maintenance mode toggle"}'::jsonb),
  ('seller_verification_required', '{"enabled": true, "description": "Require seller verification for product approval"}'::jsonb),
  ('auto_approve_products', '{"enabled": false, "description": "Automatically approve products from verified sellers"}'::jsonb),
  ('min_payout_amount', '{"amount": 50, "currency": "USD", "description": "Minimum amount for seller payouts"}'::jsonb);

-- Add constraints for data integrity
ALTER TABLE public.products ADD CONSTRAINT check_price_positive CHECK (price >= 0);
ALTER TABLE public.products ADD CONSTRAINT check_subscription_prices CHECK (
  (pricing_type = 'subscription_monthly' AND subscription_price_monthly > 0) OR
  (pricing_type = 'subscription_yearly' AND subscription_price_yearly > 0) OR
  (pricing_type IN ('one_time', 'custom'))
);

ALTER TABLE public.orders ADD CONSTRAINT check_order_amounts CHECK (
  price >= 0 AND platform_fee >= 0 AND seller_earnings >= 0
);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;