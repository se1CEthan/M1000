-- Add NowPayments support to database schema

-- Add transaction logs table for audit trail
CREATE TABLE IF NOT EXISTS transaction_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  payment_id TEXT,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL,
  paid_amount DECIMAL(10, 8),
  paid_currency TEXT,
  platform_fee DECIMAL(10, 2),
  seller_earnings DECIMAL(10, 2),
  seller_id UUID REFERENCES users(id),
  status TEXT NOT NULL,
  provider TEXT DEFAULT 'nowpayments',
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_transaction_logs_order_id ON transaction_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_transaction_logs_payment_id ON transaction_logs(payment_id);
CREATE INDEX IF NOT EXISTS idx_transaction_logs_seller_id ON transaction_logs(seller_id);
CREATE INDEX IF NOT EXISTS idx_transaction_logs_created_at ON transaction_logs(created_at DESC);

-- Update orders table to support NowPayments
ALTER TABLE orders 
  ADD COLUMN IF NOT EXISTS payment_provider TEXT DEFAULT 'nowpayments',
  ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(10, 8),
  ADD COLUMN IF NOT EXISTS paid_currency TEXT;

-- Update payouts table
ALTER TABLE payouts
  ADD COLUMN IF NOT EXISTS payout_method TEXT DEFAULT 'crypto',
  ADD COLUMN IF NOT EXISTS wallet_network TEXT;

-- Add RLS policies for transaction logs
ALTER TABLE transaction_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view all transaction logs
CREATE POLICY "Admins can view all transaction logs"
  ON transaction_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Sellers can view their own transaction logs
CREATE POLICY "Sellers can view their transaction logs"
  ON transaction_logs FOR SELECT
  TO authenticated
  USING (seller_id = auth.uid());

-- Grant permissions
GRANT SELECT ON transaction_logs TO authenticated;
GRANT ALL ON transaction_logs TO service_role;

-- Add comment
COMMENT ON TABLE transaction_logs IS 'Audit trail for all payment transactions';
