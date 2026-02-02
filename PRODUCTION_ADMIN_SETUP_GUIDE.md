# Production Admin Dashboard Setup Guide

## Overview
This guide will help you set up a fully production-ready admin dashboard for your Seltech marketplace. The admin dashboard includes comprehensive management tools for users, sellers, products, analytics, and platform settings.

## Features Included

### 📊 **Dashboard Overview**
- Real-time platform statistics
- Quick action cards for common tasks
- Key performance indicators
- System health monitoring

### 👥 **User Management**
- View and manage all user accounts
- Change user roles (buyer, seller, admin)
- Suspend/unsuspend users
- Filter and search users
- Track user activity and earnings

### 🏪 **Seller Management**
- Review seller verification applications
- Approve/reject seller applications with notes
- View seller business information and documents
- Track seller performance metrics

### 📦 **Product Management**
- Review product submissions
- Approve/reject products with detailed feedback
- View product files and documentation
- Monitor product performance

### 📈 **Analytics Dashboard**
- Revenue and growth metrics
- User acquisition analytics
- Product category performance
- Time-based activity charts
- Export capabilities

### 📋 **Activity Log**
- Track all admin actions
- Audit trail for compliance
- Filter by action type and date
- Detailed action context

### ⚙️ **Platform Settings**
- Configure platform-wide settings
- Manage commission rates and payouts
- Control registration and features
- Set file upload limits
- Platform announcements

## Setup Instructions

### Step 1: Database Setup
1. **Apply the admin review fix** (if not already done):
   ```sql
   -- Run in Supabase SQL Editor
   -- Copy and paste contents of scripts/fix-admin-review-system.sql
   ```

2. **Set up production admin components**:
   ```sql
   -- Run in Supabase SQL Editor
   -- Copy and paste contents of scripts/setup-production-admin.sql
   ```

### Step 2: Create Admin Users
```sql
-- Run in Supabase SQL Editor
-- Replace with your actual admin email
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'your-admin-email@example.com';
```

### Step 3: Verify Setup
Run the test script to ensure everything is working:
```bash
node scripts/simple-admin-test.js
```

### Step 4: Configure Environment Variables
Ensure your `.env` file has the correct Supabase configuration:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
```

## Admin Dashboard Components

### 1. **AdminStats.tsx**
- Displays key platform metrics
- Real-time statistics cards
- Growth indicators

### 2. **AdminUserManagement.tsx**
- Complete user management interface
- Role assignment and user suspension
- Advanced filtering and search

### 3. **AdminSellerReview.tsx**
- Detailed seller application review
- Document verification
- Approval/rejection workflow

### 4. **AdminProductReview.tsx**
- Product submission review
- File and documentation verification
- Quality assurance workflow

### 5. **AdminAnalytics.tsx**
- Comprehensive analytics dashboard
- Revenue and user growth metrics
- Category performance analysis

### 6. **AdminActivityLog.tsx**
- Complete audit trail
- Action tracking and filtering
- Compliance reporting

### 7. **AdminSettings.tsx**
- Platform configuration management
- Feature toggles and limits
- Financial settings

## Security Features

### Role-Based Access Control (RLS)
- All admin functions protected by RLS policies
- Only users with `role = 'admin'` can access admin features
- Granular permissions for different admin actions

### Activity Logging
- All admin actions are automatically logged
- Includes timestamps, admin ID, and action details
- Immutable audit trail for compliance

### Data Protection
- Sensitive settings are admin-only
- Public settings are clearly marked
- Secure handling of user data

## Production Considerations

### Performance Optimization
- Database indexes on frequently queried columns
- Efficient pagination for large datasets
- Optimized queries with proper joins

### Monitoring & Alerts
- System health monitoring
- Automatic admin notifications
- Error tracking and reporting

### Backup & Recovery
- Regular database backups
- Admin action logging for recovery
- Configuration backup procedures

## Usage Guide

### Accessing the Admin Dashboard
1. Log in with an admin account
2. Navigate to `/admin` or click "Admin Dashboard" in the navigation
3. Use the tabs to navigate between different sections

### Managing Users
1. Go to the "Users" tab
2. Use filters to find specific users
3. Click on a user to view details
4. Use the role dropdown to change user roles
5. Use the shield button to suspend users

### Reviewing Sellers
1. Go to the "Sellers" tab
2. Click "Review" on pending applications
3. Review all provided information and documents
4. Add admin notes and approve/reject

### Managing Products
1. Go to the "Products" tab
2. Click "Review" on pending products
3. Check product files and documentation
4. Provide feedback and approve/reject

### Viewing Analytics
1. Go to the "Analytics" tab
2. Select time range for analysis
3. Review key metrics and trends
4. Use data for business decisions

### Configuring Settings
1. Go to the "Settings" tab
2. Modify platform configuration
3. Save changes (affects all users immediately)
4. Monitor impact through analytics

## Troubleshooting

### Common Issues

**Admin access denied:**
- Verify user has `role = 'admin'` in profiles table
- Check RLS policies are properly applied
- Ensure user is properly authenticated

**Missing data in dashboard:**
- Run database health check script
- Verify all required tables exist
- Check for RLS policy conflicts

**Performance issues:**
- Monitor database query performance
- Check for missing indexes
- Optimize large dataset queries

### Support Commands

**Check admin status:**
```sql
SELECT id, email, role FROM profiles WHERE role = 'admin';
```

**Verify table structure:**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%admin%';
```

**Check RLS policies:**
```sql
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('profiles', 'seller_verification_applications', 'admin_activity_log');
```

## Maintenance

### Regular Tasks
- Review admin activity logs weekly
- Monitor system health metrics
- Update platform settings as needed
- Review and approve pending items daily

### Monthly Reviews
- Analyze platform analytics
- Review user growth and engagement
- Update commission rates if needed
- Check system performance metrics

### Security Audits
- Review admin access logs
- Verify RLS policies are working
- Check for suspicious activity
- Update admin passwords regularly

## Success Indicators

After setup, you should be able to:
- ✅ Access admin dashboard without errors
- ✅ View real-time platform statistics
- ✅ Manage user accounts and roles
- ✅ Review and approve seller applications
- ✅ Review and approve product submissions
- ✅ View comprehensive analytics
- ✅ Configure platform settings
- ✅ Track all admin activities

The admin dashboard is now ready for production use! 🎉

## Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Review the database logs in Supabase
3. Verify all setup steps were completed
4. Check the browser console for JavaScript errors

For additional support, refer to the project documentation or contact the development team.