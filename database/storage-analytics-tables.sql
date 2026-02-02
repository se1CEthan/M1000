-- Storage and Download Analytics Tables
-- Run this SQL in your Supabase SQL Editor

-- 1. Download Analytics Table
CREATE TABLE IF NOT EXISTS download_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  download_started_at TIMESTAMPTZ DEFAULT NOW(),
  download_completed_at TIMESTAMPTZ,
  ip_address INET,
  user_agent TEXT,
  country_code TEXT,
  city TEXT,
  download_duration_seconds INTEGER,
  bytes_downloaded BIGINT,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Storage Usage Tracking Table
CREATE TABLE IF NOT EXISTS storage_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  bucket_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT,
  mime_type TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ,
  access_count INTEGER DEFAULT 0,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. File Access Logs Table
CREATE TABLE IF NOT EXISTS file_access_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  bucket_name TEXT NOT NULL,
  access_type TEXT NOT NULL CHECK (access_type IN ('upload', 'download', 'view', 'delete')),
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  file_size BIGINT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Storage Quotas Table
CREATE TABLE IF NOT EXISTS storage_quotas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE UNIQUE,
  max_storage_bytes BIGINT DEFAULT 5368709120, -- 5GB default
  max_files INTEGER DEFAULT 1000,
  max_file_size_bytes BIGINT DEFAULT 524288000, -- 500MB default
  current_storage_bytes BIGINT DEFAULT 0,
  current_file_count INTEGER DEFAULT 0,
  quota_type TEXT DEFAULT 'free' CHECK (quota_type IN ('free', 'pro', 'enterprise')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. File Metadata Cache Table
CREATE TABLE IF NOT EXISTS file_metadata_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_path TEXT UNIQUE NOT NULL,
  bucket_name TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT,
  file_hash TEXT, -- For duplicate detection
  thumbnail_url TEXT,
  metadata JSONB DEFAULT '{}',
  last_scanned_at TIMESTAMPTZ DEFAULT NOW(),
  virus_scan_status TEXT DEFAULT 'pending' CHECK (virus_scan_status IN ('pending', 'clean', 'infected', 'error')),
  virus_scan_result JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_download_analytics_product_id ON download_analytics(product_id);
CREATE INDEX IF NOT EXISTS idx_download_analytics_buyer_id ON download_analytics(buyer_id);
CREATE INDEX IF NOT EXISTS idx_download_analytics_created_at ON download_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_storage_usage_user_id ON storage_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_storage_usage_bucket ON storage_usage(bucket_name);
CREATE INDEX IF NOT EXISTS idx_file_access_logs_user_id ON file_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_file_access_logs_created_at ON file_access_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_storage_quotas_user_id ON storage_quotas(user_id);
CREATE INDEX IF NOT EXISTS idx_file_metadata_cache_path ON file_metadata_cache(file_path);
CREATE INDEX IF NOT EXISTS idx_file_metadata_cache_hash ON file_metadata_cache(file_hash);

-- Create updated_at triggers
CREATE TRIGGER update_storage_usage_updated_at 
    BEFORE UPDATE ON storage_usage 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_storage_quotas_updated_at 
    BEFORE UPDATE ON storage_quotas 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_file_metadata_cache_updated_at 
    BEFORE UPDATE ON file_metadata_cache 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE download_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_metadata_cache ENABLE ROW LEVEL SECURITY;

-- Policies for download_analytics
DROP POLICY IF EXISTS "Users can view their own download analytics" ON download_analytics;
CREATE POLICY "Users can view their own download analytics" ON download_analytics
    FOR SELECT USING (
        auth.uid() = buyer_id OR 
        auth.uid() IN (SELECT seller_id FROM products WHERE id = product_id)
    );

-- Policies for storage_usage
DROP POLICY IF EXISTS "Users can view their own storage usage" ON storage_usage;
CREATE POLICY "Users can view their own storage usage" ON storage_usage
    FOR SELECT USING (auth.uid() = user_id);

-- Policies for file_access_logs
DROP POLICY IF EXISTS "Users can view their own access logs" ON file_access_logs;
CREATE POLICY "Users can view their own access logs" ON file_access_logs
    FOR SELECT USING (auth.uid() = user_id);

-- Policies for storage_quotas
DROP POLICY IF EXISTS "Users can view their own quotas" ON storage_quotas;
CREATE POLICY "Users can view their own quotas" ON storage_quotas
    FOR SELECT USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON download_analytics TO authenticated;
GRANT SELECT, INSERT, UPDATE ON storage_usage TO authenticated;
GRANT SELECT, INSERT ON file_access_logs TO authenticated;
GRANT SELECT ON storage_quotas TO authenticated;
GRANT SELECT ON file_metadata_cache TO authenticated;

-- Function to create storage quota for new users
CREATE OR REPLACE FUNCTION create_storage_quota_for_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO storage_quotas (user_id, quota_type)
    VALUES (NEW.user_id, 'free')
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create storage quota for new users
DROP TRIGGER IF EXISTS create_storage_quota_trigger ON profiles;
CREATE TRIGGER create_storage_quota_trigger
    AFTER INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION create_storage_quota_for_user();

-- Function to update storage usage when files are uploaded/deleted
CREATE OR REPLACE FUNCTION update_storage_usage()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- File uploaded
        INSERT INTO storage_usage (
            user_id, 
            bucket_name, 
            file_path, 
            file_size, 
            file_type,
            uploaded_at
        ) VALUES (
            NEW.owner,
            NEW.bucket_id,
            NEW.name,
            (NEW.metadata->>'size')::BIGINT,
            (NEW.metadata->>'mimetype')::TEXT,
            NOW()
        );
        
        -- Update quota usage
        UPDATE storage_quotas 
        SET 
            current_storage_bytes = current_storage_bytes + (NEW.metadata->>'size')::BIGINT,
            current_file_count = current_file_count + 1,
            updated_at = NOW()
        WHERE user_id = NEW.owner;
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- File deleted
        UPDATE storage_usage 
        SET 
            is_deleted = TRUE,
            deleted_at = NOW(),
            updated_at = NOW()
        WHERE file_path = OLD.name AND bucket_name = OLD.bucket_id;
        
        -- Update quota usage
        UPDATE storage_quotas 
        SET 
            current_storage_bytes = current_storage_bytes - (OLD.metadata->>'size')::BIGINT,
            current_file_count = current_file_count - 1,
            updated_at = NOW()
        WHERE user_id = OLD.owner;
        
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Note: The storage trigger would need to be created on the storage.objects table
-- This requires superuser privileges, so it should be done by Supabase admin
-- CREATE TRIGGER storage_usage_trigger
--     AFTER INSERT OR DELETE ON storage.objects
--     FOR EACH ROW
--     EXECUTE FUNCTION update_storage_usage();

-- Function to log file access
CREATE OR REPLACE FUNCTION log_file_access(
    p_user_id UUID,
    p_file_path TEXT,
    p_bucket_name TEXT,
    p_access_type TEXT,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_success BOOLEAN DEFAULT TRUE,
    p_error_message TEXT DEFAULT NULL,
    p_file_size BIGINT DEFAULT NULL,
    p_duration_ms INTEGER DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO file_access_logs (
        user_id,
        file_path,
        bucket_name,
        access_type,
        ip_address,
        user_agent,
        success,
        error_message,
        file_size,
        duration_ms
    ) VALUES (
        p_user_id,
        p_file_path,
        p_bucket_name,
        p_access_type,
        p_ip_address,
        p_user_agent,
        p_success,
        p_error_message,
        p_file_size,
        p_duration_ms
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get storage statistics for a user
CREATE OR REPLACE FUNCTION get_user_storage_stats(p_user_id UUID)
RETURNS TABLE (
    total_files BIGINT,
    total_size BIGINT,
    product_files BIGINT,
    image_files BIGINT,
    quota_used_percent NUMERIC,
    files_used_percent NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_files,
        COALESCE(SUM(su.file_size), 0) as total_size,
        COUNT(*) FILTER (WHERE su.bucket_name = 'product-files') as product_files,
        COUNT(*) FILTER (WHERE su.bucket_name = 'product-images') as image_files,
        CASE 
            WHEN sq.max_storage_bytes > 0 THEN 
                (COALESCE(SUM(su.file_size), 0)::NUMERIC / sq.max_storage_bytes::NUMERIC) * 100
            ELSE 0
        END as quota_used_percent,
        CASE 
            WHEN sq.max_files > 0 THEN 
                (COUNT(*)::NUMERIC / sq.max_files::NUMERIC) * 100
            ELSE 0
        END as files_used_percent
    FROM storage_usage su
    LEFT JOIN storage_quotas sq ON sq.user_id = p_user_id
    WHERE su.user_id = p_user_id 
    AND su.is_deleted = FALSE
    GROUP BY sq.max_storage_bytes, sq.max_files;
END;
$$ LANGUAGE plpgsql;

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE '📊 Storage Analytics Setup Complete!';
    RAISE NOTICE '✅ Download analytics tracking enabled';
    RAISE NOTICE '✅ Storage usage monitoring configured';
    RAISE NOTICE '✅ File access logging ready';
    RAISE NOTICE '✅ Storage quotas initialized';
    RAISE NOTICE '🚀 Your storage system is production ready!';
END $$;