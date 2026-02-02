-- PesaPal Integration Database Setup
-- Adds PesaPal-specific columns and tables for payment processing

-- Add PesaPal columns to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS pesapal_tracking_id TEXT,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';

-- Create seller payouts table for 90/10 split
CREATE TABLE IF NOT EXISTS seller_payouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'KES',
  payout_method TEXT DEFAULT 'bank_transfer',
  bank_account TEXT,
  mobile_number TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create platform earnings table
CREATE TABLE IF NOT EXISTS platform_earnings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'KES',
  source TEXT DEFAULT 'order_commission',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_pesapal_tracking ON orders(pesapal_tracking_id);
CREATE INDEX IF NOT EXISTS idx_seller_payouts_seller ON seller_payouts(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_payouts_status ON seller_payouts(status);
CREATE INDEX IF NOT EXISTS idx_platform_earnings_order ON platform_earnings(order_id);

-- Enable RLS (Row Level Security)
ALTER TABLE seller_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_earnings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for seller_payouts
CREATE POLICY "Sellers can view their own payouts" ON seller_payouts
  FOR SELECT USING (auth.uid() = seller_id);

CREATE POLICY "Service role can manage all payouts" ON seller_payouts
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS Policies for platform_earnings (admin only)
CREATE POLICY "Only service role can access platform earnings" ON platform_earnings
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Update orders table RLS to allow pesapal_tracking_id updates
DROP POLICY IF EXISTS "Users can update their own orders" ON orders;
CREATE POLICY "Users can update their own orders" ON orders
  FOR UPDATE USING (
    auth.uid() = buyer_id OR 
    auth.uid() = seller_id OR
    auth.jwt() ->> 'role' = 'service_role'
  );

-- Create function to update seller stats
CREATE OR REPLACE FUNCTION update_seller_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update seller's total earnings and sales count
  UPDATE profiles 
  SET 
    total_earnings = COALESCE(total_earnings, 0) + NEW.seller_earnings,
    total_sales = COALESCE(total_sales, 0) + 1,
    updated_at = NOW()
  WHERE user_id = NEW.seller_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update seller stats when order is paid
DROP TRIGGER IF EXISTS update_seller_stats_trigger ON orders;
CREATE TRIGGER update_seller_stats_trigger
  AFTER UPDATE OF status ON orders
  FOR EACH ROW
  WHEN (NEW.status = 'paid' AND OLD.status != 'paid')
  EXECUTE FUNCTION update_seller_stats();

-- Insert sample platform settings for PesaPal
INSERT INTO platform_settings (key, value, description) VALUES
  ('pesapal_consumer_key', 'weWg875DVTHfXKyPK2w2qq0SuZjLKnFx', 'PesaPal Consumer Key'),
  ('pesapal_consumer_secret', 'owNK+kmjk1tgSYIfOGxuvnxCSos=', 'PesaPal Consumer Secret'),
  ('pesapal_base_url', 'https://pay.pesapal.com/v3', 'PesaPal API Base URL'),
  ('platform_fee_percentage', '10', 'Platform fee percentage (10%)'),
  ('seller_earnings_percentage', '90', 'Seller earnings percentage (90%)')
ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value,
  updated_at = NOW();

-- Create notification templates for PesaPal
INSERT INTO notification_templates (type, title, message) VALUES
  ('pesapal_payment_success', 'Payment Successful! 🎉', 'Your PesaPal payment has been processed successfully.'),
  ('pesapal_payment_failed', 'Payment Failed ❌', 'Your PesaPal payment could not be processed.'),
  ('pesapal_sale_notification', 'New Sale via PesaPal! 💰', 'You received a payment through PesaPal.'),
  ('pesapal_payout_pending', 'Payout Processing 💰', 'Your earnings are being processed for payout.')
ON CONFLICT (type) DO UPDATE SET 
  title = EXCLUDED.title,
  message = EXCLUDED.message,
  updated_at = NOW();

-- Grant necessary permissions
GRANT ALL ON seller_payouts TO authenticated;
GRANT ALL ON platform_earnings TO service_role;
GRANT SELECT ON platform_earnings TO authenticated;

COMMIT;