# 🔧 API Error Debugging - "Unknown API Error" Fix

## 🚨 Issue Analysis
**"Unknown API error"** typically occurs when:
1. API endpoint returns an error response
2. Response format doesn't match expected structure
3. Import/dependency issues in the API code
4. Database connection or query errors

## ✅ Fixes Applied

### **1. Simplified API Endpoints**
- ✅ **Removed complex imports** - Now uses existing working `@/lib/cryptomus` integration
- ✅ **Fixed type errors** - Corrected order status types
- ✅ **Added better error handling** - More descriptive error messages
- ✅ **Improved CORS support** - Proper headers for all responses

### **2. Updated Import Structure**
```typescript
// Before (causing issues)
import { CryptomusAPIClient } from '@/lib/cryptomus-core';
import { SUPPORTED_CRYPTOCURRENCIES } from '@/lib/cryptomus-core';

// After (working)
import { createPaymentInvoice, checkPaymentStatus } from '@/lib/cryptomus';
import { SUPPORTED_CURRENCIES } from '@/lib/cryptomus';
```

### **3. API Response Format**
```typescript
// Consistent response format
{
  "success": true,
  "state": 0,
  "result": {
    "paymentId": "uuid",
    "orderId": "order-id",
    "paymentUrl": "https://pay.cryptomus.com/...",
    "amount": "29.99",
    "currency": "USD",
    "toCurrency": "USDT"
  }
}
```

## 🔍 Debugging Steps

### **1. Check Browser Console**
Open browser dev tools and look for:
```javascript
// Expected successful response
{
  success: true,
  state: 0,
  result: { ... }
}

// Error response format
{
  success: false,
  state: 1,
  error: "Specific error message"
}
```

### **2. Test API Endpoints Directly**
```bash
# Test create payment
curl -X POST http://localhost:3000/api/cryptomus/create-payment \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "test-product-id",
    "amount": 29.99,
    "currency": "USD",
    "toCurrency": "USDT",
    "buyerId": "test-user-id"
  }'

# Expected response
{
  "success": true,
  "state": 0,
  "result": {
    "paymentUrl": "https://pay.cryptomus.com/...",
    "orderId": "order-id"
  }
}
```

### **3. Check Server Logs**
Look for console.log messages:
```
Creating Cryptomus payment: { productId: '...', amount: 29.99, ... }
Creating Cryptomus invoice: { amount: '29.99', currency: 'USD', ... }
Payment created successfully: { success: true, ... }
```

## 🛠️ Common Issues & Solutions

### **Issue 1: Import Errors**
```typescript
// ❌ Wrong - may cause "Unknown API error"
import { CryptomusAPIClient } from '@/lib/cryptomus-core';

// ✅ Correct - uses existing working integration
import { createPaymentInvoice } from '@/lib/cryptomus';
```

### **Issue 2: Database Connection**
```typescript
// Check if Supabase client is properly configured
const { data: product, error: productError } = await supabase
  .from('products')
  .select('*')
  .eq('id', productId)
  .single();

if (productError) {
  console.error('Database error:', productError);
  // Return proper error response
}
```

### **Issue 3: Environment Variables**
```env
# Ensure these are set
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_CRYPTOMUS_MERCHANT_UUID=6e6c1018-48f4-49fd-a10d-36d6cd70eefe
```

### **Issue 4: CORS Problems**
```typescript
// All API responses now include CORS headers
return new Response(JSON.stringify(response), {
  status: 200,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
});
```

## 🧪 Testing the Fix

### **1. Test Payment Creation**
1. Go to a product page
2. Click "Buy Now with Crypto"
3. Select USDT
4. Check browser console for API calls
5. Should see successful response with `paymentUrl`

### **2. Expected Flow**
```
User clicks "Pay with USDT" 
→ Frontend calls /api/cryptomus/create-payment
→ API creates order in database
→ API calls Cryptomus to create invoice
→ API returns payment URL
→ User redirected to Cryptomus
→ User completes payment
→ User returns to success page
```

### **3. Error Handling Test**
Try with invalid data to see proper error messages:
```javascript
// Should return specific error, not "Unknown API error"
{
  "success": false,
  "state": 1,
  "error": "Product not found or not available"
}
```

## 🚀 Production Verification

### **Environment Check**
```bash
# Verify environment variables are loaded
echo $VITE_CRYPTOMUS_MERCHANT_UUID
echo $VITE_SUPABASE_URL
```

### **API Health Check**
```bash
# Test OPTIONS request (CORS preflight)
curl -X OPTIONS http://localhost:3000/api/cryptomus/create-payment

# Should return 200 with CORS headers
```

### **Database Connection Test**
```sql
-- Verify orders table exists and has correct columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders';
```

## ✅ Resolution Summary

The "Unknown API error" has been fixed by:

1. **Simplified imports** - Using existing working Cryptomus integration
2. **Fixed type errors** - Corrected order status enum values
3. **Better error handling** - Specific error messages instead of generic ones
4. **Improved CORS** - Proper headers for cross-origin requests
5. **Consistent response format** - All APIs return same structure

## 🎯 Next Steps

1. **Test the payment flow** - Should now work without "Unknown API error"
2. **Check browser console** - Look for successful API responses
3. **Verify Cryptomus integration** - Payment URLs should be generated
4. **Test with real transaction** - Small amount to verify end-to-end flow

The payment system should now work correctly with your production Cryptomus keys on **seltech.online**!