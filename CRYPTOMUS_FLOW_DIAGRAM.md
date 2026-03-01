# 🔄 Cryptomus Payment Flow - Complete Diagram

## 📊 Visual Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CRYPTOMUS PAYMENT FLOW                       │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────┐
│   1. USER    │  User clicks "Buy Now" button
│  CLICKS BUY  │  on product page
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────────────┐
│  2. CREATE ORDER IN DATABASE (PENDING)                               │
│  ─────────────────────────────────────────────────────────────────   │
│  • Generate unique order_id                                          │
│  • Set status = 'pending'                                            │
│  • Set payment_status = 'pending'                                    │
│  • Store buyer_id, seller_id, product_id, amount                    │
│  • Generate order_number (ORD-timestamp-random)                      │
│                                                                       │
│  Database Record:                                                    │
│  {                                                                   │
│    id: "uuid-123",                                                   │
│    order_number: "ORD-1234567890-abc123",                           │
│    status: "pending",                                                │
│    payment_status: "pending",                                        │
│    amount: 10.00,                                                    │
│    buyer_id: "user-uuid",                                            │
│    seller_id: "seller-uuid",                                         │
│    product_id: "product-uuid"                                        │
│  }                                                                   │
└──────────────────────┬───────────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────────┐
│  3. LOAD CRYPTOMUS WIDGET / REDIRECT TO PAYMENT PAGE                 │
│  ─────────────────────────────────────────────────────────────────   │
│  • Call create-cryptomus-payment edge function                       │
│  • Pass: amount, currency, order_id                                  │
│  • Cryptomus API creates payment invoice                             │
│  • Returns payment_url                                               │
│  • Redirect user to: https://pay.cryptomus.com/pay/[payment-id]     │
│                                                                       │
│  OR embed widget:                                                    │
│  <iframe src="https://pay.cryptomus.com/widget/[merchant-uuid]">    │
└──────────────────────┬───────────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────────┐
│  USER COMPLETES CRYPTO PAYMENT                                       │
│  ─────────────────────────────────────────────────────────────────   │
│  • User selects cryptocurrency (BTC, ETH, USDT, etc.)                │
│  • User sends payment from their wallet                              │
│  • Blockchain confirms transaction (5-15 minutes)                    │
└──────────────────────┬───────────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────────┐
│  4. CRYPTOMUS SENDS WEBHOOK TO YOUR SERVER                           │
│  ─────────────────────────────────────────────────────────────────   │
│  POST https://[project].supabase.co/functions/v1/cryptomus-webhook  │
│                                                                       │
│  Webhook Payload:                                                    │
│  {                                                                   │
│    order_id: "uuid-123",                                             │
│    status: "paid",                                                   │
│    payment_amount: "10.00",                                          │
│    currency: "USD",                                                  │
│    uuid: "cryptomus-payment-uuid",                                   │
│    sign: "signature-hash"                                            │
│  }                                                                   │
└──────────────────────┬───────────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────────┐
│  5. VERIFY SIGNATURE & UPDATE ORDER STATUS TO PAID                   │
│  ─────────────────────────────────────────────────────────────────   │
│  Backend (cryptomus-webhook function):                               │
│  • Verify webhook signature (security)                               │
│  • Find order by order_id                                            │
│  • Check status === 'paid'                                           │
│  • Update database:                                                  │
│    - status = 'paid'                                                 │
│    - payment_status = 'completed'                                    │
│    - cryptomus_payment_id = uuid                                     │
│    - paid_at = NOW()                                                 │
│    - download_url = product.file_url                                 │
│    - download_expires_at = NOW() + 30 days                           │
│  • Create payout record (90% seller, 10% platform)                   │
│  • Increment product download_count                                  │
│                                                                       │
│  Updated Database Record:                                            │
│  {                                                                   │
│    id: "uuid-123",                                                   │
│    status: "paid",                    ← UPDATED                      │
│    payment_status: "completed",       ← UPDATED                      │
│    cryptomus_payment_id: "crypto-uuid", ← UPDATED                    │
│    paid_at: "2024-01-15T10:30:00Z",  ← UPDATED                      │
│    download_url: "https://...",       ← UPDATED                      │
│    download_expires_at: "2024-02-14"  ← UPDATED                      │
│  }                                                                   │
└──────────────────────┬───────────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────────┐
│  6. USER REDIRECTED BACK TO SUCCESS PAGE                             │
│  ─────────────────────────────────────────────────────────────────   │
│  URL: https://seltech.online/order-success?order_id=uuid-123         │
│                                                                       │
│  User sees:                                                          │
│  • "Payment Processing..." (if webhook not yet received)             │
│  • Page polls backend every 5 seconds                                │
└──────────────────────┬───────────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────────┐
│  7. SUCCESS PAGE CHECKS DATABASE TO CONFIRM PAYMENT                  │
│  ─────────────────────────────────────────────────────────────────   │
│  Frontend (OrderSuccess.tsx):                                        │
│  • Query database every 5 seconds:                                   │
│    SELECT status, payment_status, download_url                       │
│    FROM orders                                                       │
│    WHERE id = 'uuid-123'                                             │
│                                                                       │
│  • If status === 'paid':                                             │
│    → Stop polling                                                    │
│    → Show success message                                            │
│    → Unlock download button                                          │
│                                                                       │
│  • If status === 'pending':                                          │
│    → Continue polling                                                │
│    → Show "Waiting for confirmation..."                              │
│                                                                       │
│  • If status === 'failed':                                           │
│    → Show error message                                              │
│    → Offer to retry                                                  │
└──────────────────────┬───────────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────────┐
│  8. UNLOCK & SECURELY DELIVER DOWNLOADABLE PRODUCT                   │
│  ─────────────────────────────────────────────────────────────────   │
│  Security Checks:                                                    │
│  ✅ Order status is 'paid' (verified from database)                  │
│  ✅ User is logged in                                                │
│  ✅ User owns this order (buyer_id matches)                          │
│  ✅ Download link not expired                                        │
│  ✅ Product file exists                                              │
│                                                                       │
│  If all checks pass:                                                 │
│  • Show green "Download Ready" banner                                │
│  • Enable "Download Now" button                                      │
│  • User clicks → File downloads                                      │
│  • Track download in analytics                                       │
│                                                                       │
│  If user tries to access without payment:                            │
│  ❌ Database shows status = 'pending'                                │
│  ❌ Download button stays disabled                                   │
│  ❌ No file access granted                                           │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Security Features

### 1. Order Verification
```typescript
// User cannot bypass payment by just visiting success page
// System checks database, not URL parameters

if (order.status !== 'paid') {
  // Download button disabled
  // Show "Payment pending" message
}
```

### 2. Webhook Signature Verification
```typescript
// Verify webhook is actually from Cryptomus
const signature = generateSignature(payload, apiKey);
if (signature !== webhookSignature) {
  throw new Error('Invalid webhook signature');
}
```

### 3. Order Ownership
```typescript
// User can only download their own orders
if (order.buyer_id !== user.id) {
  throw new Error('Unauthorized access');
}
```

### 4. Download Expiration
```typescript
// Links expire after 30 days
if (order.download_expires_at < new Date()) {
  throw new Error('Download link expired');
}
```

---

## 📝 Implementation Files

### Frontend
- **InstantPaymentWidget.tsx** - Steps 1-3 (Create order, redirect)
- **OrderSuccess.tsx** - Steps 6-8 (Check database, unlock download)
- **ProductDetail.tsx** - Buy button trigger

### Backend
- **create-cryptomus-payment/index.ts** - Step 3 (Create payment invoice)
- **cryptomus-webhook/index.ts** - Steps 4-5 (Receive webhook, update order)

### Database
- **orders table** - Stores order status
- **payouts table** - Records seller earnings (90/10 split)

---

## ⚡ Key Points

1. **Order created FIRST** - Before any payment processing
2. **Status is 'pending'** - Until webhook confirms payment
3. **Webhook updates database** - Not the frontend
4. **Success page polls database** - Checks backend, not Cryptomus
5. **Download only if paid** - Database verification required
6. **No bypass possible** - User cannot fake payment status

---

## 🎯 This Ensures

✅ **File only accessible after verified payment**
✅ **Not just because user returned to page**
✅ **Webhook signature verified for security**
✅ **Database is single source of truth**
✅ **No race conditions**
✅ **No payment bypass exploits**

---

## 🔄 Timeline Example

```
00:00 - User clicks "Buy Now"
00:01 - Order created (status: pending)
00:02 - Redirected to Cryptomus
00:03 - User sends crypto payment
00:05 - Blockchain confirms (varies)
00:06 - Cryptomus sends webhook
00:07 - Backend updates order (status: paid)
00:08 - User returns to success page
00:09 - Page polls database
00:10 - Detects status = 'paid'
00:11 - Download unlocked! ✅
```

---

## 🚨 What Happens If...

### User closes browser during payment?
- Order stays in database as 'pending'
- Webhook still updates it when payment confirms
- User can return to success page anytime
- Download will be available once paid

### Webhook arrives before user returns?
- Order already marked 'paid' in database
- When user returns, first poll detects it
- Download unlocks immediately

### User tries to access success page without paying?
- Database shows status = 'pending'
- Download button stays disabled
- Page shows "Payment pending"

### User tries to guess order_id?
- System checks buyer_id matches user.id
- Access denied if not their order

---

This is exactly the secure flow you described, and it's fully implemented! 🎉
