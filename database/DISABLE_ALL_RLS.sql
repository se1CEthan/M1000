-- 🚨 DISABLE ALL RLS POLICIES
-- This script disables Row Level Security on ALL tables in the database
-- WARNING: This removes all security restrictions - use only for debugging/development

-- 1. Drop all existing RLS policies on all tables
DO $$
DECLARE
    table_record RECORD;
    policy_record RECORD;
BEGIN
    -- Loop through all tables that have RLS enabled
    FOR table_record IN 
        SELECT schemaname, tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND rowsecurity = true
    LOOP
        RAISE NOTICE 'Processing table: %.%', table_record.schemaname, table_record.tablename;
        
        -- Drop all policies for this table
        FOR policy_record IN 
            SELECT policyname 
            FROM pg_policies 
            WHERE schemaname = table_record.schemaname 
            AND tablename = table_record.tablename
        LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                policy_record.policyname, 
                table_record.schemaname, 
                table_record.tablename);
            RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
        END LOOP;
        
        -- Disable RLS on the table
        EXECUTE format('ALTER TABLE %I.%I DISABLE ROW LEVEL SECURITY', 
            table_record.schemaname, 
            table_record.tablename);
        RAISE NOTICE 'Disabled RLS on: %.%', table_record.schemaname, table_record.tablename;
    END LOOP;
END $$;

-- 2. Explicitly disable RLS on common tables (in case they weren't caught above)
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payouts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.wishlists DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.disputes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.platform_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.seller_verification_applications DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.product_reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.admin_activity_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.seller_crypto_wallets DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.seller_pending_balances DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.seller_analytics DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.seller_notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.seller_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications DISABLE ROW LEVEL SECURITY;

-- 3. Grant full permissions to all roles on all tables
DO $$
DECLARE
    table_record RECORD;
BEGIN
    FOR table_record IN 
        SELECT schemaname, tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    LOOP
        -- Grant all permissions to authenticated users
        EXECUTE format('GRANT ALL PRIVILEGES ON %I.%I TO authenticated', 
            table_record.schemaname, 
            table_record.tablename);
        
        -- Grant all permissions to anonymous users
        EXECUTE format('GRANT ALL PRIVILEGES ON %I.%I TO anon', 
            table_record.schemaname, 
            table_record.tablename);
        
        -- Grant all permissions to public
        EXECUTE format('GRANT ALL PRIVILEGES ON %I.%I TO public', 
            table_record.schemaname, 
            table_record.tablename);
            
        RAISE NOTICE 'Granted full permissions on: %.%', table_record.schemaname, table_record.tablename;
    END LOOP;
END $$;

-- 4. Verify RLS is disabled on all tables
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN '❌ RLS STILL ENABLED'
        ELSE '✅ RLS DISABLED'
    END as status
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 5. Count remaining policies (should be 0)
SELECT 
    COUNT(*) as remaining_policies,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ ALL POLICIES REMOVED'
        ELSE '❌ POLICIES STILL EXIST'
    END as policy_status
FROM pg_policies 
WHERE schemaname = 'public';

-- 6. Test insert on seller_verification_applications to verify fix
DO $$
DECLARE
    test_id UUID;
BEGIN
    INSERT INTO public.seller_verification_applications (
        user_id,
        full_name,
        selling_reason,
        experience_level,
        terms_accepted,
        commission_rate_accepted
    ) VALUES (
        gen_random_uuid(),
        'RLS Disabled Test',
        'This is a test to verify that RLS has been completely disabled and users can now submit applications.',
        'beginner',
        true,
        true
    ) RETURNING id INTO test_id;
    
    IF test_id IS NOT NULL THEN
        RAISE NOTICE '🎉 SUCCESS: Test insert worked! RLS is fully disabled.';
        
        -- Clean up test data
        DELETE FROM public.seller_verification_applications WHERE id = test_id;
        RAISE NOTICE '🧹 Test data cleaned up';
    ELSE
        RAISE NOTICE '❌ ERROR: Test insert failed';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ ERROR: Test insert failed - %', SQLERRM;
END $$;

-- 7. Final status report
SELECT 
    '🚨 ALL RLS DISABLED' as status,
    'All Row Level Security policies have been removed' as message,
    'All tables are now accessible without restrictions' as warning,
    'Remember to implement proper security before production' as reminder;