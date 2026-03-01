# 🚀 Seller Verification Setup Guide

## Quick Setup Instructions

The seller verification review system is now integrated into the admin dashboard. Follow these steps to set it up:

### 1. Database Setup

Run the database setup script to create the seller verification applications table:

```bash
# Option 1: Simple setup (recommended)
psql $DATABASE_URL -f database/simple-seller-verification-setup.sql

# Option 2: Full setup with detailed schema info
psql $DATABASE_URL -f database/seller-verification-applications-setup.sql
```

### 2. Verify Database Setup

Test that the database is set up correctly:

```bash
# Run the test script
node scripts/test-seller-verification-review.js
```

### 3. Access Admin Dashboard

1. **Login as Admin**: Ensure your user has `role = 'admin'` in the profiles table
2. **Navigate to Admin Dashboard**: Go to `/admin` or click Admin in the navigation
3. **Access Verification Tab**: Click on the "Verification" tab in the admin dashboard

### 4. Admin User Setup

If you need to create an admin user:

```sql
-- Update your user to admin role
UPDATE profiles SET role = 'admin' WHERE email = 'your-email@example.com';
```

## Features Available

### ✅ **Seller Verification Review**
- **Application List**: View all seller verification applications
- **Detailed Review**: Complete applicant information display
- **Approve/Reject**: One-click approval or rejection with notes
- **Status Tracking**: Real-time status updates
- **Mobile Responsive**: Works on all devices

### ✅ **Admin Dashboard Integration**
- **Verification Tab**: Dedicated tab for seller verification
- **Real-time Updates**: Live data refresh every 30 seconds
- **Search & Filter**: Find applications by name, status, business type
- **Mobile Navigation**: Touch-friendly tab navigation

### ✅ **Application Information**
- **Personal Details**: Name, phone, date of birth, address
- **Business Information**: Business type, name, registration, tax ID
- **Selling Details**: Reason for selling, product categories, expected sales
- **Terms Acceptance**: Verification of terms and commission acceptance

## Sample Data

The setup script includes sample applications for testing:

1. **John Smith** (Individual) - Pending
2. **Sarah Johnson** (Business) - Pending  
3. **Mike Chen** (Individual) - Under Review
4. **Emma Wilson** (Business) - Approved
5. **David Rodriguez** (Individual) - Rejected

## Admin Actions

### Approve Application
1. Click "Review" on any pending application
2. Review all applicant information
3. Add optional admin notes
4. Click "Approve" button
5. User profile automatically updates to 'seller' role

### Reject Application
1. Click "Review" on any pending application
2. Review applicant information
3. Add admin notes explaining rejection reason
4. Click "Reject" button
5. Application status updates to 'rejected'

## Mobile Experience

The seller verification system is fully mobile-responsive:

- **Touch-Friendly**: Large buttons optimized for touch
- **Responsive Layout**: Adapts to all screen sizes
- **Abbreviated Labels**: Shortened text on mobile screens
- **Swipe Navigation**: Horizontal scrolling for tables

## Troubleshooting

### Database Issues
```bash
# If table doesn't exist, run setup again
psql $DATABASE_URL -f database/simple-seller-verification-setup.sql

# Check if table exists
psql $DATABASE_URL -c "SELECT COUNT(*) FROM seller_verification_applications;"
```

### Permission Issues
```sql
-- Grant permissions if needed
GRANT ALL ON public.seller_verification_applications TO authenticated;
GRANT ALL ON public.seller_verification_applications TO anon;
```

### Admin Access Issues
```sql
-- Verify admin role
SELECT email, role FROM profiles WHERE role = 'admin';

-- Create admin user if needed
UPDATE profiles SET role = 'admin' WHERE email = 'your-email@example.com';
```

## Testing the System

### 1. Test Database Connection
```bash
node scripts/test-seller-verification-review.js
```

### 2. Test Admin Dashboard
1. Login as admin user
2. Navigate to Admin Dashboard
3. Click "Verification" tab
4. Verify applications are displayed
5. Test approve/reject functionality

### 3. Test Mobile Responsiveness
1. Open admin dashboard on mobile device
2. Navigate to Verification tab
3. Test touch interactions
4. Verify responsive layout

## Production Deployment

### 1. Environment Setup
- Ensure production database is configured
- Verify Supabase credentials are correct
- Test database connectivity

### 2. Deploy Application
```bash
# Build and deploy
npm run build
npm run deploy
```

### 3. Verify Production
- Test admin dashboard access
- Verify seller verification tab works
- Test approve/reject functionality
- Monitor real-time updates

## 🎉 Ready for Production!

The seller verification review system is now **fully operational** and ready for production use:

✅ **Complete application review workflow**  
✅ **Mobile-responsive interface**  
✅ **Real-time updates**  
✅ **Secure admin controls**  
✅ **Professional UI/UX**  

Administrators can now efficiently review and approve seller applications from any device! 🚀📱