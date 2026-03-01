# 🔧 Step-by-Step Database Setup

The large migration failed, so let's break it into smaller steps that are easier to debug.

## 📋 **Setup Process (5 Steps)**

### **Step 1: Create Data Types**
1. Go to: https://supabase.com/dashboard/project/rtsaarapvlzzinmpjdys
2. Click **"SQL Editor"** → **"New Query"**
3. Copy content from: `supabase/migrations/step1_create_types.sql`
4. Paste and click **"Run"**
5. ✅ Should see "Success" - Creates user roles and status types

### **Step 2: Create Tables**
1. Click **"New Query"** again
2. Copy content from: `supabase/migrations/step2_create_tables.sql`
3. Paste and click **"Run"**
4. ✅ Should see "Success" - Creates all 8 tables

### **Step 3: Setup Security (RLS)**
1. Click **"New Query"** again
2. Copy content from: `supabase/migrations/step3_setup_rls.sql`
3. Paste and click **"Run"**
4. ✅ Should see "Success" - Enables security policies

### **Step 4: Create Functions**
1. Click **"New Query"** again
2. Copy content from: `supabase/migrations/step4_create_functions.sql`
3. Paste and click **"Run"**
4. ✅ Should see "Success" - Creates triggers and functions

### **Step 5: Insert Settings**
1. Click **"New Query"** again
2. Copy content from: `supabase/migrations/step5_insert_settings.sql`
3. Paste and click **"Run"**
4. ✅ Should see "Success" - Adds platform settings

---

## 🗂️ **Create Storage Buckets**

After all SQL steps are complete:

1. Click **"Storage"** in left sidebar
2. Click **"Create a new bucket"**

**Create these 3 buckets:**

### Bucket 1: `product-files`
- **Name**: `product-files`
- **Public**: ❌ (Private)
- **File size limit**: 500MB

### Bucket 2: `product-images`
- **Name**: `product-images`
- **Public**: ✅ (Public)
- **File size limit**: 50MB

### Bucket 3: `avatars`
- **Name**: `avatars`
- **Public**: ✅ (Public)
- **File size limit**: 10MB

---

## 🧪 **Test Your Setup**

After completing all steps:

```bash
npm run verify-supabase
```

You should see:
- ✅ Database connection successful
- ✅ All required tables exist
- ✅ Platform settings configured
- ✅ Storage buckets configured
- ✅ Authentication service working
- ✅ RLS policies configured

---

## 🚀 **Start Your App**

```bash
npm run dev
```

Go to: http://localhost:8080

---

## 🆘 **If Any Step Fails**

### **Step 1 Fails (Types)**
- Error: "type already exists" → Skip to Step 2
- Other errors → Check for typos in SQL

### **Step 2 Fails (Tables)**
- Error: "table already exists" → Check which tables exist in Table Editor
- Error: "type does not exist" → Go back and run Step 1

### **Step 3 Fails (RLS)**
- Error: "relation does not exist" → Step 2 didn't complete successfully
- Error: "policy already exists" → Continue to Step 4

### **Step 4 Fails (Functions)**
- Error: "function already exists" → Continue to Step 5
- Error: "relation does not exist" → Previous steps failed

### **Step 5 Fails (Settings)**
- Error: "duplicate key" → Settings already exist, that's OK
- Error: "relation does not exist" → Step 2 failed

---

## ✅ **Success Checklist**

After all steps:

- [ ] 8 tables created (profiles, products, orders, reviews, wishlists, disputes, payouts, platform_settings)
- [ ] 3 storage buckets created
- [ ] Platform settings inserted (8 settings)
- [ ] RLS policies active
- [ ] Functions and triggers working
- [ ] App runs without errors

Once complete, your Seltech marketplace database is ready! 🎉