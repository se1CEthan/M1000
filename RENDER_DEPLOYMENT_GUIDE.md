# Render Deployment Guide - Seltech with Cryptomus

## Overview
Complete guide to deploy your marketplace on Render with Cryptomus cryptocurrency payments and automatic 90/10 revenue split.

## Prerequisites

- ✅ Render account (https://render.com)
- ✅ GitHub repository with your code
- ✅ Supabase project set up
- ✅ Cryptomus merchant account
- ✅ Domain name (seltech.online)

## Step 1: Prepare Your Repository

### 1.1 Ensure these files exist:
```
✅ package.json
✅ vite.config.ts
✅ .env (for reference, not committed)
✅ render.yaml (optional, for infrastructure as code)
```

### 1.2 Create `.env.production` (for reference):
```env
# Supabase
VITE_SUPABASE_URL=https://rtsaarapvlzzinmpjdys.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key

# Cryptomus
VITE_CRYPTOMUS_MERCHANT_UUID=6e6c1018-48f4-49fd-a10d-36d6cd70eefe
VITE_CRYPTOMUS_PAYMENT_API_KEY=DSk5vMk3RIBhiQ3qGUw1pH1iYJI1hSSN8iTYmHpm3WpyTj9bsTtIlhadpiFKlK5aVUmpjHH8YoLV9dQsxLAPzpQOdiffl2hzJo0378ExFJB3HMSx49LjTfvnm9qHztoP
VITE_CRYPTOMUS_PAYOUT_API_KEY=2nuhleS45ns1WTJDX1ZoRG8UAmDFDdahvMafGhU5knS5P3Ozn1Yx0tgRYCmjJpKvtNx0GVQ0FTLo0SNVw1ZM7Zy97fXSsbHX8SGbgGepEHCqwtxw3gIJ8LKDIMDJ3W4s
VITE_CRYPTOMUS_WEBHOOK_SECRET=seltech_webhook_secret_2024

# App
VITE_APP_NAME=Seltech
VITE_APP_URL=https://seltech.online
```

### 1.3 Update `render.yaml` (optional):
```yaml
services:
  - type: web
    name: seltech-online
    env: node
    region: oregon
    plan: starter
    buildCommand: npm install && npm run build
    startCommand: npm run preview
    envVars:
      - key: NODE_VERSION
        value: 18
      - key: VITE_SUPABASE_URL
        sync: false
      - key: VITE_SUPABASE_PUBLISHABLE_KEY
        sync: false
      - key: VITE_CRYPTOMUS_MERCHANT_UUID
        sync: false
      - key: VITE_CRYPTOMUS_PAYMENT_API_KEY
        sync: false
      - key: VITE_CRYPTOMUS_PAYOUT_API_KEY
        sync: false
      - key: VITE_CRYPTOMUS_WEBHOOK_SECRET
        sync: false
```

## Step 2: Create Render Web Service

### 2.1 Go to Render Dashboard
1. Visit https://dashboard.render.com
2. Click "New +" → "Web Service"

### 2.2 Connect Repository
1. Connect your GitHub account
2. Select your repository
3. Click "Connect"

### 2.3 Configure Service

**Basic Settings:**
```
Name: seltech-online
Region: Oregon (or closest to your users)
Branch: main
Root Directory: (leave blank)
Runtime: Node
```

**Build Settings:**
```
Build Command: npm install && npm run build
Start Command: npm run preview
```

**Instance Type:**
```
Plan: Starter ($7/month) or Free
```

## Step 3: Configure Environment Variables

In Render dashboard, go to "Environment" tab and add:

### Required Variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://rtsaarapvlzzinmpjdys.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Cryptomus Payment Configuration
VITE_CRYPTOMUS_MERCHANT_UUID=6e6c1018-48f4-49fd-a10d-36d6cd70eefe
VITE_CRYPTOMUS_PAYMENT_API_KEY=DSk5vMk3RIBhiQ3qGUw1pH1iYJI1hSSN8iTYmHpm3WpyTj9bsTtIlhadpiFKlK5aVUmpjHH8YoLV9dQsxLAPzpQOdiffl2hzJo0378ExFJB3HMSx49LjTfvnm9qHztoP
VITE_CRYPTOMUS_PAYOUT_API_KEY=2nuhleS45ns1WTJDX1ZoRG8UAmDFDdahvMafGhU5knS5P3Ozn1Yx0tgRYCmjJpKvtNx0GVQ0FTLo0SNVw1ZM7Zy97fXSsbHX8SGbgGepEHCqwtxw3gIJ8LKDIMDJ3W4s
VITE_CRYPTOMUS_WEBHOOK_SECRET=seltech_webhook_secret_2024

# Application Configuration
VITE_APP_NAME=Seltech
VITE_APP_URL=https://seltech.online
VITE_APP_DESCRIPTION=The premier marketplace for developer tools and digital assets

# Feature Flags
VITE_ENABLE_MAINTENANCE_MODE=false
VITE_ENABLE_REGISTRATION=true
VITE_ENABLE_SELLER_REGISTRATION=true

# Node Configuration
NODE_VERSION=18
```

### Optional Variables:

```env
# Analytics
VITE_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX

# Support
VITE_SUPPORT_EMAIL=support@seltech.online
VITE_CONTACT_EMAIL=support@seltech.online

# File Upload
VITE_MAX_FILE_SIZE_MB=500
VITE_ALLOWED_FILE_TYPES=.zip,.rar,.tar.gz,.exe,.dmg,.pkg,.deb,.rpm
```

## Step 4: Configure Custom Domain

### 4.1 In Render Dashboard:
1. Go to your service
2. Click "Settings" → "Custom Domain"
3. Add domain: `seltech.online`
4. Add domain: `www.seltech.online`

### 4.2 Update DNS Records:

**For seltech.online:**
```
Type: A
Name: @
Value: [Render IP address shown in dashboard]
TTL: 3600
```

**For www.seltech.online:**
```
Type: CNAME
Name: www
Value: seltech-online.onrender.com
TTL: 3600
```

### 4.3 Enable HTTPS:
- Render automatically provisions SSL certificates
- Wait 5-10 minutes for SSL to activate
- Verify at https://seltech.online

## Step 5: Deploy

### 5.1 Trigger Deployment:
1. Click "Manual Deploy" → "Deploy latest commit"
2. Or push to your main branch (auto-deploy)

### 5.2 Monitor Build:
```
Building...
  → npm install
  → npm run build
  → Vite build complete
  
Starting...
  → npm run preview
  → Server running on port 10000
  
Live at: https://seltech-online.onrender.com
```

### 5.3 Check Logs:
- Go to "Logs" tab
- Look for successful startup
- Verify no errors

## Step 6: Verify Cryptomus Integration

### 6.1 Test Payment Flow:
1. Visit https://seltech.online
2. Click "Buy Now" on a product
3. Check browser console:
   ```
   🚀 Starting Cryptomus payment creation...
   ✅ Order created
   📋 Creating Cryptomus invoice
   🔗 Payment URLs:
      success: https://seltech.online/order-success?order_id=...
      callback: https://seltech.online/api/webhooks/cryptomus
   ✅ Cryptomus payment created successfully
   ```

### 6.2 Verify Webhook Endpoint:
```bash
curl https://seltech.online/api/webhooks/cryptomus
```

Expected response:
```json
{
  "status": "ok",
  "service": "Seltech Cryptomus Payment Webhook",
  "merchant": "6e6c1018-48f4-49fd-a10d-36d6cd70eefe",
  "timestamp": "2024-..."
}
```

### 6.3 Test Complete Purchase:
1. Buy a product with small amount
2. Pay with crypto on Cryptomus
3. Verify redirect to order success page
4. Check webhook was received (Render logs)
5. Verify seller received 90% payout

## Step 7: Database Migration

### 7.1 Run PesaPal to Cryptomus Migration:

In Supabase SQL Editor, run:
```sql
-- From: supabase/migrations/remove_pesapal_columns.sql
-- This removes PesaPal columns and updates to Cryptomus
```

### 7.2 Verify Migration:
```sql
-- Check orders table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders';

-- Should NOT have: pesapal_tracking_id
-- Should have: payment_method (default 'cryptomus')
```

## Step 8: Configure Supabase

### 8.1 Update Allowed URLs:
In Supabase Dashboard → Authentication → URL Configuration:

**Site URL:**
```
https://seltech.online
```

**Redirect URLs:**
```
https://seltech.online/*
https://seltech.online/auth/callback
https://seltech.online/order-success
```

### 8.2 Enable Storage CORS:
In Supabase Dashboard → Storage → Configuration:
```json
{
  "allowedOrigins": ["https://seltech.online"],
  "allowedMethods": ["GET", "POST", "PUT", "DELETE"],
  "allowedHeaders": ["*"],
  "maxAge": 3600
}
```

## Step 9: Post-Deployment Checklist

### ✅ Verify Core Functionality:
- [ ] Homepage loads correctly
- [ ] User can sign up/login
- [ ] Products display properly
- [ ] Search works
- [ ] Filters work

### ✅ Verify Payment System:
- [ ] "Buy Now" button works
- [ ] Cryptomus payment page loads
- [ ] Payment URLs are correct
- [ ] Webhook endpoint is accessible
- [ ] Order success page works

### ✅ Verify Seller Features:
- [ ] Seller dashboard loads
- [ ] Product upload works
- [ ] Wallet address can be configured
- [ ] Earnings display correctly

### ✅ Verify Admin Features:
- [ ] Admin dashboard accessible
- [ ] Product review works
- [ ] User management works
- [ ] Analytics display

### ✅ Verify Integrations:
- [ ] Supabase connection works
- [ ] File uploads work
- [ ] Email notifications work
- [ ] Cryptomus API responds

## Step 10: Monitoring & Maintenance

### 10.1 Monitor Render Logs:
```bash
# In Render dashboard, check logs for:
- Payment creation requests
- Webhook deliveries
- API errors
- Database queries
```

### 10.2 Monitor Cryptomus Dashboard:
- Check payment success rate
- Monitor webhook delivery
- Verify payout processing
- Check for API errors

### 10.3 Monitor Supabase:
```sql
-- Check recent orders
SELECT id, status, price, payment_method, created_at
FROM orders
ORDER BY created_at DESC
LIMIT 20;

-- Check recent payouts
SELECT id, seller_id, amount, status, processed_at
FROM payouts
ORDER BY created_at DESC
LIMIT 20;

-- Check error logs
SELECT * FROM logs
WHERE level = 'error'
ORDER BY created_at DESC
LIMIT 50;
```

## Troubleshooting

### Build Fails:
```bash
# Check Node version
NODE_VERSION=18

# Clear cache and rebuild
# In Render: Settings → Clear Build Cache
```

### Environment Variables Not Working:
```bash
# Verify variables start with VITE_
# Rebuild after adding variables
# Check logs for "undefined" values
```

### Webhook Not Receiving:
```bash
# Test endpoint
curl https://seltech.online/api/webhooks/cryptomus

# Check Render logs for incoming requests
# Verify Cryptomus dashboard webhook configuration
```

### Payment Fails:
```bash
# Check browser console for errors
# Verify Cryptomus API keys
# Check order creation in database
# Verify payment invoice creation
```

### Seller Payout Fails:
```bash
# Check seller has wallet address configured
# Verify payout API key is correct
# Check Render logs for payout errors
# Verify Cryptomus payout API is working
```

## Performance Optimization

### Enable Caching:
In `vite.config.ts`:
```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
        }
      }
    }
  }
});
```

### Enable Compression:
Render automatically enables gzip compression.

### CDN (Optional):
Consider using Cloudflare for:
- DDoS protection
- Global CDN
- Additional caching
- Analytics

## Scaling

### Upgrade Plan:
```
Free: 750 hours/month, sleeps after 15 min inactivity
Starter: $7/month, always on
Standard: $25/month, more resources
Pro: $85/month, high performance
```

### Horizontal Scaling:
- Add more instances in Render dashboard
- Use load balancer
- Consider database read replicas

## Backup & Recovery

### Database Backups:
- Supabase automatically backs up daily
- Download manual backups from Supabase dashboard

### Code Backups:
- GitHub repository is your source of truth
- Tag releases: `git tag v1.0.0`

### Environment Variables:
- Keep `.env.production` in secure location
- Document all variables

## Security Checklist

- [ ] HTTPS enabled (automatic with Render)
- [ ] Environment variables secured
- [ ] API keys not in code
- [ ] CORS configured properly
- [ ] Rate limiting enabled (Supabase)
- [ ] SQL injection prevention (Supabase RLS)
- [ ] XSS prevention (React escaping)
- [ ] Webhook signature verification

## Success Metrics

Monitor these after deployment:
- Payment success rate (target: >95%)
- Webhook delivery rate (target: 100%)
- Payout success rate (target: >98%)
- Page load time (target: <3s)
- API response time (target: <500ms)
- Error rate (target: <1%)

## Support

### Render Support:
- Dashboard: https://dashboard.render.com
- Docs: https://render.com/docs
- Status: https://status.render.com

### Cryptomus Support:
- Dashboard: https://cryptomus.com
- Docs: https://doc.cryptomus.com
- Support: support@cryptomus.com

### Your Support:
- Email: support@seltech.online
- Monitor: Render logs + Supabase logs

## Conclusion

Your site is now deployed on Render with:
- ✅ Cryptomus cryptocurrency payments
- ✅ Automatic 90/10 revenue split
- ✅ Seller payout system
- ✅ Custom domain with SSL
- ✅ Production-ready infrastructure

**Next**: Test thoroughly and monitor for 24-48 hours before announcing launch! 🚀
