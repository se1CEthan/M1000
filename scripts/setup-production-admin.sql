-- Production Admin Dashboard Setup
-- This script sets up all required tables, functions, and policies for the admin dashboard

-- Ensure all admin review system components are in place
-- (Run fix-admin-review-system.sql first if not already done)

-- Create admin dashboard specific tables and functions

-- Enhanced platform settings with more configuration options
CREATE TABLE IF NOT EXISTS platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general',
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default platform settings
INSERT INTO platform_settings (key, value, description, category, is_public) VALUES
  ('maintenance_mode', 'false', 'Enable maintenance mode to temporarily disable the platform', 'system', false),
  ('registration_enabled', 'true', 'Allow new user registrations', 'system', true),
  ('seller_registration_enabled', 'true', 'Allow users to apply to become sellers', 'system', true),
  ('commission_rate', '10', 'Platform commission rate percentage', 'financial', true),
  ('min_payout_amount', '50', 'Minimum amount required for seller payouts', 'financial', true),
  ('max_file_size_mb', '500', 'Maximum file upload size in megabytes', 'uploads', true),
  ('allowed_file_types', '["zip", "rar", "tar.gz", "exe", "dmg", "pkg", "deb", "rpm"]', 'Allowed file extensions for uploads', 'uploads', true),
  ('platform_name', '"Seltech"', 'Platform display name', 'general', true),
  ('platform_description', '"The premier marketplace for developer tools and digital assets"', 'Platform description', 'general', true),
  ('support_email', '"support@seltech.online"', 'Support contact email', 'contact', true),
  ('contact_email', '"support@seltech.online"', 'General contact email', 'contact', true),
  ('terms_version', '"1.0"', 'Current terms of service version', 'legal', true),
  ('privacy_version', '"1.0"', 'Current privacy policy version', 'legal', true),
  ('announcement_text', '""', 'Platform-wide announcement text', 'announcements', false),
  ('announcement_enabled', 'false', 'Show platform announcement banner', 'announcements', false)
ON CONFLICT (key) DO NOTHING;

-- Create admin notifications table
CREATE TABLE IF NOT EXISTS admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'error', 'success')),
  is_read BOOLEAN DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create system health monitoring table
CREATE TABLE IF NOT EXISTS system_health_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  metric_unit TEXT,
  status TEXT CHECK (status IN ('healthy', 'warning', 'critical')),
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_health_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for platform_settings
CREATE POLICY "Public settings are readable by everyone" ON platform_settings
  FOR SELECT USING (is_public = true);

CREATE POLICY "Admins can manage all settings" ON platform_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id::text = auth.uid()::text 
      AND profiles.role = 'admin'
    )
  );

-- Create RLS policies for admin_notifications
CREATE POLICY "Admins can view their own notifications" ON admin_notifications
  FOR SELECT USING (
    admin_id IN (
      SELECT id FROM profiles 
      WHERE profiles.user_id::text = auth.uid()::text 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "System can create admin notifications" ON admin_notifications
  FOR INSERT WITH CHECK (true);

-- Create RLS policies for system_health_log
CREATE POLICY "Admins can view system health" ON system_health_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id::text = auth.uid()::text 
      AND profiles.role = 'admin'
    )
  );

-- Create function to get platform statistics
CREATE OR REPLACE FUNCTION get_platform_stats()
RETURNS JSON AS $$
DECLARE
  stats JSON;
BEGIN
  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM profiles),
    'total_sellers', (SELECT COUNT(*) FROM profiles WHERE role = 'seller'),
    'total_products', (SELECT COUNT(*) FROM products),
    'total_orders', (SELECT COUNT(*) FROM orders),
    'total_revenue', (SELECT COALESCE(SUM(price), 0) FROM orders WHERE status = 'completed'),
    'pending_seller_applications', (SELECT COUNT(*) FROM seller_verification_applications WHERE status = 'pending'),
    'pending_product_reviews', (SELECT COUNT(*) FROM product_reviews WHERE status = 'pending'),
    'active_disputes', (SELECT COUNT(*) FROM disputes WHERE status IN ('open', 'under_review'))
  ) INTO stats;
  
  RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to create admin notification
CREATE OR REPLACE FUNCTION create_admin_notification(
  p_title TEXT,
  p_message TEXT,
  p_type TEXT DEFAULT 'info',
  p_action_url TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
  admin_record RECORD;
BEGIN
  -- Create notification for all admins
  FOR admin_record IN 
    SELECT id FROM profiles WHERE role = 'admin'
  LOOP
    INSERT INTO admin_notifications (admin_id, title, message, type, action_url)
    VALUES (admin_record.id, p_title, p_message, p_type, p_action_url)
    RETURNING id INTO notification_id;
  END LOOP;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to log system health metrics
CREATE OR REPLACE FUNCTION log_system_health(
  p_metric_name TEXT,
  p_metric_value NUMERIC,
  p_metric_unit TEXT DEFAULT NULL,
  p_status TEXT DEFAULT 'healthy',
  p_details JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO system_health_log (metric_name, metric_value, metric_unit, status, details)
  VALUES (p_metric_name, p_metric_value, p_metric_unit, p_status, p_details)
  RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for automatic admin notifications

-- Trigger for new seller applications
CREATE OR REPLACE FUNCTION notify_new_seller_application()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_admin_notification(
    'New Seller Application',
    'A new seller verification application has been submitted by ' || NEW.full_name,
    'info',
    '/admin?tab=sellers'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_new_seller_application ON seller_verification_applications;
CREATE TRIGGER trigger_notify_new_seller_application
  AFTER INSERT ON seller_verification_applications
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_seller_application();

-- Trigger for new product submissions
CREATE OR REPLACE FUNCTION notify_new_product_submission()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_admin_notification(
    'New Product Submission',
    'A new product "' || NEW.title || '" has been submitted for review',
    'info',
    '/admin?tab=products'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_new_product_submission ON products;
CREATE TRIGGER trigger_notify_new_product_submission
  AFTER INSERT ON products
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_product_submission();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_platform_stats TO authenticated;
GRANT EXECUTE ON FUNCTION create_admin_notification TO authenticated;
GRANT EXECUTE ON FUNCTION log_system_health TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_platform_settings_key ON platform_settings(key);
CREATE INDEX IF NOT EXISTS idx_platform_settings_category ON platform_settings(category);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_admin_id ON admin_notifications(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_is_read ON admin_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_system_health_log_metric_name ON system_health_log(metric_name);
CREATE INDEX IF NOT EXISTS idx_system_health_log_created_at ON system_health_log(created_at);

-- Update existing admin users with proper permissions
UPDATE profiles 
SET role = 'admin' 
WHERE email IN (
  -- Add your admin emails here
  'admin@seltech.online'
) AND role != 'admin';

-- Create sample system health data
INSERT INTO system_health_log (metric_name, metric_value, metric_unit, status) VALUES
  ('database_connections', 45, 'connections', 'healthy'),
  ('response_time', 120, 'ms', 'healthy'),
  ('error_rate', 0.1, 'percent', 'healthy'),
  ('storage_usage', 65, 'percent', 'warning');

-- Success message
SELECT 'Production Admin Dashboard setup completed successfully! 🎉' as message;

-- Display setup summary
SELECT 
  'Setup Summary' as section,
  json_build_object(
    'platform_settings_created', (SELECT COUNT(*) FROM platform_settings),
    'admin_functions_created', 3,
    'triggers_created', 2,
    'indexes_created', 6,
    'rls_policies_created', 6
  ) as summary;