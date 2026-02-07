# PesaPal Store - Final Configuration Guide

## 🎯 Important: PesaPal Store vs PesaPal API

You're using **PesaPal Store** (https://store.pesapal.com/seltech), which is different from the PesaPal API.

### Key Difference:
- **PesaPal API**: Supports dynamic variables like `{OrderTrackingId}`, `{OrderMerchantReference}`
- **PesaPal Store**: Uses the `return_url` parameter you send in the redirect URL

---

## ✅ Correct PesaPal Dashboard Configuration

### In PesaPal Dashboard → Settings:

| Setting | Value |
|---------|-------|
| **Primary Return URL** | `https://www.seltech.online/order-success` |
| **IPN/Notification URL** | `https://www.seltech.online/pesapal/ipn` (if available) |
| **Cancel URL** | `https://www.seltech.online/marketplace` |

**Note**: Don't include `?order_id=ORDER_ID` in the dashboard. The order ID will be passed dynamically through the redirect URL.

---

## 🔄 How It Actually Works

### Step 1: Customer Clicks "Buy Now"

Your code creates an order and redirects to:
```
https://store.pesapal.com/seltech?
  amount=37000&
  desc=Food%20mart&
  reference=e17e63e4-7bc1-413c-b2ed-9834ed5ac495&
  return_url=https://www.seltech.online/order-success?order_id=e17e63e4-7bc1-413c-b2ed-9834ed5ac495
```

### Step 2: PesaPal Uses Your return_url

PesaPal Store will redirect to the **exact URL you provided** in the `return_url` parameter:
```
https://www.seltech.online/order-success?order_id=e17e63e4-7bc1-413c-b2ed-9834ed5ac495
```

### Step 3: Your Page Extracts order_id

```typescript
const orderId = searchParams.get('order_id');
// Result: "e17e63e4-7bc1-413c-b2ed-9834ed5ac495"
```

### Step 4: Look Up Order and Display Product

```typescript
const { data: order } = await supabase
  .from('orders')
  .select('*, product:products(*)')
  .eq('id', orderId)
  .single();

// Display the correct product!
```

---

## 📋 Complete Flow Example

### Product: Food Mart (UGX 37,000)

```
1. Customer on: https://seltech.online/product/food-mart
   ↓ Clicks "Buy Now"

2. Order created: e17e63e4-7bc1-413c-b2ed-9834ed5ac495
   ↓ Redirect to PesaPal

3. PesaPal URL:
   https://store.pesapal.com/seltech?
     amount=37000&
     desc=Food%20mart&
     reference=e17e63e4-7bc1-413c-b2ed-9834ed5ac495&
     return_url=https://www.seltech.online/order-success?order_id=e17e63e4-7bc1-413c-b2ed-9834ed5ac495
   ↓ Customer pays

4. PesaPal redirects to:
   https://www.seltech.online/order-success?order_id=e17e63e4-7bc1-413c-b2ed-9834ed5ac495
   ↓ Extract order_id

5. System looks up order:
   SELECT * FROM orders WHERE id = 'e17e63e4-7bc1-413c-b2ed-9834ed5ac495'
   ↓ Found!

6. Display download page:
   ✅ Product: Food Mart
   ✅ Download link
   ✅ Seller gets 90%
   ✅ Platform gets 10%
```

---

## 🔑 Key Points

### 1. Dashboard Configuration is Generic
In PesaPal Dashboard, set:
```
Primary Return URL: https://www.seltech.online/order-success
```

This is just a fallback. The actual return URL comes from your redirect.

### 2. Dynamic Return URL in Code
Your code sends the specific return URL with order ID:
```typescript
const returnUrl = encodeURIComponent(
  `${window.location.origin}/order-success?order_id=${order.id}`
);

window.location.href = 
  `https://store.pesapal.com/seltech?` +
  `amount=${ugxAmount}&` +
  `desc=${encodeURIComponent(product.title)}&` +
  `reference=${order.id}&` +
  `return_url=${returnUrl}`;
```

### 3. PesaPal Uses Your return_url
PesaPal Store will redirect to whatever URL you provide in the `return_url` parameter, which includes your order ID.

### 4. Multiple Fallbacks
Your OrderSuccess page checks multiple parameters:
```typescript
const orderId = searchParams.get('order_id') ||    // Primary
                searchParams.get('reference') ||    // PesaPal reference
                searchParams.get('product') ||      // Fallback
                searchParams.get('order');          // Alternative
```

---

## 🧪 Testing

### Test the Complete Flow:

1. **Go to your website**: https://seltech.online
2. **Click on a product**: e.g., Food Mart
3. **Click "Buy Now"**: 
   - Order created in database
   - Redirected to PesaPal
4. **Check the URL**: Should be:
   ```
   https://store.pesapal.com/seltech?amount=37000&desc=Food%20mart&reference=ORDER_ID&return_url=https://www.seltech.online/order-success?order_id=ORDER_ID
   ```
5. **Complete payment**: Use test payment method
6. **Check redirect**: Should go to:
   ```
   https://www.seltech.online/order-success?order_id=ORDER_ID
   ```
7. **Verify download page**: Should show Food Mart with download button

---

## ⚠️ Common Issues

### Issue: "Order not found" after payment

**Possible Causes:**
1. Order ID not in URL
2. Order ID format incorrect
3. Database lookup failing

**Solution:**
1. Check browser URL after redirect - does it have `?order_id=...`?
2. Check browser console for errors
3. Check database - does the order exist?

### Issue: Wrong product displayed

**Possible Causes:**
1. Order lookup returning wrong order
2. Product ID mismatch

**Solution:**
1. Verify order ID in URL matches order in database
2. Check order's product_id matches the product

### Issue: PesaPal doesn't redirect back

**Possible Causes:**
1. return_url not properly encoded
2. PesaPal configuration issue
3. Payment not completed

**Solution:**
1. Check return_url is properly URL encoded
2. Verify PesaPal dashboard settings
3. Complete the payment fully

---

## 📊 Database Verification

### Check if order was created:
```sql
SELECT * FROM orders 
WHERE id = 'e17e63e4-7bc1-413c-b2ed-9834ed5ac495';
```

### Check order with product details:
```sql
SELECT 
  orders.*,
  products.title as product_title,
  products.file_url,
  profiles.full_name as seller_name
FROM orders
JOIN products ON orders.product_id = products.id
JOIN profiles ON orders.seller_id = profiles.id
WHERE orders.id = 'e17e63e4-7bc1-413c-b2ed-9834ed5ac495';
```

---

## ✅ Final Checklist

- [ ] PesaPal Dashboard configured with return URL: `https://www.seltech.online/order-success`
- [ ] Code creates order before redirect
- [ ] Code includes order ID in `reference` parameter
- [ ] Code includes order ID in `return_url` parameter
- [ ] OrderSuccess page extracts order_id from URL
- [ ] OrderSuccess page looks up order in database
- [ ] OrderSuccess page displays correct product
- [ ] Test purchase completed successfully
- [ ] Download page shows correct product
- [ ] Seller earnings calculated (90%)
- [ ] Platform fee calculated (10%)

---

## 🎉 Summary

**In PesaPal Dashboard:**
```
Primary Return URL: https://www.seltech.online/order-success
```

**In Your Code (ProductDetail.tsx):**
```typescript
// Redirect with order ID in return_url
window.location.href = 
  `https://store.pesapal.com/seltech?` +
  `amount=${ugxAmount}&` +
  `desc=${encodeURIComponent(product.title)}&` +
  `reference=${order.id}&` +
  `return_url=${encodeURIComponent(`https://www.seltech.online/order-success?order_id=${order.id}`)}`;
```

**After Payment:**
```
PesaPal redirects to: https://www.seltech.online/order-success?order_id=ORDER_ID
Your page extracts order_id and displays the correct product
```

**That's it!** The order ID in the return_url ensures the correct product is displayed. 🚀

---

## 💡 Pro Tip

You can also use the `reference` parameter as a backup:

```typescript
// In OrderSuccess.tsx
const orderId = searchParams.get('order_id') ||    // From return_url
                searchParams.get('reference');      // From PesaPal reference

// This way, even if order_id is missing, you can still find the order
```

Your current code already does this! ✅