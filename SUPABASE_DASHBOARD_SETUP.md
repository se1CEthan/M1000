# Supabase Dashboard Setup Guide for Seltech Marketplace

## 🎯 Complete Step-by-Step Setup

### 1. **Access Your Supabase Dashboard**

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sign in with your account
3. Select your project: `rtsaarapvlzzinmpjdys`

---

## 2. **Database Setup & Migration**

### 2.1 Apply Database Migrations

1. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

2. **Run the Production Setup Migration**
   - Copy the content from `supabase/migrations/20260118150000_production_setup.sql`
   - Paste it into the SQL editor
   - Click "Run" button
   - Wait for completion (should show "Success")

3. **Verify Tables Created**
   - Go to "Table Editor" in the left sidebar
   - You should see these tables:
     - `profiles`
     - `products` 
     - `orders`
     - `reviews`
     - `wishlists`
     - `disputes`
     - `payouts`
     - `platform_settings`

### 2.2 Run Health Check

1. **Go back to SQL Editor**
2. **Copy and run the health check**
   - Copy content from `scripts/db-health-check.sql`
   - Paste and run
   - Verify all checks show ✅ or acceptable status

---

## 3. **Authentication Configuration**

### 3.1 Basic Auth Settings

1. **Navigate to Authentication**
   - Click "Authentication" in the left sidebar
   - Click "Settings" tab

2. **Configure Basic Settings**
   ```
   Site URL: https://your-domain.com (or http://localhost:8080 for development)
   Redirect URLs: 
   - https://your-domain.com/auth/callback
   - http://localhost:8080/auth/callback (for development)
   ```

3. **Session Settings**
   ```
   JWT expiry: 3600 (1 hour)
   Refresh token rotation: Enabled
   Reuse interval: 10 seconds
   ```

### 3.2 Enable Email Authentication

1. **In Authentication > Settings**
2. **Email Auth Settings**
   ```
   ✅ Enable email confirmations
   ✅ Enable email change confirmations  
   ✅ Enable secure email change
   Minimum password length: 6
   ```

### 3.3 Configure Google OAuth

1. **Go to Authentication > Providers**
2. **Click on Google**
3. **Enable Google Provider**
4. **Add your Google OAuth credentials:**
   ```
   Client ID: [Your Google Client ID]
   Client Secret: [Your Google Client Secret]
   ```

**To get Google OAuth credentials:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Set authorized redirect URIs:
   - `https://rtsaarapvlzzinmpjdys.supabase.co/auth/v1/callback`

### 3.4 Email Templates

1. **Go to Authentication > Email Templates**
2. **Customize these templates:**

**Confirm Signup Template:**
```html
<h2>Welcome to Seltech!</h2>
<p>Thanks for signing up! Follow this link to confirm your account:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm your account</a></p>
<p>If you didn't sign up for Seltech, you can safely ignore this email.</p>
```

**Reset Password Template:**
```html
<h2>Reset your Seltech password</h2>
<p>Follow this link to reset the password for your account:</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
<p>If you didn't request a password reset, you can safely ignore this email.</p>
```

---

## 4. **Storage Configuration**

### 4.1 Verify Storage Buckets

1. **Navigate to Storage**
2. **Verify these buckets exist:**
   - `product-files` (Private)
   - `product-images` (Public)
   - `avatars` (Public)

### 4.2 Configure CORS Policies

1. **For each bucket, click the settings icon**
2. **Add CORS configuration:**

**For `product-images` and `avatars`:**
```json
[
  {
    "allowedOrigins": ["*"],
    "allowedMethods": ["GET", "POST", "PUT", "DELETE"],
    "allowedHeaders": ["*"],
    "maxAge": 3600
  }
]
```

**For `product-files`:**
```json
[
  {
    "allowedOrigins": ["https://your-domain.com", "http://localhost:8080"],
    "allowedMethods": ["GET", "POST", "PUT", "DELETE"],
    "allowedHeaders": ["*"],
    "maxAge": 3600
  }
]
```

---

## 5. **Database Policies Verification**

### 5.1 Check Row Level Security

1. **Go to Authentication > Policies**
2. **Verify RLS is enabled for all tables**
3. **Check that policies exist for:**
   - `profiles` (4 policies)
   - `products` (4 policies)
   - `orders` (2 policies)
   - `reviews` (3 policies)
   - `wishlists` (3 policies)
   - `disputes` (2 policies)
   - `payouts` (2 policies)

### 5.2 Test Policies

1. **Go to SQL Editor**
2. **Run test queries to verify policies work:**

```sql
-- Test: Anonymous users can view approved products
SELECT COUNT(*) FROM products WHERE status = 'approved';

-- Test: Check if platform settings are readable
SELECT * FROM platform_settings;
```

---

## 6. **API Configuration**

### 6.1 Get API Keys

1. **Go to Settings > API**
2. **Copy these values to your `.env` file:**
   ```
   VITE_SUPABASE_URL=https://rtsaarapvlzzinmpjdys.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=[Your anon/public key]
   ```

### 6.2 Configure Rate Limiting (Optional)

1. **Go to Settings > API**
2. **Set rate limits if needed:**
   ```
   Requests per minute: 1000 (adjust based on your needs)
   ```

---

## 7. **Create First Admin User**

### 7.1 Create Admin Account

1. **First, register a normal account through your app**
2. **Then go to SQL Editor in Supabase**
3. **Run this command with your email:**

```sql
SELECT public.create_admin_user('your-email@example.com');
```

4. **Verify the user is now admin:**
```sql
SELECT email, role FROM profiles WHERE email = 'your-email@example.com';
```

---

## 8. **Configure Platform Settings**

### 8.1 Update Platform Settings

1. **Go to SQL Editor**
2. **Configure your marketplace settings:**

```sql
-- Set commission rate (10% default)
UPDATE platform_settings 
SET value = '{"percentage": 10, "description": "Platform commission rate"}'::jsonb 
WHERE key = 'commission_rate';

-- Set featured products limit
UPDATE platform_settings 
SET value = '{"limit": 6, "description": "Number of featured products"}'::jsonb 
WHERE key = 'featured_products_limit';

-- Configure supported cryptocurrencies
UPDATE platform_settings 
SET value = '{"currencies": ["BTC", "ETH", "USDT", "USDC", "LTC"]}'::jsonb 
WHERE key = 'supported_currencies';

-- Set minimum payout amount
UPDATE platform_settings 
SET value = '{"amount": 50, "currency": "USD"}'::jsonb 
WHERE key = 'min_payout_amount';
```

---

## 9. **Security Configuration**

### 9.1 Configure Security Settings

1. **Go to Settings > General**
2. **Configure these security settings:**
   ```
   ✅ Enable RLS by default
   ✅ Enable realtime
   Database password: [Strong password]
   ```

### 9.2 Set Up SSL

1. **Ensure SSL is enabled (should be by default)**
2. **Verify your connection uses HTTPS**

---

## 10. **Monitoring & Logs**

### 10.1 Enable Logging

1. **Go to Logs**
2. **Enable these log types:**
   - Database logs
   - API logs
   - Auth logs
   - Storage logs

### 10.2 Set Up Alerts (Optional)

1. **Go to Settings > Billing**
2. **Set up usage alerts if needed**

---

## 11. **Testing Your Setup**

### 11.1 Test Database Connection

1. **Go to SQL Editor**
2. **Run this test:**

```sql
-- Test basic functionality
SELECT 
  'Database' as component,
  'Connected' as status,
  now() as timestamp;

-- Test auth trigger
SELECT 
  'Auth Trigger' as component,
  CASE WHEN COUNT(*) > 0 THEN 'Configured' ELSE 'Missing' END as status
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Test storage buckets
SELECT 
  'Storage' as component,
  COUNT(*)::text || ' buckets configured' as status
FROM storage.buckets;
```

### 11.2 Test Authentication

1. **Try registering a new user through your app**
2. **Check if profile is created automatically**
3. **Test Google OAuth login**

### 11.3 Test File Upload

1. **Try uploading a profile picture**
2. **Verify file appears in storage bucket**

---

## 12. **Production Checklist**

Before going live, verify:

- [ ] ✅ All migrations applied successfully
- [ ] ✅ RLS enabled on all tables
- [ ] ✅ Storage buckets configured with proper CORS
- [ ] ✅ Authentication providers working
- [ ] ✅ Admin user created
- [ ] ✅ Platform settings configured
- [ ] ✅ SSL/HTTPS enabled
- [ ] ✅ Rate limiting configured
- [ ] ✅ Monitoring enabled

---

## 🚨 **Important Security Notes**

1. **Never share your service role key publicly**
2. **Always use the anon/public key in your frontend**
3. **Keep your database password secure**
4. **Regularly review and update RLS policies**
5. **Monitor logs for suspicious activity**

---

## 📞 **Troubleshooting**

### Common Issues:

**Migration Fails:**
- Check for syntax errors in SQL
- Ensure you have proper permissions
- Try running migrations one at a time

**Auth Not Working:**
- Verify redirect URLs are correct
- Check Google OAuth credentials
- Ensure email templates are configured

**Storage Issues:**
- Verify CORS policies
- Check bucket permissions
- Ensure file size limits are appropriate

**RLS Blocking Queries:**
- Review policy conditions
- Test with different user roles
- Check if user is properly authenticated

---

## 🎉 **You're Ready for Production!**

Once all steps are completed, your Supabase backend will be fully configured and ready to power your Seltech marketplace. Remember to keep your credentials secure and monitor your usage as you scale.