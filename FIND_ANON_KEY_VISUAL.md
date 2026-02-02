# 👀 Visual Guide: Finding Your Anon Key

## 🎯 **Quick Steps**

1. **Go to**: https://supabase.com/dashboard
2. **Click your project**: `rtsaarapvlzzinmpjdys`
3. **Navigate**: Settings → API
4. **Look for**: "Project API keys" section

---

## 📋 **What You'll See in the Dashboard**

```
┌─────────────────────────────────────────────────────────────┐
│                    Project API keys                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Project URL                                                 │
│ https://rtsaarapvlzzinmpjdys.supabase.co                   │
│ [Copy] [Reveal]                                             │
│                                                             │
│ anon public                                                 │
│ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBh... │
│ [Copy] [Reveal]  ← ✅ COPY THIS ONE!                       │
│                                                             │
│ service_role                                                │
│ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBh... │
│ [Copy] [Reveal]  ← ❌ DON'T USE THIS IN FRONTEND           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ **The Key You Need**

**Label**: `anon public`  
**Starts with**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0c2FhcmFwdmx6emlubXBqZHlz`  
**Length**: ~200+ characters  
**Use for**: `VITE_SUPABASE_PUBLISHABLE_KEY` in your .env file

---

## ❌ **Keys You DON'T Need for Frontend**

### Database Connection String
```
postgresql://postgres:[PASSWORD]@db.rtsaarapvlzzinmpjdys.supabase.co:5432/postgres
```
**Use**: Direct database connections only

### Service Role Key
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0c2FhcmFwdmx6emlubXBqZHlzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSI...
```
**Use**: Server-side operations only (bypasses RLS)

### Secret Keys
```
sb_secret_kefsPnDvhBpkzmE1EzP_Hw_n5Us4-Uh
```
**Use**: Internal Supabase operations

---

## 🔧 **After You Copy the Anon Key**

Update your `.env` file:

```env
# Replace this line:
VITE_SUPABASE_PUBLISHABLE_KEY=PASTE_YOUR_ANON_PUBLIC_KEY_HERE_FROM_DASHBOARD

# With your actual anon key:
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0c2FhcmFwdmx6emlubXBqZHlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc0NjI2NzQsImV4cCI6MjA1MzAzODY3NH0.YOUR_ACTUAL_SIGNATURE
```

---

## 🧪 **Test It Works**

```bash
npm run verify-supabase
```

If you see ✅ checks, you're good to go! 🚀