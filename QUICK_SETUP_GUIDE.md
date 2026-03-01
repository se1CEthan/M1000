# 🚀 Quick Supabase Setup Guide for Seltech

## 📋 Essential Steps (15 minutes)

### 1. **Access Supabase Dashboard**
- Go to: https://supabase.com/dashboard
- Select project: `rtsaarapvlzzinmpjdys`

### 2. **Apply Database Schema**
1. Click **"SQL Editor"** → **"New Query"**
2. Copy & paste content from: `supabase/migrations/20260118150000_production_setup.sql`
3. Click **"Run"** → Wait for "Success"

### 3. **Configure Authentication**
1. Go to **"Authentication"** → **"Settings"**
2. Set **Site URL**: `https://your-domain.com` (or `http://localhost:8080` for dev)
3. Add **Redirect URLs**: 
   - `https://your-domain.com/auth/callback`
   - `http://localhost:8080/auth/callback`

### 4. **Enable Google OAuth** (Optional but Recommended)
1. **Authentication** → **"Providers"** → **"Google"**
2. **Enable** and add your Google OAuth credentials
3. **Get credentials**: [Google Cloud Console](https://console.cloud.google.com/) → Create OAuth 2.0 Client
4. **Authorized redirect URI**: `https://rtsaarapvlzzinmpjdys.supabase.co/auth/v1/callback`

### 5. **Verify Storage Buckets**
1. Go to **"Storage"**
2. Confirm these buckets exist:
   - ✅ `product-files` (Private)
   - ✅ `product-images` (Public) 
   - ✅ `avatars` (Public)

### 6. **Create First Admin User**
1. **Register normally** through your app first
2. Go to **"SQL Editor"** → Run:
```sql
SELECT public.create_admin_user('your-email@example.com');
```

### 7. **Test Your Setup**
Run the verification script:
```bash
npm install
npm run verify-supabase
```

---

## 🔧 **Critical Configuration Values**

### Environment Variables (.env)
```env
VITE_SUPABASE_URL=https://rtsaarapvlzzinmpjdys.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0c2FhcmFwdmx6emlubXBqZHlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc0NjI2NzQsImV4cCI6MjA1MzAzODY3NH0.YOUR_ACTUAL_ANON_KEY_HERE
```

### Platform Settings (Already configured via migration)
- **Commission Rate**: 10%
- **Featured Products**: 6 max
- **File Size Limit**: 500MB
- **Supported Crypto**: BTC, ETH, USDT, USDC, LTC

---

## ✅ **Quick Verification Checklist**

After setup, verify these work:

- [ ] **Database**: Tables created and accessible
- [ ] **Auth**: User registration/login works
- [ ] **Storage**: File upload works
- [ ] **Admin**: Admin user created successfully
- [ ] **Security**: RLS policies active

---

## 🆘 **Common Issues & Fixes**

### "Migration Failed"
- **Fix**: Run migrations one section at a time
- **Check**: SQL syntax and permissions

### "Auth Not Working"
- **Fix**: Verify redirect URLs match exactly
- **Check**: Google OAuth credentials are correct

### "RLS Policy Error"
- **Fix**: Ensure user is authenticated
- **Check**: Policy conditions in dashboard

### "Storage Upload Fails"
- **Fix**: Configure CORS policies for buckets
- **Check**: File size limits and permissions

---

## 📞 **Need Help?**

1. **Check**: `SUPABASE_DASHBOARD_SETUP.md` for detailed steps
2. **Run**: `npm run verify-supabase` to diagnose issues
3. **Review**: Supabase dashboard logs for errors
4. **Test**: Each component individually

---

## 🎯 **You're Ready When:**

✅ Verification script passes all checks  
✅ You can register and login users  
✅ Admin user is created  
✅ File uploads work  
✅ Database queries return expected results  

**Time to launch your marketplace! 🚀**