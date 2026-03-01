# Seltech Marketplace - Production Deployment Checklist

## 🗄️ Database Setup

### ✅ Supabase Configuration
- [ ] Create Supabase project
- [ ] Run production migrations: `./scripts/setup-production-db.sh`
- [ ] Verify all tables are created correctly
- [ ] Check Row Level Security (RLS) policies are active
- [ ] Test database connections

### ✅ Authentication Setup
- [ ] Configure Google OAuth provider
- [ ] Set up email templates (welcome, password reset, etc.)
- [ ] Configure authentication settings (session timeout, etc.)
- [ ] Test user registration and login flows
- [ ] Create first admin user: `SELECT public.create_admin_user('admin@yourcompany.com');`

### ✅ Storage Configuration
- [ ] Verify storage buckets are created (`product-files`, `product-images`, `avatars`)
- [ ] Configure CORS policies for file uploads
- [ ] Set up CDN if needed
- [ ] Test file upload functionality

## 🔧 Application Configuration

### ✅ Environment Variables
- [ ] Copy `.env.production` to `.env`
- [ ] Update all production URLs and keys
- [ ] Configure payment processor (Cryptomus) credentials
- [ ] Set up analytics tracking (Google Analytics)
- [ ] Configure email service credentials

### ✅ Security Settings
- [ ] Enable HTTPS/SSL certificates
- [ ] Configure CORS policies
- [ ] Set up rate limiting
- [ ] Enable security headers
- [ ] Configure CSP (Content Security Policy)

### ✅ Performance Optimization
- [ ] Enable database connection pooling
- [ ] Configure CDN for static assets
- [ ] Set up image optimization
- [ ] Enable gzip compression
- [ ] Configure caching headers

## 🚀 Deployment

### ✅ Build Process
- [ ] Test production build: `npm run build`
- [ ] Verify all assets are optimized
- [ ] Check bundle size and performance
- [ ] Test in production-like environment

### ✅ Domain & Hosting
- [ ] Configure custom domain
- [ ] Set up SSL certificates
- [ ] Configure DNS records
- [ ] Test domain accessibility

### ✅ Monitoring & Analytics
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Configure performance monitoring
- [ ] Set up uptime monitoring
- [ ] Configure log aggregation

## 💰 Payment Integration

### ✅ Cryptocurrency Payments
- [ ] Configure Cryptomus merchant account
- [ ] Test payment flows (BTC, ETH, USDT, etc.)
- [ ] Set up webhook endpoints for payment notifications
- [ ] Test refund processes
- [ ] Configure payout schedules for sellers

### ✅ Financial Settings
- [ ] Set platform commission rate (default: 10%)
- [ ] Configure minimum payout amounts
- [ ] Set up tax calculation if required
- [ ] Test seller earnings calculations

## 📧 Communication

### ✅ Email Configuration
- [ ] Set up transactional email service
- [ ] Configure email templates
- [ ] Test order confirmations
- [ ] Test seller notifications
- [ ] Set up support email forwarding

### ✅ Notifications
- [ ] Configure push notifications (if applicable)
- [ ] Set up SMS notifications (optional)
- [ ] Test all notification flows

## 🛡️ Legal & Compliance

### ✅ Legal Pages
- [ ] Create Terms of Service
- [ ] Create Privacy Policy
- [ ] Create Refund Policy
- [ ] Create Seller Agreement
- [ ] Create Cookie Policy

### ✅ Compliance
- [ ] GDPR compliance (if serving EU users)
- [ ] CCPA compliance (if serving CA users)
- [ ] PCI compliance for payment processing
- [ ] Data retention policies

## 🧪 Testing

### ✅ Functionality Testing
- [ ] User registration and authentication
- [ ] Product listing and search
- [ ] Purchase flow end-to-end
- [ ] File download after purchase
- [ ] Seller dashboard functionality
- [ ] Admin panel functionality

### ✅ Performance Testing
- [ ] Load testing with expected traffic
- [ ] Database performance under load
- [ ] File upload/download performance
- [ ] Mobile responsiveness

### ✅ Security Testing
- [ ] SQL injection testing
- [ ] XSS vulnerability testing
- [ ] Authentication bypass testing
- [ ] File upload security testing

## 📊 Launch Preparation

### ✅ Content
- [ ] Add initial product categories
- [ ] Create sample products (optional)
- [ ] Prepare launch marketing materials
- [ ] Set up social media accounts

### ✅ Support
- [ ] Create help documentation
- [ ] Set up customer support system
- [ ] Train support team
- [ ] Create FAQ section

### ✅ Backup & Recovery
- [ ] Set up automated database backups
- [ ] Test backup restoration process
- [ ] Configure disaster recovery plan
- [ ] Document recovery procedures

## 🎯 Post-Launch

### ✅ Monitoring
- [ ] Monitor error rates and performance
- [ ] Track user engagement metrics
- [ ] Monitor payment success rates
- [ ] Review security logs

### ✅ Optimization
- [ ] Analyze user behavior
- [ ] Optimize conversion funnel
- [ ] A/B test key features
- [ ] Gather user feedback

---

## 🚨 Critical Production Commands

### Create Admin User
```sql
SELECT public.create_admin_user('admin@yourcompany.com');
```

### Update Platform Settings
```sql
UPDATE public.platform_settings 
SET value = '{"percentage": 10}'::jsonb 
WHERE key = 'commission_rate';
```

### Enable Maintenance Mode
```sql
UPDATE public.platform_settings 
SET value = '{"enabled": true, "message": "Site under maintenance"}'::jsonb 
WHERE key = 'maintenance_mode';
```

### Check Database Health
```sql
SELECT 
  schemaname,
  tablename,
  n_tup_ins as inserts,
  n_tup_upd as updates,
  n_tup_del as deletes
FROM pg_stat_user_tables 
ORDER BY n_tup_ins DESC;
```

---

## 📞 Support Contacts

- **Database Issues**: Check Supabase dashboard and logs
- **Payment Issues**: Contact Cryptomus support
- **Domain Issues**: Contact your DNS provider
- **General Issues**: Check application logs and error tracking

Remember to keep this checklist updated as your application evolves!