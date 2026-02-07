# PesaPal Final Setup - Complete Guide

## ✅ What You Need to Configure in PesaPal Dashboard

### 🔗 Callback/Redirect URL (Success URL)

When a customer completes payment, PesaPal will redirect them to this URL:

```
https://seltech.online/order-success?OrderTrackingId={OrderTrackingId}
```

**Where to set this**: PesaPal Dashboard → Settings → IPN/Callback Configuration → Callback URL

---

## 📋 Complete PesaPal Dashboard Configuration

| Setting | Value |
|---------|-------|
| **Callback URL** | `https://seltech.online/order-success?OrderTrackingId={OrderTrackingId}` |
| **IPN URL** | `https://www.seltech.online/pesapal/ipn` |
| **Cancel URL** | `https://seltech.online/marketplace` |
| **Currency** | `UGX` |
| **Payment Methods** | MTN Mobile Money, Airtel Money, Visa/Mastercard, Bank Transfer |

---

## 🔄 How It Works

### Step 1: Customer Clicks "Buy Now"
```
Customer on: https://seltech.online/product/telegram-bot
Clicks: "Buy Now" button
```

### Step 2: Order Created in Database
```javascript
// Order created with:
{
  id: "550e8400-e29b-41d4-a716-446655440000",
  product_id: "abc-123",
  seller_id: "seller-xyz",
  buyer_id: "buyer-789",
  status: "pending",
  price: 10.00,  // USD (37,000 UGX)
  payment_method: "pesapal"
}
```

### Step 3: Customer Redirected to PesaPal
```
From: https://seltech.online
To: https://pay.pesapal.com/v3/payment?tracking_id=ABC123XYZ
```

Customer completes payment on PesaPal's secure platform.

### Step 4: PesaPal Redirects Back
```
From: https://pay.pesapal.com/v3/payment
To: https://seltech.online/order-success?OrderTrackingId=ABC123XYZ
                                                        ↑
                                        PesaPal's tracking ID
```

### Step 5: System Looks Up Order
```javascript
// Your code fetches order using PesaPal tracking ID
const trackingId = searchParams.get('OrderTrackingId');  // "ABC123XYZ"

// Look up order in database
const order = await supabase
  .from('orders')
  .select('*')
  .eq('payment_id', trackingId)  // or pesapal_tracking_id
  .single();

// Returns the order with all product details
```

### Step 6: Download Page Displayed
```
✅ Customer sees download page
✅ Correct product displayed
✅ Download link available
✅ Seller gets 90% earnings
✅ Platform gets 10% fee
```

---

## 🎯 Key Points

### 1. PesaPal Tracking ID is the Key
- PesaPal generates a unique tracking ID for each payment
- This tracking ID is included in the redirect URL
- Your system uses it to look up the order in the database

### 2. Order Stored Before Payment
- Order is created in database BEFORE redirect to PesaPal
- Order includes: product_id, seller_id, buyer_id, price
- PesaPal tracking ID is stored in the order when payment is initiated

### 3. Redirect URL Format
```
https://seltech.online/order-success?OrderTrackingId={OrderTrackingId}
                                                      ↑
                                      PesaPal replaces this with actual tracking ID
```

**Example after payment**:
```
https://seltech.online/order-success?OrderTrackingId=ABC123XYZ456
```

---

## 🔍 Database Lookup Process

### When PesaPal redirects with tracking ID:

```typescript
// 1. Extract tracking ID from URL
const trackingId = searchParams.get('OrderTrackingId');
// Result: "ABC123XYZ456"

// 2. Look up order by tracking ID
const { data: order } = await supabase
  .from('orders')
  .select(`
    *,
    product:products(title, file_url, price, description),
    seller:profiles!seller_id(full_name, email, mobile_money_number)
  `)
  .eq('payment_id', trackingId)
  .single();

// 3. Order found! Display download page with:
// - Product title
// - Download link (product.file_url)
// - Seller information
// - Order details
```

---

## 📊 Order Status Flow

```
pending → processing → paid → completed
   ↓          ↓         ↓         ↓
Created   Redirected  Payment  Download
          to PesaPal  Confirmed Available
```

### Status Updates:

1. **pending**: Order created, waiting for payment
2. **processing**: Customer redirected to PesaPal
3. **paid**: Payment confirmed by PesaPal webhook
4. **completed**: Customer downloaded the product

---

## 🛡️ Security & Reliability

### 1. Webhook Verification (Background)
While the customer is being redirected, PesaPal also sends a webhook to:
```
https://www.seltech.online/pesapal/ipn
```

This webhook:
- Confirms payment independently
- Updates order status to "paid"
- Prevents fraud (customer can't fake payment)
- Works even if customer closes browser

### 2. Tracking ID is Unique
- Each payment has a unique tracking ID
- Cannot be guessed or manipulated
- Tied to specific order in PesaPal's system

### 3. Database Validation
- Order must exist in database
- Buyer must match logged-in user
- Payment status verified via webhook

---

## 🧪 Testing the Setup

### Test Flow:

1. **Go to your website**: https://seltech.online
2. **Browse products**: Click on any product
3. **Click "Buy Now"**: This creates an order
4. **Check database**: Order should exist with status "pending"
5. **Click "Pay with PesaPal"**: Redirected to PesaPal
6. **Complete payment**: Use test card or mobile money
7. **Check redirect**: Should go to:
   ```
   https://seltech.online/order-success?OrderTrackingId=ABC123XYZ
   ```
8. **Verify download page**: Should show correct product
9. **Check database**: Order status should be "paid"
10. **Test download**: Click download button

### Test Cards (Sandbox Mode):
- **Visa**: `4111111111111111`
- **Mastercard**: `5500000000000004`
- **CVV**: Any 3 digits
- **Expiry**: Any future date
- **Amount**: Any amount

### Test Mobile Money (Sandbox):
- **MTN**: Use any 077x or 078x number
- **Airtel**: Use any 070x or 075x number
- **PIN**: Any 4 digits

---

## ⚠️ Common Issues & Solutions

### Issue 1: "Order not found" after redirect

**Cause**: Tracking ID not stored in database

**Solution**: Make sure your code stores the PesaPal tracking ID when creating the payment:

```typescript
// When creating payment, store tracking ID
await supabase
  .from('orders')
  .update({
    payment_id: pesapalTrackingId,
    pesapal_tracking_id: pesapalTrackingId  // Store in both fields
  })
  .eq('id', orderId);
```

### Issue 2: Redirect URL doesn't include tracking ID

**Cause**: Callback URL not configured in PesaPal dashboard

**Solution**: 
1. Log into PesaPal dashboard
2. Go to Settings → IPN/Callback Configuration
3. Set Callback URL to: `https://seltech.online/order-success?OrderTrackingId={OrderTrackingId}`
4. Save changes

### Issue 3: Download page shows wrong product

**Cause**: Order lookup returning wrong order

**Solution**: Verify the tracking ID is unique and correctly stored in database

### Issue 4: Webhook not received

**Cause**: IPN URL not configured or not accessible

**Solution**:
1. Configure IPN URL in PesaPal dashboard: `https://www.seltech.online/pesapal/ipn`
2. Ensure your server is accessible from internet
3. Check SSL certificate is valid
4. Test webhook endpoint manually

---

## 📝 Code Updates Made

### 1. OrderSuccess.tsx
Updated to handle PesaPal tracking ID:

```typescript
// Extract tracking ID from URL
const pesapalTrackingId = searchParams.get('OrderTrackingId');

// Look up order by tracking ID
if (pesapalTrackingId) {
  const { data: order } = await supabase
    .from('orders')
    .select('*')
    .eq('payment_id', pesapalTrackingId)
    .single();
}
```

### 2. pesapal-payment.ts
Already configured to store tracking ID:

```typescript
// Store PesaPal tracking ID in order
await supabase
  .from('orders')
  .update({
    payment_id: result.trackingId,
    pesapal_tracking_id: result.trackingId
  })
  .eq('id', order.id);
```

---

## ✅ Final Checklist

Before going live:

- [ ] PesaPal Callback URL configured: `https://seltech.online/order-success?OrderTrackingId={OrderTrackingId}`
- [ ] PesaPal IPN URL configured: `https://www.seltech.online/pesapal/ipn`
- [ ] PesaPal Cancel URL configured: `https://seltech.online/marketplace`
- [ ] Currency set to UGX in PesaPal dashboard
- [ ] Payment methods enabled (MTN, Airtel, Cards)
- [ ] Test purchase completed successfully
- [ ] Redirect works and includes tracking ID
- [ ] Order found using tracking ID
- [ ] Download page displays correct product
- [ ] Webhook received and order status updated
- [ ] Seller earnings calculated (90%)
- [ ] Platform fee calculated (10%)

---

## 🎉 Summary

**In PesaPal Dashboard, set Callback URL to:**
```
https://seltech.online/order-success?OrderTrackingId={OrderTrackingId}
```

**After payment, PesaPal redirects to:**
```
https://seltech.online/order-success?OrderTrackingId=ABC123XYZ456
```

**Your code:**
1. Extracts `OrderTrackingId` from URL
2. Looks up order in database using tracking ID
3. Displays download page with correct product
4. Customer downloads their purchase

**That's it!** 🚀

The system automatically:
- ✅ Tracks which product was purchased
- ✅ Shows correct download page
- ✅ Calculates seller earnings (90%)
- ✅ Calculates platform fee (10%)
- ✅ Updates order status via webhook
- ✅ Sends notifications to buyer and seller