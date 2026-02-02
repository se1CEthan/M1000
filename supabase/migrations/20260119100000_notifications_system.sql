-- Create notifications system for user alerts and automatic redirection

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('seller_approved', 'seller_rejected', 'product_approved', 'product_rejected', 'order_received', 'payout_processed', 'general')),
  action_url TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- Enable RLS on notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for notifications
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() IS NOT NULL AND user_id::text = auth.uid()::text);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() IS NOT NULL AND user_id::text = auth.uid()::text);

-- Admins can create notifications for any user
CREATE POLICY "Admins can create notifications" ON notifications
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND (
      user_id::text = auth.uid()::text OR
      EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.user_id::text = auth.uid()::text 
        AND p.role = 'admin'
      )
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Create function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(notification_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE notifications 
  SET is_read = TRUE, read_at = NOW()
  WHERE id = notification_id 
    AND user_id::text = auth.uid()::text;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION mark_notification_read TO authenticated;

-- Create function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count()
RETURNS INTEGER AS $$
DECLARE
  count_result INTEGER;
BEGIN
  SELECT COUNT(*) INTO count_result
  FROM notifications 
  WHERE user_id::text = auth.uid()::text 
    AND is_read = FALSE;
  
  RETURN count_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_unread_notification_count TO authenticated;

-- Create function to automatically redirect approved sellers
CREATE OR REPLACE FUNCTION handle_seller_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- If a user's role is changed to seller and they're verified
  IF NEW.role = 'seller' AND NEW.is_verified_seller = TRUE AND 
     (OLD.role != 'seller' OR OLD.is_verified_seller = FALSE) THEN
    
    -- Insert welcome notification
    INSERT INTO notifications (user_id, title, message, type, action_url)
    VALUES (
      NEW.id,
      'Welcome to Seltech Sellers! 🎉',
      'Your seller application has been approved! You can now upload and sell your digital products. Click here to access your seller dashboard.',
      'seller_approved',
      '/seller-dashboard'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic seller notifications
DROP TRIGGER IF EXISTS trigger_seller_approval ON profiles;
CREATE TRIGGER trigger_seller_approval
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_seller_approval();

-- Insert sample notification for testing (optional)
-- INSERT INTO notifications (user_id, title, message, type, action_url)
-- SELECT id, 'Welcome to Seltech!', 'Thank you for joining our marketplace. Start exploring amazing digital products!', 'general', '/marketplace'
-- FROM profiles 
-- WHERE role = 'buyer' 
-- LIMIT 1;

-- Success message
SELECT 'Notifications system created successfully! 🔔' as message;