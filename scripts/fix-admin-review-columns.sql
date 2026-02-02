-- Fix missing columns for admin review functionality
-- Run this in Supabase SQL Editor

-- First, check what columns exist in profiles table
DO $$ 
BEGIN
    -- Add missing columns to profiles table if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'verification_reviewed_at') THEN
        ALTER TABLE profiles ADD COLUMN verification_reviewed_at TIMESTAMPTZ;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'verification_reviewed_by') THEN
        ALTER TABLE profiles ADD COLUMN verification_reviewed_by UUID REFERENCES profiles(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'verification_status') THEN
        ALTER TABLE profiles ADD COLUMN verification_status TEXT DEFAULT 'approved' CHECK (verification_status IN ('pending', 'under_review', 'approved', 'rejected'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'verification_submitted_at') THEN
        ALTER TABLE profiles ADD COLUMN verification_submitted_at TIMESTAMPTZ;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'verification_notes') THEN
        ALTER TABLE profiles ADD COLUMN verification_notes TEXT;
    END IF;
END $$;

-- Update existing users to have proper verification status
UPDATE profiles 
SET verification_status = CASE 
  WHEN role = 'seller' AND is_verified_seller = true THEN 'approved'
  WHEN role = 'seller' AND is_verified_seller = false THEN 'pending'
  ELSE 'approved'
END
WHERE verification_status IS NULL OR verification_status = '';

-- Ensure seller_verification_applications table exists with proper structure
CREATE TABLE IF NOT EXISTS seller_verification_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  phone_number TEXT NOT NULL,
  address JSONB NOT NULL DEFAULT '{}',
  business_type TEXT NOT NULL CHECK (business_type IN ('individual', 'business', 'company')),
  business_name TEXT,
  business_registration TEXT,
  tax_id TEXT,
  selling_reason TEXT NOT NULL,
  experience_level TEXT NOT NULL CHECK (experience_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  product_categories TEXT[] NOT NULL DEFAULT '{}',
  expected_monthly_sales INTEGER DEFAULT 0,
  portfolio_url TEXT,
  previous_platforms TEXT[] DEFAULT '{}',
  identity_document_url TEXT,
  business_document_url TEXT,
  terms_accepted BOOLEAN NOT NULL DEFAULT false,
  terms_version TEXT NOT NULL DEFAULT '1.0',
  commission_rate_accepted BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'additional_info_required')),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on seller_verification_applications if not already enabled
ALTER TABLE seller_verification_applications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own verification applications" ON seller_verification_applications;
DROP POLICY IF EXISTS "Users can create their own verification applications" ON seller_verification_applications;
DROP POLICY IF EXISTS "Users can update their own pending applications" ON seller_verification_applications;
DROP POLICY IF EXISTS "Admins can view all verification applications" ON seller_verification_applications;
DROP POLICY IF EXISTS "Admins can update verification applications" ON seller_verification_applications;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON seller_verification_applications;

-- Create proper RLS policies for seller_verification_applications
CREATE POLICY "Users can view their own verification applications" ON seller_verification_applications
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      user_id = auth.uid() OR
      EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    )
  );

CREATE POLICY "Users can create their own verification applications" ON seller_verification_applications
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "Users can update their own pending applications" ON seller_verification_applications
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND (
      (user_id = auth.uid() AND status = 'pending') OR
      EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    )
  );

-- Create admin activity log table if it doesn't exist
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES profiles(id),
  action_type TEXT NOT NULL CHECK (action_type IN ('seller_approved', 'seller_rejected', 'product_approved', 'product_rejected', 'user_suspended', 'user_unsuspended')),
  target_id UUID NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('user', 'product', 'order')),
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on admin_activity_log
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;

-- Create proper policy for admin_activity_log
DROP POLICY IF EXISTS "Allow admin activity log access" ON admin_activity_log;
DROP POLICY IF EXISTS "Admins can view activity log" ON admin_activity_log;
DROP POLICY IF EXISTS "Admins can create activity log entries" ON admin_activity_log;

CREATE POLICY "Admins can manage activity log" ON admin_activity_log
  FOR ALL USING (
    auth.uid() IS NOT NULL AND
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- Create or replace the log_admin_activity function
CREATE OR REPLACE FUNCTION log_admin_activity(
  p_admin_id UUID,
  p_action_type TEXT,
  p_target_id UUID,
  p_target_type TEXT,
  p_details JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  activity_id UUID;
BEGIN
  INSERT INTO admin_activity_log (admin_id, action_type, target_id, target_type, details)
  VALUES (p_admin_id, p_action_type, p_target_id, p_target_type, p_details)
  RETURNING id INTO activity_id;
  
  RETURN activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION log_admin_activity TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_seller_verification_applications_user_id ON seller_verification_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_seller_verification_applications_status ON seller_verification_applications(status);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_admin_id ON admin_activity_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_profiles_verification_status ON profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Verify the fix by checking column existence
SELECT 
  'Column Check' as check_type,
  CASE 
    WHEN COUNT(*) >= 5 THEN '✅ All verification columns exist in profiles table'
    ELSE '❌ Missing columns: ' || (5 - COUNT(*))::text
  END as status
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name IN ('verification_reviewed_at', 'verification_reviewed_by', 'verification_status', 'verification_submitted_at', 'verification_notes');

-- Check seller_verification_applications table
SELECT 
  'Table Check' as check_type,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ seller_verification_applications table exists'
    ELSE '❌ seller_verification_applications table missing'
  END as status
FROM information_schema.tables 
WHERE table_name = 'seller_verification_applications';

-- Check admin_activity_log table
SELECT 
  'Admin Log Check' as check_type,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ admin_activity_log table exists'
    ELSE '❌ admin_activity_log table missing'
  END as status
FROM information_schema.tables 
WHERE table_name = 'admin_activity_log';

-- Success message
SELECT 'Admin review columns and tables fixed successfully! 🎉' as message;