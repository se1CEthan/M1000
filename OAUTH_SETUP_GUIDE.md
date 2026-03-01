# OAuth-Only Authentication Setup Guide

## 🔒 Secure OAuth Authentication Configuration

This guide will help you configure Seltech to only allow authentication through trusted OAuth providers: **Google** and **GitHub**.

## 📋 Prerequisites

- Supabase project with admin access
- Developer accounts for each OAuth provider you want to enable

## 🛠️ Step 1: Supabase Dashboard Configuration

### 1.1 Disable Email/Password Authentication

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Settings**
3. Under **Auth Providers**, disable:
   - ✅ **Disable** "Enable email confirmations"
   - ✅ **Disable** "Enable email signup"
   - ✅ **Disable** "Enable phone signup"

### 1.2 Configure Site URL

1. In **Authentication** → **URL Configuration**
2. Set **Site URL**: `https://your-domain.com`
3. Add **Redirect URLs**:
   - `https://your-domain.com/auth/callback`
   - `http://localhost:8080/auth/callback` (for development)

## 🔑 Step 2: Configure OAuth Providers

### 2.1 Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure:
   - **Application type**: Web application
   - **Authorized redirect URIs**: `https://[your-supabase-project].supabase.co/auth/v1/callback`
6. Copy **Client ID** and **Client Secret**
7. In Supabase Dashboard → **Authentication** → **Providers** → **Google**:
   - ✅ **Enable Google provider**
   - Paste **Client ID** and **Client Secret**

### 2.2 GitHub OAuth Setup

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Configure:
   - **Application name**: Seltech
   - **Homepage URL**: `https://your-domain.com`
   - **Authorization callback URL**: `https://[your-supabase-project].supabase.co/auth/v1/callback`
4. Copy **Client ID** and **Client Secret**
5. In Supabase Dashboard → **Authentication** → **Providers** → **GitHub**:
   - ✅ **Enable GitHub provider**
   - Paste **Client ID** and **Client Secret**

## 🗄️ Step 3: Database Configuration

Run the SQL script to enforce OAuth-only authentication:

```bash
# In your Supabase SQL Editor, run:
scripts/configure-oauth-only.sql
```

This script will:
- ✅ Create a trigger to prevent email/password signups
- ✅ Create a view for OAuth users only
- ✅ Add security constraints

## 🧪 Step 4: Testing

### 4.1 Test Each Provider

1. Clear your browser cache/cookies
2. Go to `/auth` page
3. Test each OAuth provider:
   - ✅ Google sign-in
   - ✅ Google sign-in
   - ✅ GitHub sign-in

### 4.2 Verify Email/Password is Disabled

1. Try to access any email/password forms
2. Confirm they're removed from the UI
3. Verify database triggers prevent email signups

## 🔒 Step 5: Security Verification

### 5.1 Check Authentication Flow

```javascript
// Test script to verify OAuth-only authentication
const testAuth = async () => {
  // This should work
  const { data: googleAuth } = await supabase.auth.signInWithOAuth({
    provider: 'google'
  });
  
  // This should fail (if you try to implement it)
  try {
    const { data: emailAuth } = await supabase.auth.signUp({
      email: 'test@example.com',
      password: 'password123'
    });
    console.error('❌ Email signup should be disabled!');
  } catch (error) {
    console.log('✅ Email signup properly disabled');
  }
};
```

### 5.2 Verify User Profiles

```sql
-- Check that all users have OAuth providers
SELECT 
  email,
  raw_app_meta_data->>'provider' as provider,
  created_at
FROM auth.users
WHERE raw_app_meta_data->>'provider' NOT IN ('google', 'github');
-- This should return no results
```

## 📱 Step 6: Update Environment Variables

Update your `.env` files to reflect OAuth-only setup:

```env
# Remove these (no longer needed)
# VITE_ENABLE_EMAIL_AUTH=false
# VITE_ENABLE_PASSWORD_RESET=false

# Add OAuth provider flags
VITE_OAUTH_PROVIDERS=google,github
VITE_AUTH_MODE=oauth_only
```

## 🚀 Step 7: Production Deployment

### 7.1 Update Redirect URLs

For each OAuth provider, update redirect URLs to production:
- Development: `https://[project].supabase.co/auth/v1/callback`
- Production: `https://your-domain.com/auth/callback`

### 7.2 Test Production Authentication

1. Deploy your application
2. Test each OAuth provider on production
3. Verify user creation and profile setup
4. Check that users can access appropriate dashboards

## 🛡️ Security Benefits

✅ **Enhanced Security**: No password storage or management
✅ **Reduced Attack Surface**: No password-based attacks
✅ **Better UX**: One-click authentication
✅ **Trusted Providers**: Leverage established OAuth security
✅ **Compliance**: Easier GDPR/privacy compliance

## 🔧 Troubleshooting

### Common Issues:

1. **OAuth Redirect Mismatch**
   - Verify redirect URLs match exactly
   - Check for trailing slashes
   - Ensure HTTPS in production

2. **Provider Not Working**
   - Check client ID/secret are correct
   - Verify provider is enabled in Supabase
   - Check provider-specific settings

3. **User Profile Not Created**
   - Check database triggers are working
   - Verify RLS policies allow profile creation
   - Check for any database errors

### Debug Commands:

```bash
# Check Supabase auth configuration
npm run verify-supabase

# Test OAuth providers
npm run test-oauth

# Check user profiles
npm run debug-profiles
```

## 📞 Support

If you encounter issues:

1. Check Supabase logs in Dashboard → Logs
2. Verify OAuth provider configurations
3. Test with different browsers/incognito mode
4. Check network requests in browser dev tools

---

**Status**: 🔒 **OAuth-Only Authentication Configured**

Your Seltech marketplace now uses secure OAuth authentication only, providing enhanced security and better user experience.