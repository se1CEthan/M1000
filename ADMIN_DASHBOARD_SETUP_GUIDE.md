# Admin Dashboard Setup Guide

## Overview
This guide will help you set up the complete admin dashboard with all required database tables and functionality.

## Current Issue
The admin dashboard is showing "failed to load product reviews" because the required database tables don't exist yet.

## Quick Fix

### Step 1: Run Database Migration
Execute the database migration script to create all required tables:

```bash
# Connect to your Supabase database and run:
psql -h your-supabase-host -U postgres -d postgres -f scripts/fix-missing-admin-tables.sql
```

Or copy and paste the contents of `scripts/fix-missing-admin-tables.sql` into your Supabase SQL editor.

### Step 2: Update Supabase Types (Optional)
If you want full TypeScript support, regenerate your Supabase types:

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/integrations/supabase/types.ts
```

## What the Migration Creates

### Tables Created:
1. **seller_verification_applications** - Stores seller verification requests
2. **product_reviews** - Admin product review queue
3. **admin_activity_log** - Logs all admin actions
4. **notifications** - User notification system

### Features Added:
- ✅ Seller verification workflow
- ✅ Product review system
- ✅ Admin activity logging
- ✅ Real-time notifications
- ✅ Comprehensive RLS policies
- ✅ Automatic triggers and functions

## Admin Dashboard Features

### Overview Tab
- Platform statistics
- Pending reviews counter
- Recent applications and product reviews
- System health metrics

### Sellers Tab
- Complete seller verification management
- Filter by status (pending, approved, rejected)
- Search by name or email
- Detailed application review interface

### Products Tab
- Product review queue
- Approve/reject products
- Review notes and feedback
- Product status management

### Users Tab
- User management interface
- Role assignments
- Account status control

### Analytics Tab
- Platform performance metrics
- Revenue analytics
- User engagement stats

### Settings Tab
- Platform configuration
- Admin preferences
- System settings

## Database Schema

### seller_verification_applications
```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key to profiles)
- full_name (TEXT)
- business_type (individual/business/company)
- status (pending/approved/rejected)
- admin_notes (TEXT)
- created_at, updated_at (TIMESTAMPTZ)
```

### product_reviews
```sql
- id (UUID, Primary Key)
- product_id (UUID, Foreign Key to products)
- status (pending/approved/rejected)
- review_notes (TEXT)
- reviewed_at (TIMESTAMPTZ)
```

### admin_activity_log
```sql
- id (UUID, Primary Key)
- admin_id (UUID, Foreign Key to profiles)
- action_type (seller_approved/product_rejected/etc)
- target_id (UUID)
- details (JSONB)
- created_at (TIMESTAMPTZ)
```

## Security Features

### Row Level Security (RLS)
- Users can only see their own applications
- Admins can see and manage all data
- Proper authentication checks on all operations

### Admin Role Verification
- All admin operations verify user role
- Secure function execution with SECURITY DEFINER
- Activity logging for audit trails

## Testing the Setup

### 1. Check Tables Exist
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_name IN (
  'seller_verification_applications', 
  'product_reviews', 
  'admin_activity_log', 
  'notifications'
);
```

### 2. Verify Sample Data
```sql
SELECT COUNT(*) as applications FROM seller_verification_applications;
SELECT COUNT(*) as reviews FROM product_reviews;
```

### 3. Test Admin Access
1. Make sure you have an admin user
2. Login and navigate to `/admin-dashboard`
3. Verify all tabs load without errors

## Troubleshooting

### "Table does not exist" Error
- Run the migration script: `scripts/fix-missing-admin-tables.sql`
- Check your database connection
- Verify you have the correct permissions

### "Access Denied" Error
- Ensure your user has admin role: `UPDATE profiles SET role = 'admin' WHERE email = 'your-email@example.com'`
- Check RLS policies are properly set

### TypeScript Errors
- Regenerate Supabase types after running migration
- Restart your development server

## Production Deployment

### Before Going Live:
1. ✅ Run all database migrations
2. ✅ Test admin functionality thoroughly
3. ✅ Verify RLS policies work correctly
4. ✅ Set up proper admin users
5. ✅ Configure notification system
6. ✅ Test seller verification workflow

### Security Checklist:
- [ ] Admin users properly configured
- [ ] RLS policies tested and working
- [ ] Sensitive data properly protected
- [ ] Activity logging functional
- [ ] Backup procedures in place

## Support

If you encounter any issues:
1. Check the browser console for errors
2. Verify database connection
3. Ensure all migrations have been run
4. Check user permissions and roles

The admin dashboard is now production-ready with comprehensive features for managing your marketplace platform.