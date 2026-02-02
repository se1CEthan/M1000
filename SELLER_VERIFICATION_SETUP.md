# Seller Verification System Setup Guide

## Overview
The seller verification system ensures that only legitimate sellers can upload products to the Seltech marketplace. It includes a comprehensive application process, admin review system, and automatic product review queue.

## Database Setup

### 1. Apply the Seller Verification Migration
Run the following SQL in your Supabase SQL Editor:

```sql
-- Copy and paste the contents of supabase/migrations/20260119000000_seller_verification.sql
```

### 2. Setup Storage Buckets
Run the following SQL to create verification document storage:

```sql
-- Copy and paste the contents of scripts/setup-verification-storage.sql
```

## Features Implemented

### 🔐 Seller Verification Process
- **Comprehensive Application Form**: Personal info, business details, selling motivation
- **Document Upload**: Identity verification and business registration documents
- **Terms Acceptance**: 90/10 commission split agreement and platform terms
- **Experience Assessment**: Skill level and previous platform experience
- **Category Selection**: Product types the seller plans to offer

### 👨‍💼 Admin Dashboard
- **Application Review**: Detailed seller application review interface
- **Product Approval**: Review and approve/reject product submissions
- **Activity Logging**: Track all admin actions for audit purposes
- **Statistics Overview**: Pending applications, approved sellers, product reviews

### 📊 Verification Status Tracking
- **Pending**: Initial application submitted
- **Under Review**: Admin is reviewing the application
- **Approved**: Seller verified and can upload products
- **Rejected**: Application denied with admin notes
- **Additional Info Required**: More information needed

### 🛡️ Security & Compliance
- **Row Level Security**: Users can only access their own data
- **Admin Permissions**: Only admins can review applications
- **Document Security**: Verification documents are private by default
- **Audit Trail**: All admin actions are logged

## User Flow

### For Sellers
1. **Click "Start Selling"** → Redirected to seller verification
2. **Complete Application** → Fill out comprehensive form
3. **Upload Documents** → Identity and business verification
4. **Accept Terms** → 90/10 commission split and platform terms
5. **Wait for Review** → Admin reviews application (2-5 business days)
6. **Get Approved** → Access to seller dashboard and product upload

### For Admins
1. **Access Admin Dashboard** → `/admin-dashboard` (admin role required)
2. **Review Applications** → View detailed seller information
3. **Make Decision** → Approve or reject with notes
4. **Review Products** → Approve/reject product submissions
5. **Monitor Activity** → Track all admin actions

## Routes Added

- `/seller-verification` - Seller verification application page
- `/admin-dashboard` - Admin review dashboard
- `/seller-dashboard` - Enhanced seller dashboard (existing)

## Database Tables Created

### seller_verification_applications
- Stores detailed seller application data
- Includes personal info, business details, documents
- Tracks application status and admin reviews

### product_reviews
- Automatic review queue for all product submissions
- Links products to review status and admin feedback
- Tracks approval/rejection reasons

### admin_activity_log
- Audit trail for all admin actions
- Logs seller approvals, product reviews, user actions
- Includes detailed action metadata

## Commission Structure

**90% Seller / 10% Platform Split**
- Sellers keep 90% of all sales
- Platform takes 10% commission
- Clearly disclosed in verification process
- Must be accepted to become seller

## Verification Requirements

### Personal Information
- Full legal name
- Date of birth
- Phone number
- Complete address

### Business Information
- Business type (individual/business/company)
- Business registration (if applicable)
- Tax ID (if applicable)
- Selling motivation (minimum 50 characters)

### Experience & Portfolio
- Experience level (beginner to expert)
- Product categories to sell
- Expected monthly sales
- Portfolio/website URL (optional)
- Previous selling platforms

### Documents
- Government-issued ID (required)
- Business registration documents (if business/company)

## Admin Review Process

### Application Review
1. **Personal Verification**: Check identity documents
2. **Business Validation**: Verify business registration if applicable
3. **Motivation Assessment**: Review selling reasons and experience
4. **Risk Evaluation**: Check for red flags or policy violations
5. **Decision**: Approve, reject, or request additional information

### Product Review
1. **Content Check**: Ensure original or properly licensed
2. **Quality Assessment**: Verify product meets standards
3. **Policy Compliance**: Check against platform policies
4. **Technical Review**: Test demos and documentation links
5. **Approval**: Approve for marketplace or reject with feedback

## Security Considerations

### Data Protection
- Personal information encrypted at rest
- Documents stored in private buckets
- Access controlled via RLS policies
- Admin actions logged for accountability

### Fraud Prevention
- Identity document verification required
- Business registration validation
- Experience and motivation assessment
- Admin review of all applications

## Next Steps

1. **Apply Database Migration**: Run the SQL migration
2. **Setup Storage Buckets**: Configure document storage
3. **Test Verification Flow**: Submit test application
4. **Train Admin Users**: Review admin dashboard features
5. **Monitor Applications**: Track seller verification metrics

## Support & Maintenance

### Regular Tasks
- Review pending applications (target: 2-5 business days)
- Monitor product submissions
- Update verification requirements as needed
- Review and update commission structure

### Metrics to Track
- Application approval rate
- Time to review applications
- Product approval rate
- Seller satisfaction scores
- Platform revenue from commissions

The seller verification system is now fully implemented and ready for production use!