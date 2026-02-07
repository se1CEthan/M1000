# PesaPal Payment Redirect Flow - How Product Tracking Works

## The Question
**"When a buyer clicks buy, they're taken to an external PesaPal URL, then redirected back to the website after payment. How does the URL know which product they bought?"**

## The Answer: Order ID Tracking System

The system uses a **multi-step tracking mechanism** to ensure the correct product is associated with each payment:

---

## Step-by-Step Flow

### 1. **User Clicks "Buy Now" on Product Page**
```
Location: Product Detail Page
Action: User clicks "Buy Now" button
```

When the user clicks buy, the system:
- Captures the **product ID**
- Captures the **seller ID** (from the product)
- Captures the **buyer ID** (logged-in user)
- Captures the **price** and **product title**

### 2. **Order Created in Database BEFORE Redirect**
```typescript
// From: src/lib/pesapal-payment.ts - createPesaPalPayment()

// Create order in database FIRST
const { data: order, error: orderError } = await supabase
  .from('orders')
  .insert({
    product_id: request.productId,      // ✅ Product tracked here
    seller_id: request.sellerId,        // ✅ Seller tracked here
    buyer_id: request.buyerId,          // ✅ Buyer tracked here
    price: revenueSplit.totalAmount,
    platform_fee: revenueSplit.platformFee,
    seller_earnings: revenueSplit.sellerEarnings,
    status: 'pending',                  // ✅ Status: pending
    payment_method: 'pesapal',
    currency: 'UGX'
  })
  .select()
  .single();
```

**Key Point**: The order is created with status `'pending'` BEFORE the user is redirected to PesaPal. This order has a unique `order.id`.

### 3. **Order ID Embedded in PesaPal Callback URL**
```typescript
// Prepare PesaPal payment data with callback URL
const paymentData = {
  id: order.id,                         // ✅ Order ID sent to PesaPal
  currency: 'UGX',
  amount: revenueSplit.totalAmount,
  description: `Purchase: ${request.productTitle}`,
  callback_url: `${SUCCESS_URL}?order_id=${order.id}`,  // ✅ Order ID in callback
  notification_id: 'https://www.seltech.online/pesapal/ipn',
  billing_address: {
    email_address: request.buyerEmail || '',
    phone_number: request.buyerPhone || ''
  }
};
```

**Key Point**: The `callback_url` includes the `order_id` as a query parameter. When PesaPal redirects back, this order ID comes with it.

### 4. **User Redirected to PesaPal**
```
From: https://seltech.online/product/123
To: https://pay.pesapal.com/v3/payment?tracking_id=ABC123
```

The user completes payment on PesaPal's secure platform.

### 5. **PesaPal Redirects Back with Order ID**
```
From: https://pay.pesapal.com/v3/payment?tracking_id=ABC123
To: https://seltech.online/order-success?order_id=550e8400-e29b-41d4-a716-446655440000
                                                    ↑
                                        This is the order ID we created!
```

**Key Point**: The `order_id` in the URL tells us exactly which order (and therefore which product) was purchased.

### 6. **Order Success Page Fetches Order Details**
```typescript
// From: Order Success Page
const orderId = searchParams.get('order_id');  // ✅ Get order ID from URL

// Fetch complete order details
const { data: order } = await supabase
  .from('orders')
  .select(`
    *,
    products (title, price, description, file_url),  // ✅ Product info
    profiles!orders_seller_id_fkey (username, full_name)  // ✅ Seller info
  `)
  .eq('id', orderId)
  .single();
```

**Key Point**: Using the `order_id` from the URL, we fetch the complete order details including:
- Product information (title, price, download link)
- Seller information
- Payment status
- Everything needed for the download page

### 7. **Webhook Confirms Payment (Background)**
```typescript
// PesaPal sends webhook to: https://www.seltech.online/pesapal/ipn
// Webhook contains: tracking_id, payment_status, order_id

// Update order status
await supabase
  .from('orders')
  .update({
    status: 'paid',                    // ✅ Status updated to 'paid'
    completed_at: new Date().toISOString(),
    payment_id: trackingId
  })
  .eq('id', orderId);
```

**Key Point**: The webhook confirms payment and updates the order status from `'pending'` to `'paid'`.

---

## Visual Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User on Product Page                                         │
│    Product ID: abc-123                                          │
│    Price: UGX 37,000                                            │
└────────────────────┬────────────────────────────────────────────┘
                     │ Clicks "Buy Now"
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. Create Order in Database                                     │
│    ┌──────────────────────────────────────────────────────┐   │
│    │ Order ID: 550e8400-e29b-41d4-a716-446655440000       │   │
│    │ Product ID: abc-123                                   │   │
│    │ Seller ID: seller-xyz                                 │   │
│    │ Buyer ID: buyer-789                                   │   │
│    │ Status: pending                                       │   │
│    │ Price: 10 USD (37,000 UGX)                           │   │
│    └──────────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────────────┘
                     │ Order created successfully
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. Redirect to PesaPal with Callback URL                        │
│    https://pay.pesapal.com/v3/payment?tracking_id=ABC123       │
│                                                                  │
│    Callback URL includes order ID:                              │
│    https://seltech.online/order-success?order_id=550e8400...   │
└────────────────────┬────────────────────────────────────────────┘
                     │ User completes payment
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. PesaPal Redirects Back                                       │
│    https://seltech.online/order-success?order_id=550e8400...   │
│                                                    ↑             │
│                                    Order ID preserved in URL!   │
└────────────────────┬────────────────────────────────────────────┘
                     │ Extract order_id from URL
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. Fetch Order Details from Database                            │
│    SELECT * FROM orders WHERE id = '550e8400...'                │
│                                                                  │
│    Returns:                                                      │
│    - Product info (title, file_url, price)                     │
│    - Seller info (name, email, mobile_money_number)            │
│    - Payment status                                             │
└────────────────────┬────────────────────────────────────────────┘
                     │ Display download page
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. User Can Download Product                                    │
│    ✅ Correct product                                           │
│    ✅ Correct seller gets 90%                                   │
│    ✅ Platform gets 10%                                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Database Tables

### Orders Table
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY,                    -- ✅ Unique order ID
  product_id UUID REFERENCES products,    -- ✅ Links to product
  seller_id UUID REFERENCES profiles,     -- ✅ Links to seller
  buyer_id UUID REFERENCES profiles,      -- ✅ Links to buyer
  order_number TEXT UNIQUE,               -- Human-readable order number
  status TEXT,                            -- pending → paid → completed
  price DECIMAL,                          -- Total price
  platform_fee DECIMAL,                   -- 10% platform fee
  seller_earnings DECIMAL,                -- 90% seller earnings
  payment_id TEXT,                        -- PesaPal tracking ID
  payment_method TEXT,                    -- 'pesapal'
  currency TEXT,                          -- 'UGX'
  created_at TIMESTAMP,
  completed_at TIMESTAMP
);
```

---

## Security & Reliability

### 1. **Order Created Before Payment**
- Order exists in database before redirect
- If user abandons payment, order stays as `'pending'`
- No data loss

### 2. **Order ID is Immutable**
- UUID format: `550e8400-e29b-41d4-a716-446655440000`
- Cannot be guessed or manipulated
- Unique per transaction

### 3. **Webhook Verification**
- PesaPal sends webhook to confirm payment
- Updates order status independently of user redirect
- Prevents fraud (user can't fake payment by manipulating URL)

### 4. **Status Tracking**
```
pending → paid → completed
   ↓        ↓        ↓
Created  Payment  Download
         Confirmed Available
```

---

## Example URLs

### Product Page
```
https://seltech.online/product/telegram-bot-template
```

### Payment Page (with order_id)
```
https://seltech.online/pesapal-payment?order_id=550e8400-e29b-41d4-a716-446655440000&product=Telegram%20Bot&amount=37000
```

### PesaPal External URL
```
https://pay.pesapal.com/v3/payment?tracking_id=ABC123&merchant_reference=550e8400-e29b-41d4-a716-446655440000
```

### Success/Download Page (after redirect)
```
https://seltech.online/order-success?order_id=550e8400-e29b-41d4-a716-446655440000
                                                ↑
                                    This tells us which product!
```

---

## What Happens If...

### User Closes Browser During Payment?
- Order exists in database with status `'pending'`
- User can resume payment later using order ID
- No data loss

### User Manipulates the order_id in URL?
- Database lookup will fail (invalid UUID)
- Or will show a different order (but only if they own it - RLS policies)
- Webhook still updates correct order

### Payment Fails?
- Order status remains `'pending'` or changes to `'failed'`
- User can retry payment
- Seller doesn't get paid

### Webhook Doesn't Arrive?
- Order status can be checked manually via PesaPal API
- Admin can verify payment and update status
- Backup verification system

---

## Summary

**The order ID is the key!**

1. ✅ Order created in database BEFORE redirect (with product_id, seller_id, buyer_id)
2. ✅ Order ID embedded in PesaPal callback URL
3. ✅ PesaPal redirects back with order ID in URL
4. ✅ System fetches order details using order ID
5. ✅ User gets correct product, seller gets correct payment

**The product is tracked through the order record, not through the URL alone.**

The URL just carries the order ID, which is the reference to look up all the details (product, seller, buyer, price) from the database.