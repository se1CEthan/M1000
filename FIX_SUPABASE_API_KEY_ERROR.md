# 🔧 Fix "Invalid API Key" Error - Supabase Configuration

## 🚨 **Problem Identified**

Your Supabase API key is incomplete/invalid. The current key in your configuration files ends with:
```
...sb_publishable_6QJ9D3Ha7YfKwPauj04rWA_Fo-BuX5x
```

This is a **placeholder**, not the actual JWT signature needed for authentication.

## 🎯 **Solution: Get Your Real Supabase Anon Key**

### **Step 1: Access Supabase Dashboard**
1. Go to: https://supabase.com/dashboard
2. Sign in to your account
3. Select your project: `rtsaarapvlzzinmpjdys`

### **Step 2: Get Your Anon Key**
1. Click **"Settings"** in the left sidebar
2. Click **"API"** in the settings menu
3. Find the **"anon public"** key (NOT the service_role key)
4. Click **"Copy"** to copy the entire JWT token

The correct key should look like:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0c2FhcmFwdmx6emlubXBqZHlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc0NjI2NzQsImV4cCI6MjA1MzAzODY3NH0.ACTUAL_SIGNATURE_HERE
```

**Important**: The key must have **3 parts** separated by dots (`.`) and be about 200+ characters long.

### **Step 3: Update Your Configuration Files**

You need to update **3 files** with the correct key:

#### **File 1: `.env`**
```env
VITE_SUPABASE_PUBLISHABLE_KEY=PASTE_YOUR_ACTUAL_ANON_KEY_HERE
```

#### **File 2: `.env.production`**
```env
VITE_SUPABASE_PUBLISHABLE_KEY=PASTE_YOUR_ACTUAL_ANON_KEY_HERE
```

#### **File 3: `render.yaml`**
```yaml
      - key: VITE_SUPABASE_PUBLISHABLE_KEY
        value: PASTE_YOUR_ACTUAL_ANON_KEY_HERE
```

### **Step 4: Update Render Environment Variables**

**Option A: Via Render Dashboard (Recommended)**
1. Go to your Render dashboard
2. Select your service: `seltech-marketplace`
3. Go to **"Environment"** tab
4. Find `VITE_SUPABASE_PUBLISHABLE_KEY`
5. Update the value with your actual anon key
6. Click **"Save Changes"**

**Option B: Via render.yaml (Alternative)**
If you updated the `render.yaml` file, commit and push the changes to trigger a new deployment.

### **Step 5: Verify the Fix**

After updating the key, test locally:
```bash
npm run verify-supabase
```

Then redeploy to Render and test sign up functionality.

## 🔍 **How to Identify the Correct Key**

### ✅ **Correct Anon Key:**
- **Format**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0c2FhcmFwdmx6emlubXBqZHlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc0NjI2NzQsImV4cCI6MjA1MzAzODY3NH0.REAL_SIGNATURE`
- **Length**: ~200+ characters
- **Parts**: 3 parts separated by dots
- **Role**: Contains `"role":"anon"`
- **Label**: "anon public" in Supabase dashboard

### ❌ **Wrong Keys (Don't Use):**
- **Service Role**: Contains `"role":"service_role"` (dangerous for frontend)
- **Database URL**: `postgresql://postgres:...` (server-side only)
- **Placeholder**: Ends with `sb_publishable_...` (not real JWT)

## 🛡️ **Security Notes**

- ✅ **anon/public key** is safe for frontend use
- ❌ **service_role key** should never be used in frontend
- 🔒 The anon key respects your Row Level Security (RLS) policies

## 🚀 **After Fixing**

Once you update the key:
1. **Local development** will work immediately
2. **Render deployment** will work after redeployment
3. **Sign up/login** functionality will be restored
4. **Database operations** will work properly

## 📞 **Need Help?**

If you're still having issues:
1. Double-check you copied the **anon public** key (not service_role)
2. Ensure the key has no extra spaces or line breaks
3. Verify the key is exactly as shown in your Supabase dashboard
4. Test locally first with `npm run verify-supabase`

The "Invalid API Key" error will be resolved once you use the correct Supabase anon key! 🎉