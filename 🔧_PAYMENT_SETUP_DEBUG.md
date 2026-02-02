# 🔧 PAYMENT SETUP FAILED - DEBUG GUIDE

## 🚨 **ERROR**: "Payment setup failed, please try again"

This error occurs when the `createProductionPayment()` API call fails. Let's debug step by step.

---

## 🔍 **DEBUGGING STEPS**

### **1. Check Browser Console**
Open browser developer tools (F12) and look for errors:

**Expected Console Logs:**
```javascript
🚀 Creating production crypto payment with widget: {productId: "...", amount: 10, ...}
Cryptomus API response: {state: 0, result: {...}}
```

**Common Error Messages:**
- `CORS error` - Cross-origin request blocked
- `Network error` - API endpoint unreachable
- `Invalid signature` - API key or signature issue
- `Merchant not found` - Wrong merchant UUID
- `Order creation failed` - Database issue

### **2. Test API Configuration**
Check if the Cryptomus API keys are correct:

```javascript
// Current configuration:
PAYMENT_API_KEY: 'DSk5vMk3RIBhiQ3qGUw1pH1iYJI1hSSN8iTYmHpm3WpyTj9bsTtIlhadpiFKlK5aVUmpjHH8YoLV9dQsxLAPzpQOdiffl2hzJo0378ExFJB3HMSx49LjTfvnm9qHztoP'
MERCHANT_UUID: '6e6c1018-48f4-49fd-a10d-36d6cd70eefe'
BASE_URL: 'https://api.cryptomus.com/v1'
```

### **3. Test Database Connection**
Check if orders can be created in Supabase:
- Go to Supabase dashboard
- Check `orders` table exists
- Verify RLS policies allow inserts
- Check user authentication

---

## 🛠️ **COMMON FIXES**

### **Fix 1: CORS Issues**
If you see CORS errors, the API call is being blocked:

**Solution**: Cryptomus API should allow cross-origin requests, but if not:
1. Check if API endpoint is correct
2. Verify API keys are active
3. Try from server-side (Supabase Edge Function)

### **Fix 2: Invalid API Keys**
If you get "Invalid signature" or "Merchant not found":

**Solution**: 
1. Login to Cryptomus dashboard
2. Go to Settings → API
3. Copy the correct API keys
4. Update configuration

### **Fix 3: Database Issues**
If order creation fails:

**Solution**:
1. Check Supabase connection
2. Verify `orders` table schema
3. Check RLS policies
4. Ensure user is authenticated

### **Fix 4: Network Issues**
If API is unreachable:

**Solution**:
1. Check internet connection
2. Verify API endpoint URL
3. Try direct API test with curl

---

## 🧪 **MANUAL API TEST**

### **Test Cryptomus API Directly**
```bash
curl -X POST https://api.cryptomus.com/v1/payment \
  -H "Content-Type: application/json" \
  -H "merchant: 6e6c1018-48f4-49fd-a10d-36d6cd70eefe" \
  -H "sign: [GENERATED_SIGNATURE]" \
  -d '{
    "amount": "10",
    "currency": "USD",
    "order_id": "test-123",
    "to_currency": "USDT"
  }'
```

**Expected Response:**
```json
{
  "state": 0,
  "result": {
    "uuid": "payment-uuid",
    "url": "https://pay.cryptomus.com/pay/[PAYMENT_ID]",
    "payer_amount": "10.25",
    "payer_currency": "USDT"
  }
}
```

---

## 🔧 **QUICK FIXES TO TRY**

### **Option 1: Simplified Payment Test**
Create a minimal test version:

```javascript
// Test with minimal data
const testPayment = {
  amount: "10",
  currency: "USD",
  order_id: "test-" + Date.now(),
  merchant: "6e6c1018-48f4-49fd-a10d-36d6cd70eefe",
  to_currency: "USDT"
};
```

### **Option 2: Check User Authentication**
Ensure user is properly logged in:

```javascript
// In InstantPaymentWidget
console.log('User:', user);
console.log('User ID:', user?.id);
console.log('User Email:', user?.email);
```

### **Option 3: Bypass Order Creation**
Test API call without database:

```javascript
// Skip order creation temporarily
const paymentData = {
  amount: "10",
  currency: "USD", 
  order_id: "test-123",
  merchant: MERCHANT_UUID,
  to_currency: "USDT"
};
```

---

## 🎯 **STEP-BY-STEP DEBUG**

### **Step 1: Enable Detailed Logging**
Add more console logs to see where it fails:

```javascript
console.log('1. Starting payment creation...');
console.log('2. User check:', user);
console.log('3. Product check:', product);
console.log('4. Creating order...');
// ... after order creation
console.log('5. Order created:', order);
console.log('6. Calling Cryptomus API...');
// ... after API call
console.log('7. API response:', result);
```

### **Step 2: Test Each Component**
1. **User Authentication**: Can user log in?
2. **Database Access**: Can orders be created?
3. **API Keys**: Are they valid and active?
4. **Network**: Can reach Cryptomus API?
5. **Signature**: Is signature generation correct?

### **Step 3: Isolate the Issue**
Comment out parts to find where it fails:

```javascript
try {
  console.log('Testing order creation...');
  // Test order creation only
  
  console.log('Testing API call...');
  // Test API call only
  
  console.log('Testing signature...');
  // Test signature generation
} catch (error) {
  console.log('Failed at:', error.message);
}
```

---

## 🚀 **EXPECTED WORKING FLOW**

### **Successful Payment Creation:**
```
1. User clicks "Buy Now"
2. InstantPaymentWidget opens
3. handleApiPayment() called
4. Order created in database ✅
5. Cryptomus API called ✅
6. Payment URL received ✅
7. User redirected to payment ✅
```

### **Success Indicators:**
- ✅ No console errors
- ✅ Order appears in Supabase `orders` table
- ✅ Cryptomus API returns `state: 0`
- ✅ Payment URL is generated
- ✅ User redirected to Cryptomus payment page

---

## 📋 **CHECKLIST**

### **Before Testing:**
- [ ] User is logged in
- [ ] Product exists and is valid
- [ ] Supabase connection working
- [ ] Internet connection stable

### **API Configuration:**
- [ ] API keys are correct and active
- [ ] Merchant UUID matches Cryptomus dashboard
- [ ] Base URL is correct
- [ ] Signature generation working

### **Database Setup:**
- [ ] `orders` table exists
- [ ] RLS policies allow inserts
- [ ] User has proper permissions
- [ ] Foreign key constraints satisfied

---

## 🎯 **NEXT STEPS**

1. **Open browser console** (F12)
2. **Click "Buy Now"** on any product
3. **Check console logs** for specific error
4. **Report the exact error message** you see
5. **Try the suggested fixes** based on the error

**Most likely causes:**
1. **API key issues** (70% of cases)
2. **Database permissions** (20% of cases)  
3. **Network/CORS issues** (10% of cases)

Let me know the exact console error and I'll provide a targeted fix! 🔧