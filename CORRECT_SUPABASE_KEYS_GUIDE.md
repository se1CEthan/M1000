# 🔑 Getting the CORRECT Supabase Keys for Your Frontend

## ⚠️ **Important: You Need Different Keys!**

The keys you provided are for **direct database access**, not for your **React frontend**.

### What You Provided:
- ❌ Database connection string (for backend/server use only)
- ❌ Service role secret (dangerous to use in frontend)

### What You Need:
- ✅ **Anon/Public Key** (JWT token for frontend)
- ✅ **Project URL** (we already have this)

---

## 📋 **Step-by-Step: Get Your Frontend Keys**

### 1. **Go to Supabase Dashboard**
1. Visit: https://supabase.com/dashboard
2. Sign in to your account
3. Click on your project: `rtsaarapvlzzinmpjdys`

### 2. **Navigate to API Settings**
1. In the left sidebar, click **"Settings"**
2. Click **"API"** in the settings menu

### 3. **Find Your Frontend Keys**
You'll see a section called **"Project API keys"** with these keys:

#### **Project URL** ✅
```
https://rtsaarapvlzzinmpjdys.supabase.co
```
*This is already correct in your config*

#### **anon public** ✅ (This is what you need!)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0c2FhcmFwdmx6emlubXBqZHlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc0NjI2NzQsImV4cCI6MjA1MzAzODY3NH0.ACTUAL_SIGNATURE_HERE
```
*Copy this entire JWT token*

#### **service_role** ❌ (Don't use in frontend!)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0c2FhcmFwdmx6emlubXBqZHlzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzQ2MjY3NCwiZXhwIjoyMDUzMDM4Njc0fQ.SIGNATURE_HERE
```
*Keep this secret - never use in frontend*

---

## 🔧 **Update Your .env File**

Once you get your **anon public** key from the dashboard, update your `.env` file:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://rtsaarapvlzzinmpjdys.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0c2FhcmFwdmx6emlubXBqZHlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc0NjI2NzQsImV4cCI6MjA1MzAzODY3NH0.PASTE_YOUR_ACTUAL_ANON_KEY_HERE

# Database connection (for server-side use only, not frontend)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.rtsaarapvlzzinmpjdys.supabase.co:5432/postgres
```

---

## 🔍 **How to Identify the Correct Key**

### ✅ **Correct Anon Key (for frontend):**
- Starts with: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0c2FhcmFwdmx6emlubXBqZHlz`
- Contains: `"role":"anon"`
- Length: ~200+ characters
- Safe for frontend use

### ❌ **Wrong Keys (don't use in frontend):**
- Database connection string: `postgresql://postgres:...`
- Service role key: Contains `"role":"service_role"`
- Secret keys starting with: `sb_secret_...`

---

## 🧪 **Test Your Configuration**

After updating your `.env` file with the correct anon key:

```bash
# Install dependencies if needed
npm install

# Test your Supabase connection
npm run verify-supabase
```

---

## 🛡️ **Security Reminder**

### ✅ **Safe for Frontend:**
- **anon/public key** - Designed for client-side use
- **Project URL** - Public endpoint

### ❌ **Never Use in Frontend:**
- **service_role key** - Bypasses all security rules
- **Database password** - Direct database access only
- **Secret keys** - Server-side only

---

## 📸 **Visual Guide**

When you're in the Supabase dashboard API settings, look for:

```
Project API keys
├── Project URL: https://rtsaarapvlzzinmpjdys.supabase.co
├── anon public: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... ← COPY THIS ONE
└── service_role: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... ← DON'T USE THIS
```

The **anon public** key is the one you need for `VITE_SUPABASE_PUBLISHABLE_KEY`.

---

## 🎯 **Next Steps**

1. **Get the anon key** from your Supabase dashboard
2. **Update .env** with the correct key
3. **Run verification**: `npm run verify-supabase`
4. **Set up database**: `npm run setup-db`
5. **Start development**: `npm run dev`

Once you have the correct anon key, your Seltech marketplace will be able to connect to Supabase properly! 🚀