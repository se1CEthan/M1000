# PesaPal Dashboard Setup Guide

## Complete Configuration for Seltech Online

This guide shows you exactly what to configure in your PesaPal merchant dashboard to integrate with your website.

---

## 🔑 Step 1: Get Your API Credentials

### Location: PesaPal Dashboard → Settings → API Credentials

You need these two values (already in your code):
- **Consumer Key**: `weWg875DVTHfXKyPK2w2qq0SuZjLKnFx`
- **Consumer Secret**: `owNK+kmjk1tgSYIfOGxuvnxCSos=`

✅ These are already configured in `src/lib/pesapal-payment.ts`

---

## 🔗 Step 2: Configure Callback/Redirect URLs

### Location: PesaPal Dashboard → Settings → IPN/Callback URLs

PesaPal needs to know where to redirect customers after payment. You need to configure **TWO URLs**:

### 1. Success/Callback URL (Required)
This is where PesaPal redirects the customer after successful payment.

**Important**: PesaPal uses `OrderTrackingId` as the variable name, NOT `{id}`

#### ❌ WRONG Format:
```
https://seltech.online/order-success?order_id={id}
```

#### ✅ CORRECT Format:
```
https://seltech.online/order-success?OrderTrackingId={OrderTrackingId}
```

**OR** if you want to use your own order ID:

```
https://seltech.online/order-success?order_id={OrderMerchantReference}
```

### 2. IPN (Instant Payment Notification) URL (Required)
This is the webhook URL where PesaPal sends payment confirmations in the background.

```
https://www.seltech.online/pesapal/ipn
```

---

## 📋 Complete PesaPal Dashboard Configuration

### Settings → API Configuration

| Field | Value |
|-------|-------|
| **Callback URL** | `https://seltech.online/order-success?OrderTrackingId={OrderTrackingId}` |
| **IPN URL** | `https://www.seltech.online/pesapal/ipn` |
| **Cancel URL** | `https://seltech.online/marketplace` |
| **Currency** | `UGX` (Ugandan Shilling) |
| **Payment Methods** | ✅ MTN Mobile Money<br>✅ Airtel Money<br>✅ Visa/Mastercard<br>✅ Bank Transfer |

---

## 🔄 Understanding PesaPal Variables

PesaPal provides these variables in the redirect URL:

| Variable | Description | Example |
|----------|-------------|---------|
| `{OrderTrackingId}` | PesaPal's tracking ID | `ABC123XYZ` |
| `{OrderMerchantReference}` | Your order ID (the one you sent) | `550e8400-e29b-41d4-a716-446655440000` |
| `{OrderNotificationType}` | Notification type | `IPNCHANGE` |

---

## 🛠️ Code Update Required

Since PesaPal uses `OrderTrackingId` instead of `order_id`, you need to update your code to handle both:

### Update Order Success Page

The order success page should check for both parameter names:

```typescript
// Get order ID from URL - check both parameter names
const orderIdFromUrl = searchParams.get('order_id');
const trackingId = searchParams.get('OrderTrackingId');
const merchantRef = searchParams.get('OrderMerchantReference');

// Use whichever is available
const orderId = orderIdFromUrl || merchantRef || trackingId;
```

---

## 🎯 Recommended Setup (Two Options)

### Option 1: Use PesaPal's Tracking ID (Simpler)

**PesaPal Dashboard Configuration:**
```
Callback URL: https://seltech.online/order-success?OrderTrackingId={OrderTrackingId}
```

**Your Code:**
```typescript
// Get tracking ID from URL
const trackingId = searchParams.get('OrderTrackingId');

// Look up order by tracking ID
const { data: order } = await supabase
  .from('orders')
  .select('*')
  .eq('payment_id', trackingId)  // or pesapal_tracking_id
  .single();
```

### Option 2: Use Your Order ID (More Control) ⭐ RECOMMENDED

**PesaPal Dashboard Configuration:**
```
Callback URL: https://seltech.online/order-success?order_id={OrderMerchantReference}
```

**Your Code:**
```typescript
// Get your order ID from URL
const orderId = searchParams.get('order_id');

// Look up order directly
const { data: order } = await supabase
  .from('orders')
  .select('*')
  .eq('id', orderId)
  .single();
```

**Why Option 2 is better:**
- You control the order ID format
- Direct database lookup (faster)
- No need to store PesaPal tracking ID first
- Works even if webhook is delayed

---

## 📝 Current Code Configuration

Your current code in `src/lib/pesapal-payment.ts` sends:

```typescript
const paymentData = {
  id: order.id,  // This becomes OrderMerchantReference in PesaPal
  currency: 'UGX',
  amount: revenueSplit.totalAmount,
  description: `Purchase: ${request.productTitle}`,
  callback_url: `${SUCCESS_URL}?order_id=${order.id}`,  // ✅ Already correct!
  notification_id: 'https://www.seltech.online/pesapal/ipn',
  // ...
};
```

**Good news**: Your code already includes the order ID in the callback URL! 

But PesaPal will **replace** your callback URL with their configured one from the dashboard.

---

## ⚠️ Important: PesaPal Overrides Callback URL

**Key Point**: The `callback_url` you send in the API request is often **ignored** by PesaPal. They use the URL configured in your merchant dashboard instead.

This means:
1. ✅ Configure the callback URL in PesaPal dashboard (most important)
2. ✅ Keep the callback URL in your code (for reference/fallback)
3. ✅ Make sure both match

---

## 🧪 Testing the Setup

### Test Flow:

1. **Create a test purchase** on your website
2. **Check the order** is created in database with status `'pending'`
3. **Click "Pay with PesaPal"** - you'll be redirected to PesaPal
4. **Complete payment** on PesaPal (use test card if in sandbox mode)
5. **Check redirect URL** - should be:
   ```
   https://seltech.online/order-success?order_id=550e8400-e29b-41d4-a716-446655440000
   ```
6. **Verify order status** updated to `'paid'` in database
7. **Check webhook** was received at `/pesapal/ipn`

### Test Cards (Sandbox Mode):
- **Visa**: `4111111111111111`
- **Mastercard**: `5500000000000004`
- **CVV**: Any 3 digits
- **Expiry**: Any future date

---

## 🔍 Troubleshooting

### Issue: Redirect URL doesn't include order_id

**Solution**: Make sure you configured the callback URL in PesaPal dashboard with `{OrderMerchantReference}`:
```
https://seltech.online/order-success?order_id={OrderMerchantReference}
```

### Issue: Order not found after redirect

**Possible causes**:
1. Order ID format mismatch
2. Database lookup using wrong field
3. Order wasn't created before redirect

**Solution**: Check browser console and network tab for the actual redirect URL

### Issue: Webhook not received

**Possible causes**:
1. IPN URL not configured in PesaPal dashboard
2. Webhook endpoint not accessible
3. SSL certificate issues

**Solution**: 
- Verify IPN URL in PesaPal dashboard
- Test webhook endpoint manually
- Check server logs

---

## 📊 Complete URL Flow

```
1. User clicks "Buy Now"
   ↓
2. Order created in database
   Order ID: 550e8400-e29b-41d4-a716-446655440000
   Status: pending
   ↓
3. User redirected to PesaPal
   https://pay.pesapal.com/v3/payment?tracking_id=ABC123
   ↓
4. User completes payment on PesaPal
   ↓
5. PesaPal redirects back using YOUR configured callback URL
   https://seltech.online/order-success?order_id=550e8400-e29b-41d4-a716-446655440000
   ↓
6. Your page extracts order_id from URL
   const orderId = searchParams.get('order_id');
   ↓
7. Fetch order details from database
   SELECT * FROM orders WHERE id = '550e8400...'
   ↓
8. Show download page with correct product
   ✅ User gets their product
   ✅ Seller gets 90% earnings
   ✅ Platform gets 10% fee
```

---

## ✅ Final Checklist

Before going live, verify:

- [ ] PesaPal API credentials configured
- [ ] Callback URL configured in PesaPal dashboard: `https://seltech.online/order-success?order_id={OrderMerchantReference}`
- [ ] IPN URL configured: `https://www.seltech.online/pesapal/ipn`
- [ ] Cancel URL configured: `https://seltech.online/marketplace`
- [ ] Currency set to UGX
- [ ] Payment methods enabled (MTN, Airtel, Cards)
- [ ] Test purchase completed successfully
- [ ] Order status updates from pending → paid
- [ ] Webhook received and processed
- [ ] Download page shows correct product
- [ ] Seller earnings calculated correctly (90%)
- [ ] Platform fee calculated correctly (10%)

---

## 🎯 Quick Setup Summary

**In PesaPal Dashboard, configure:**

1. **Callback URL**: 
   ```
   https://seltech.online/order-success?order_id={OrderMerchantReference}
   ```

2. **IPN URL**: 
   ```
   https://www.seltech.online/pesapal/ipn
   ```

3. **Cancel URL**: 
   ```
   https://seltech.online/marketplace
   ```

That's it! Your code already handles the rest. 🚀