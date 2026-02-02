# 🛠️ Manual Database Setup (Without CLI)

Since your Supabase connection is working, let's set up the database manually through the dashboard.

## ✅ **Your Connection Status**
- ✅ **Supabase Key**: Working correctly (`sb_publishable_6QJ9D3Ha7YfKwPauj04rWA_Fo-BuX5x`)
- ✅ **Authentication**: Service is working
- ✅ **Project URL**: `https://rtsaarapvlzzinmpjdys.supabase.co`

## 🗄️ **Step 1: Set Up Database Tables**

### 1.1 Go to SQL Editor
1. Open: https://supabase.com/dashboard/project/rtsaarapvlzzinmpjdys
2. Click **"SQL Editor"** in the left sidebar
3. Click **"New Query"**

### 1.2 Run the Database Migration
1. Copy the entire content from: `supabase/migrations/20260118150000_production_setup.sql`
2. Paste it into the SQL editor
3. Click **"Run"** button
4. Wait for "Success" message

This will create:
- All database tables (profiles, products, orders, etc.)
- Row Level Security policies
- Indexes for performance
- Triggers and functions
- Platform settings

## 📁 **Step 2: Set Up Storage Buckets**

### 2.1 Go to Storage
1. Click **"Storage"** in the left sidebar
2. Click **"Create a new bucket"**

### 2.2 Create Required Buckets
Create these 3 buckets:

#### Bucket 1: `product-files`
- **Name**: `product-files`
- **Public**: ❌ (Private)
- **File size limit**: 500MB
- **Allowed MIME types**: Leave empty (all types)

#### Bucket 2: `product-images`
- **Name**: `product-images`
- **Public**: ✅ (Public)
- **File size limit**: 50MB
- **Allowed MIME types**: `image/*`

#### Bucket 3: `avatars`
- **Name**: `avatars`
- **Public**: ✅ (Public)
- **File size limit**: 10MB
- **Allowed MIME types**: `image/*`

## 🔐 **Step 3: Create Your First Admin User**

### 3.1 Register Through Your App
1. Start your app: `npm run dev`
2. Go to: http://localhost:8080/auth
3. Register with your email address
4. Complete the registration process

### 3.2 Make Yourself Admin
1. Go back to Supabase **SQL Editor**
2. Run this command (replace with your email):

```sql
SELECT public.create_admin_user('your-email@example.com');
```

3. Verify it worked:
```sql
SELECT email, role FROM profiles WHERE email = 'your-email@example.com';
```

## 🧪 **Step 4: Test Everything**

Run the verification script:
```bash
npm run verify-supabase
```

You should now see:
- ✅ Database connection successful
- ✅ All required tables exist
- ✅ Platform settings configured
- ✅ Storage buckets configured
- ✅ Authentication service working
- ✅ RLS policies configured

## 🚀 **Step 5: Start Your App**

```bash
npm run dev
```

Your Seltech marketplace should now be fully functional!

---

## 🆘 **If You Get Errors**

### "Permission Denied" in SQL Editor
- Make sure you're the project owner
- Try refreshing the page and running again

### "Table Already Exists"
- Some tables might already exist
- You can run parts of the migration separately

### "Storage Bucket Creation Failed"
- Try creating buckets one at a time
- Check if names are unique

### "Auth User Creation Failed"
- Make sure you registered through the app first
- Check that the email matches exactly

---

## ✅ **Success Checklist**

After completing all steps, verify:

- [ ] Database tables created (8 tables total)
- [ ] Storage buckets created (3 buckets total)
- [ ] Admin user created successfully
- [ ] App runs without errors (`npm run dev`)
- [ ] Can register new users
- [ ] Can view marketplace pages

Once all checks pass, your Seltech marketplace is ready for production! 🎉