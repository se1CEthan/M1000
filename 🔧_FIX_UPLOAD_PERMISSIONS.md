# 🔧 Fix Upload Permissions - Row Level Security

## ❌ **Problem: "new roles violate row-level security policy"**

This error occurs when trying to upload products due to database Row Level Security (RLS) policy restrictions.

---

## 🚀 **QUICK FIX (2 minutes)**

### **Step 1: Run Database Fix**
```sql
-- Execute this in Supabase SQL Editor:
-- Copy and paste: database/fix-rls-policies.sql
```

### **Step 2: Check User Permissions**
```bash
# Get your user ID from browser console (auth.user.id)
npm run fix-upload YOUR_USER_ID_HERE

# Example:
# npm run fix-upload 12345678-1234-1234-1234-123456789012
```

### **Step 3: Test Upload**
- Try uploading a product again
- Should work immediately after fixes

---

## 🔍 **Root Cause Analysis**

### **What Causes This Error:**
1. **Missing RLS policies** for products table
2. **User role not set** to "seller" 
3. **is_verified_seller** not set to true
4. **Storage bucket policies** not configured
5. **Trigger functions** missing for auto-assignment

### **Why It Happens:**
- Supabase RLS blocks unauthorized database operations
- Product uploads require specific seller permissions
- Storage operations need bucket-level policies
- User profiles need proper role assignments

---

## 🛠️ **Manual Fix Steps**

### **1. Fix Database Policies**
Execute in **Supabase SQL Editor**:
```sql
-- Run the complete fix script
-- File: database/fix-rls-policies.sql

-- Key policies created:
-- ✅ Sellers can insert their own products
-- ✅ Sellers can view their own products  
-- ✅ Public can view approved products
-- ✅ Storage bucket permissions
-- ✅ Automatic seller_id assignment
```

### **2. Fix User Role**
In **Supabase Dashboard → Authentication → Users**:
```json
// Update user metadata:
{
  "role": "seller",
  "is_verified_seller": true
}
```

Or via **Supabase Dashboard → Table Editor → profiles**:
- Find your user record
- Set `role` = "seller"
- Set `is_verified_seller` = true

### **3. Verify Storage Buckets**
In **Supabase Dashboard → Storage**:
- ✅ `product-files` (private)
- ✅ `product-images` (public)
- ✅ `user-avatars` (public)

---

## 🧪 **Testing & Verification**

### **Test 1: Check User Permissions**
```bash
# Run diagnostics script
npm run fix-upload YOUR_USER_ID

# Expected output:
# ✅ User profile found
# ✅ Role: seller
# ✅ Verified Seller: true
# ✅ Insert test successful
```

### **Test 2: Manual Product Upload**
```javascript
// Test in browser console
const { data, error } = await supabase
  .from('products')
  .insert({
    title: 'Test Product',
    description: 'Test description',
    price: 10.00,
    category: 'bots'
  });

console.log('Result:', { data, error });
// Should return data without error
```

### **Test 3: File Upload Test**
```javascript
// Test file upload in browser console
const file = new File(['test'], 'test.txt', { type: 'text/plain' });
const { data, error } = await supabase.storage
  .from('product-files')
  .upload(`${user.id}/test.txt`, file);

console.log('Upload result:', { data, error });
// Should succeed without RLS error
```

---

## 📋 **Complete Fix Checklist**

### **Database Level:**
- [ ] **RLS policies** created for products table
- [ ] **Storage policies** configured for buckets
- [ ] **Trigger functions** set up for auto-assignment
- [ ] **User permissions** granted to authenticated users

### **User Level:**
- [ ] **User role** set to "seller" or "admin"
- [ ] **is_verified_seller** set to true
- [ ] **Profile exists** in profiles table
- [ ] **User authenticated** and session valid

### **Application Level:**
- [ ] **Supabase client** configured correctly
- [ ] **Authentication** working properly
- [ ] **File upload** component has proper permissions
- [ ] **Error handling** in place for RLS violations

---

## 🚨 **Common Issues & Solutions**

### **Issue 1: "Policy not found"**
```sql
-- Solution: Recreate policies
DROP POLICY IF EXISTS "policy_name" ON table_name;
CREATE POLICY "policy_name" ON table_name FOR operation USING (condition);
```

### **Issue 2: "User not found in profiles"**
```sql
-- Solution: Create profile record
INSERT INTO profiles (user_id, role, is_verified_seller)
VALUES (auth.uid(), 'seller', true)
ON CONFLICT (user_id) DO UPDATE SET
  role = 'seller',
  is_verified_seller = true;
```

### **Issue 3: "Storage bucket not accessible"**
```sql
-- Solution: Fix storage policies
CREATE POLICY "policy_name" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'product-files' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### **Issue 4: "seller_id not set automatically"**
```sql
-- Solution: Create trigger function
CREATE OR REPLACE FUNCTION set_seller_id()
RETURNS TRIGGER AS $
BEGIN
  NEW.seller_id = auth.uid();
  RETURN NEW;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER set_seller_id_trigger
  BEFORE INSERT ON products
  FOR EACH ROW EXECUTE FUNCTION set_seller_id();
```

---

## 🎯 **Prevention Tips**

### **For Future Development:**
1. **Always test RLS policies** before production
2. **Use service role** for admin operations
3. **Implement proper error handling** for RLS violations
4. **Document permission requirements** for each feature
5. **Test with different user roles** during development

### **For Production:**
1. **Monitor RLS policy violations** in logs
2. **Set up alerts** for permission errors
3. **Regular permission audits** for security
4. **Backup policies** before making changes
5. **Test permission changes** in staging first

---

## ✅ **Success Verification**

After applying fixes, you should be able to:
- ✅ **Upload products** without RLS errors
- ✅ **View your own products** in seller dashboard
- ✅ **Upload files** to storage buckets
- ✅ **Update product** information
- ✅ **See products** in marketplace (after approval)

---

## 🎉 **All Fixed!**

Your **seltech.online** marketplace should now allow product uploads without permission errors!

**Next steps:**
1. **Test product upload** functionality
2. **Upload your first** real product
3. **Start earning** 10% commission on sales
4. **Launch marketing** campaigns

**Your marketplace is ready for business!** 🚀💰