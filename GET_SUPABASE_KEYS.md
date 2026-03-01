# 🔑 How to Get Your Supabase API Keys

## Step-by-Step Guide

### 1. **Access Your Supabase Dashboard**
1. Go to: https://supabase.com/dashboard
2. Sign in with your account
3. Select your project: `rtsaarapvlzzinmpjdys`

### 2. **Get Your API Keys**
1. In your project dashboard, click on **"Settings"** in the left sidebar
2. Click on **"API"** in the settings menu
3. You'll see two important keys:

#### **Project URL**
```
https://rtsaarapvlzzinmpjdys.supabase.co
```
✅ This is already correct in your .env file

#### **API Keys**
You'll see several keys, but you need the **"anon/public"** key:

- **anon key** (public) - This is what you use in your frontend
- **service_role key** (secret) - Keep this secret, don't use in frontend

### 3. **Copy the Anon Key**
1. Find the **"anon"** or **"public"** key (they're the same)
2. Click the **copy button** next to it
3. It should look something like:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0c2FhcmFwdmx6emlubXBqZHlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc0NjI2NzQsImV4cCI6MjA1MzAzODY3NH0.ACTUAL_SIGNATURE_HERE
```

### 4. **Update Your .env File**
Replace the placeholder in your `.env` file:

**Before:**
```env
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0c2FhcmFwdmx6emlubXBqZHlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc0NjI2NzQsImV4cCI6MjA1MzAzODY3NH0.YOUR_ACTUAL_ANON_KEY_HERE
```

**After:**
```env
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0c2FhcmFwdmx6emlubXBqZHlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc0NjI2NzQsImV4cCI6MjA1MzAzODY3NH0.PASTE_YOUR_ACTUAL_KEY_HERE
```

### 5. **Get Your Database Password (Optional)**
If you need direct database access:

1. In Supabase dashboard, go to **"Settings"** → **"Database"**
2. Find the **"Connection string"** section
3. Your password is in the connection string you provided:
```
postgresql://postgres:[YOUR-PASSWORD]@db.rtsaarapvlzzinmpjdys.supabase.co:5432/postgres
```

### 6. **Verify Your Configuration**
After updating your keys, test the connection:

```bash
npm run verify-supabase
```

This will check if your keys are working correctly.

---

## 🔒 **Security Notes**

### ✅ **Safe to Use in Frontend:**
- **anon/public key** - This is designed for frontend use
- **Project URL** - This is public

### ❌ **Never Use in Frontend:**
- **service_role key** - This bypasses all security rules
- **Database password** - Only for direct database connections

### 🛡️ **Best Practices:**
- Never commit service_role key to version control
- Use environment variables for all keys
- Rotate keys if they're ever compromised
- Use Row Level Security (RLS) policies for data protection

---

## 🆘 **Troubleshooting**

### **"Invalid API Key" Error**
- Double-check you copied the **anon** key, not service_role
- Ensure no extra spaces or characters
- Verify the project ID matches in the key

### **"Project Not Found" Error**
- Confirm project ID: `rtsaarapvlzzinmpjdys`
- Check if project is active in dashboard
- Verify you have access to the project

### **Connection Timeout**
- Check your internet connection
- Verify Supabase service status
- Try refreshing your API keys

---

## ✅ **Final Check**

Your `.env` file should look like this:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://rtsaarapvlzzinmpjdys.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0c2FhcmFwdmx6emlubXBqZHlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc0NjI2NzQsImV4cCI6MjA1MzAzODY3NH0.YOUR_ACTUAL_SIGNATURE

# Database connection (for direct database access if needed)
DATABASE_URL=postgresql://postgres:YOUR_ACTUAL_PASSWORD@db.rtsaarapvlzzinmpjdys.supabase.co:5432/postgres
```

Once you have the correct keys, you're ready to proceed with the database setup! 🚀