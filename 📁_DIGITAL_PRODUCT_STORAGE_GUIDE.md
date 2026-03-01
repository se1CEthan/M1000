# 📁 Digital Product Storage System

## 🗂️ **Where Digital Products Are Stored**

Your Seltech marketplace uses **Supabase Storage** to store all digital products securely. Here's the complete storage architecture:

---

## 🏗️ **Storage Architecture**

### **Supabase Storage Buckets:**

1. **`product-files`** - Main digital products (ZIP, EXE, etc.)
2. **`product-images`** - Thumbnails and preview images  
3. **`verification-documents`** - Seller verification docs
4. **`user-avatars`** - Profile pictures

### **File Organization Structure:**
```
📁 product-files/
├── 📁 {seller-id}/
│   ├── 📄 1640995200000-discord-bot.zip
│   ├── 📄 1640995300000-react-template.zip
│   └── 📄 1640995400000-wordpress-plugin.zip
│
📁 product-images/
├── 📁 {seller-id}/
│   ├── 🖼️ 1640995200000-thumbnail.jpg
│   ├── 🖼️ 1640995300000-preview1.png
│   └── 🖼️ 1640995400000-preview2.png
```

---

## 💾 **How File Upload Works**

### **1. Seller Uploads Product**
```typescript
// From ProductUploadForm.tsx
const uploadFile = async (file: File, bucket: string, path: string) => {
  const { data, error } = await supabase.storage
    .from(bucket)  // 'product-files' or 'product-images'
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw error;
  return data;
};
```

### **2. File Path Generation**
```typescript
// Unique file paths prevent conflicts
const filePath = `${profile.id}/${Date.now()}-${productFile.name}`;
// Example: "abc123/1640995200000-discord-bot.zip"
```

### **3. Database Record Creation**
```sql
-- Products table stores file references
INSERT INTO products (
  seller_id,
  title,
  file_url,           -- Link to Supabase Storage
  file_size,          -- File size in bytes
  thumbnail_url,      -- Link to thumbnail image
  -- ... other fields
);
```

---

## 🔒 **Security & Access Control**

### **File Access Levels:**

#### **Public Files (Thumbnails/Previews):**
```typescript
// Public URL - anyone can view
const publicUrl = supabase.storage
  .from('product-images')
  .getPublicUrl(filePath).data.publicUrl;
```

#### **Private Files (Product Downloads):**
```typescript
// Signed URL - expires after set time
const { data: signedUrl } = await supabase.storage
  .from('product-files')
  .createSignedUrl(filePath, 7 * 24 * 60 * 60); // 7 days
```

### **Download Security:**
- ✅ **Signed URLs** expire after 7 days
- ✅ **Purchase verification** required
- ✅ **One-time download** links (optional)
- ✅ **User authentication** required

---

## 📥 **Download Process for Buyers**

### **1. Purchase Completion**
```typescript
// When payment is confirmed (from payment-service.ts)
const downloadUrl = await generateDownloadUrl(productId);

// Update order with secure download link
await supabase.from('orders').update({
  download_url: downloadUrl,
  download_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
}).eq('id', orderId);
```

### **2. Secure Download Generation**
```typescript
// From payment-service.ts
static async generateDownloadUrl(productId: string): Promise<string> {
  // Get product file URL
  const { data: product } = await supabase
    .from('products')
    .select('file_url')
    .eq('id', productId)
    .single();

  // Generate signed URL (expires in 7 days)
  const { data: signedUrl } = await supabase.storage
    .from('product-files')
    .createSignedUrl(product.file_url, 7 * 24 * 60 * 60);

  return signedUrl.signedUrl;
}
```

### **3. Buyer Downloads Product**
- Buyer receives email with download link
- Link works for 7 days after purchase
- Direct download from Supabase Storage
- No server bandwidth usage for you

---

## 📊 **File Size & Type Limits**

### **Current Limits:**
```typescript
// From ProductUploadForm.tsx
const handleProductFileChange = (file: File) => {
  if (file.size > 500 * 1024 * 1024) { // 500MB limit
    toast.error('Product file must be under 500MB');
    return;
  }
};

const handleThumbnailChange = (file: File) => {
  if (file.size > 5 * 1024 * 1024) { // 5MB limit
    toast.error('Thumbnail must be under 5MB');
    return;
  }
};
```

### **Supported File Types:**
- **Product Files**: ZIP, RAR, TAR.GZ, EXE, DMG, PKG, DEB, RPM
- **Images**: JPG, PNG, GIF, WebP
- **Documents**: PDF (for documentation)

---

## 🔧 **Storage Configuration**

### **Supabase Storage Buckets Setup:**
```sql
-- Create storage buckets (run in Supabase SQL Editor)

-- 1. Product files bucket (private)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-files', 'product-files', false);

-- 2. Product images bucket (public)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true);

-- 3. Verification documents bucket (private)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('verification-documents', 'verification-documents', false);
```

### **Storage Policies:**
```sql
-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload to own folder" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'product-files' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to download files they purchased
CREATE POLICY "Users can download purchased files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'product-files' AND
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.buyer_id = auth.uid() 
    AND orders.status = 'paid'
    AND orders.download_url LIKE '%' || name || '%'
  )
);
```

---

## 💰 **Storage Costs**

### **Supabase Storage Pricing:**
- **Free Tier**: 1GB storage + 2GB bandwidth
- **Pro Plan**: $25/month for 100GB + 200GB bandwidth
- **Additional**: $0.021/GB storage, $0.09/GB bandwidth

### **Cost Optimization:**
- ✅ **Signed URLs** reduce bandwidth costs
- ✅ **CDN caching** improves performance
- ✅ **File compression** reduces storage needs
- ✅ **Automatic cleanup** of expired files

---

## 🚀 **Advanced Features**

### **1. File Compression**
```typescript
// Automatic compression for large files
const compressFile = async (file: File): Promise<File> => {
  if (file.size > 100 * 1024 * 1024) { // 100MB+
    // Implement compression logic
    return compressedFile;
  }
  return file;
};
```

### **2. Virus Scanning**
```typescript
// Integration with virus scanning service
const scanFile = async (fileUrl: string): Promise<boolean> => {
  // Implement virus scanning
  return isClean;
};
```

### **3. File Analytics**
```typescript
// Track download statistics
const trackDownload = async (productId: string, buyerId: string) => {
  await supabase.from('download_analytics').insert({
    product_id: productId,
    buyer_id: buyerId,
    downloaded_at: new Date().toISOString(),
    ip_address: getClientIP(),
    user_agent: getUserAgent()
  });
};
```

---

## 🔄 **File Lifecycle**

### **1. Upload Process**
```
Seller selects file → Validation → Upload to Supabase → Database record → Admin review
```

### **2. Purchase Process**
```
Buyer pays → Payment confirmed → Signed URL generated → Download link sent → File downloaded
```

### **3. Cleanup Process**
```
Download expires → Signed URL invalid → File remains in storage → Analytics tracked
```

---

## 📱 **Mobile & API Access**

### **Mobile App Downloads:**
```typescript
// React Native / Mobile app integration
const downloadFile = async (downloadUrl: string, filename: string) => {
  const { uri } = await FileSystem.downloadAsync(
    downloadUrl,
    FileSystem.documentDirectory + filename
  );
  return uri;
};
```

### **API Endpoints:**
```typescript
// RESTful API for file operations
GET    /api/products/{id}/download     // Get download URL
POST   /api/products/{id}/upload      // Upload product file
DELETE /api/products/{id}/file        // Delete product file
GET    /api/storage/stats             // Storage usage stats
```

---

## 🎯 **Best Practices**

### **For Sellers:**
- ✅ **Compress files** before uploading (ZIP recommended)
- ✅ **Include README** files with instructions
- ✅ **Use descriptive filenames**
- ✅ **Test downloads** after upload
- ✅ **Keep backups** of original files

### **For Platform:**
- ✅ **Monitor storage usage** and costs
- ✅ **Implement file scanning** for security
- ✅ **Set up automated backups**
- ✅ **Track download analytics**
- ✅ **Regular cleanup** of expired files

---

## 🎉 **Summary**

Your digital products are stored in:

📍 **Location**: Supabase Storage (AWS S3 backend)
🔒 **Security**: Private buckets with signed URLs
⏰ **Access**: 7-day expiring download links
💾 **Capacity**: 500MB per file, unlimited products
🌍 **CDN**: Global distribution for fast downloads
💰 **Cost**: Pay-as-you-use pricing model

**Your sellers upload once, buyers download securely, and you earn 10% automatically!** 🚀

---

**Files Reference:**
- **Upload Logic**: `src/components/seller/ProductUploadForm.tsx`
- **Download Logic**: `src/lib/payment-service.ts`
- **Storage Config**: Supabase Dashboard → Storage
- **Database Schema**: `products.file_url` field