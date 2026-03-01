# 🔧 Fix User Creation Database Error

## Problem
Users are getting database errors when trying to sign up for new accounts.

## Root Cause
The issue is likely caused by:
1. Missing database trigger for automatic profile creation
2. Conflicting profile creation between frontend and database trigger
3. Missing required columns in the profiles table
4. Incorrect RLS (Row Level Security) policies

## 🚀 Quick Fix

### Step 1: Apply Database Fix
Go to your **Supabase Dashboard** → **SQL Editor** and run:

```sql
-- Copy and paste the entire contents of scripts/complete-user-fix.sql
```

### Step 2: Test the Fix
Run the test script to verify everything works:

```bash
npm install @supabase/supabase-js dotenv
node scripts/test-user-creation.js
```

### Step 3: Verify in Application
1. Go to your application: `http://localhost:8083`
2. Click "Sign In" → "Sign Up"
3. Create a test account
4. Verify you can log in successfully

## 🔍 What the Fix Does

### 1. **Database Trigger**
- Creates a robust `handle_new_user()` function
- Automatically creates profile when user signs up
- Handles errors gracefully without failing user creation

### 2. **Profile Table**
- Adds all required columns with proper defaults
- Sets up proper constraints and data types
- Ensures backward compatibility

### 3. **RLS Policies**
- Allows users to create their own profiles
- Allows users to view/update their own data
- Allows admins to manage all profiles

### 4. **Frontend Integration**
- Updates useAuth hook to work with database trigger
- Adds fallback profile creation if trigger fails
- Improves error handling and retry logic

## 🧪 Testing Checklist

After applying the fix, test these scenarios:

- [ ] **New User Signup**: Create account with email/password
- [ ] **Profile Creation**: Verify profile is created automatically
- [ ] **Login**: Sign in with new account
- [ ] **Role Assignment**: Check default role is 'buyer'
- [ ] **Admin Access**: Verify admin users can access admin dashboard
- [ ] **Seller Verification**: Test seller verification process

## 🚨 If Problems Persist

### Check Database Logs
1. Go to Supabase Dashboard → Logs
2. Look for any error messages during user creation
3. Check for constraint violations or missing columns

### Verify Environment Variables
Make sure these are set correctly in `.env`:
```env
VITE_SUPABASE_URL=https://rtsaarapvlzzinmpjdys.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_6QJ9D3Ha7YfKwPauj04rWA_Fo-BuX5x
```

### Manual Profile Creation
If automatic creation still fails, you can manually create profiles:

```sql
-- Replace with actual user details
INSERT INTO profiles (
  user_id,
  email,
  role,
  is_verified_seller,
  verification_status,
  created_at,
  updated_at
) VALUES (
  'USER_ID_FROM_AUTH_USERS',
  'user@example.com',
  'buyer',
  false,
  'approved',
  NOW(),
  NOW()
);
```

## 📞 Support

If you continue to have issues:

1. **Check the browser console** for JavaScript errors
2. **Check Supabase logs** for database errors
3. **Run the test script** to isolate the problem
4. **Verify all migrations** have been applied correctly

The fix addresses all common user creation issues and should resolve the database errors you're experiencing.