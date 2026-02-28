-- Create payouts table to track seller payouts
CREATE TABLE IF NOT EXISTS payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  wallet_address TEXT,
  network TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  payout_id TEXT, -- Cryptomus payout ID
  error_message TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_payouts_order_id ON payouts(order_id);
CREATE INDEX IF NOT EXISTS idx_payouts_seller_id ON payouts(seller_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(status);
CREATE INDEX IF NOT EXISTS idx_payouts_created_at ON payouts(created_at DESC);

-- Enable RLS
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

-- Sellers can view their own payouts
CREATE POLICY "Sellers can view own payouts"
  ON payouts FOR SELECT
  USING (seller_id = auth.uid());

-- Admins can view all payouts
CREATE POLICY "Admins can view all payouts"
  ON payouts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- System can insert payouts
CREATE POLICY "System can insert payouts"
  ON payouts FOR INSERT
  WITH CHECK (true);

-- Add comment
COMMENT ON TABLE payouts IS 'Tracks seller payouts with 90/10 split';
