# PesaPal Store URL Format - Complete Guide

## 🎯 The Correct URL Format

When a customer clicks "Buy Now" on your product, they will be redirected to:

```
https://store.pesapal.com/seltech?amount=37000&desc=Food%20mart&reference=ORDER_ID&return_url=https%3A%2F%2Fwww.seltech.online%2Forder-success%3Forder_id%3DORDER_ID
```

### Breaking Down the URL:

| Parameter | Value | Description |
|-----------|-------|-------------|
| **Base URL** | `https://store.pesapal.com/seltech` | Your PesaPal store page |
| **amount** | `37000` | Amount in UGX (no decimals) |
| **desc** | `Food%20mart` | Product title (URL encoded) |
| **reference** | `ORDER_ID` | Your order ID (UUID) |
| **return_url** | `https://www.seltech.online/order-success?order_id=ORDER_ID` | Where to redirect after payment (URL encoded) |

---

## 📝 Real Example

### Product: Food Mart (UGX 37,000)

**Step 1: Customer clicks "Buy Now"**
- Order created in database with ID: `e17e63e4-7bc1-413c-b2ed-9834ed5ac495`

**Step 2: Redirect to PesaPal**
```
https://store.pesapal.com/seltech?amount=37000&desc=Food%20mart&reference=e17e63e4-7bc1-413c-b2ed-9834ed5ac495&return_url=https%3A%2F%2Fwww.seltech.online%2Forder-success%3Forder_id%3De17e63e4-7bc1-413c-b2ed-9834ed5ac495
```

**Step 3: Customer pays on PesaPal**
- Customer completes payment using MTN, Airtel, Visa, or Bank Transfer

**Step 4: PesaPal redirects back**
```
https://www.seltech.online/order-success?order_id=e17e63e4-7bc1-413c-b2ed-9834ed5ac495
```

**Step 5: Download page loads**
- System extracts `order_id` from URL
- Looks up order in database
- Displays correct product (Food Mart)
- Shows download link

---

## 🔄 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Customer on Product Page                                 │
│    https://seltech.online/product/food-mart                 │
│    Price: UGX 37,000                                        │
└────────────────┬────────────────────────────────────────────┘
                 │ Clicks "Buy Now"
                 ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Order Created in Database                                │
│    ┌──────────────────────────────────────────────────┐   │
│    │ Order ID: e17e63e4-7bc1-413c-b2ed-9834ed5ac495   │   │
│    │ Product: Food Mart                                │   │
│    │ Price: 10 USD (37,000 UGX)                       │   │
│    │ Status: pending                                   │   │
│    │ Seller ID: seller-xyz                            │   │
│    │ Buyer ID: buyer-789                              │   │
│    └──────────────────────────────────────────────────┘   │
└────────────────┬────────────────────────────────────────────┘
                 │ Redirect to PesaPal
                 ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. PesaPal Payment Page                                     │
│    https://store.pesapal.com/seltech?                      │
│      amount=37000&                                          │
│      desc=Food%20mart&                                      │
│      reference=e17e63e4-7bc1-413c-b2ed-9834ed5ac495&       │
│      return_url=https://www.seltech.online/order-success?  │
│                order_id=e17e63e4-7bc1-413c-b2ed-9834ed5... │
└────────────────┬────────────────────────────────────────────┘
                 │ Customer pays
                 ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. PesaPal Redirects Back                                   │
│    https://www.seltech.online/order-success?               │
│      order_id=e17e63e4-7bc1-413c-b2ed-9834ed5ac495         │
└────────────────┬────────────────────────────────────────────┘
                 │ Extract order_id
                 ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. System Looks Up Order                                    │
│    SELECT * FROM orders                                     │
│    WHERE id = 'e17e63e4-7bc1-413c-b2ed-9834ed5ac495'       │
│                                                              │
│    Returns:                                                  │
│    - Product: Food Mart                                     │
│    - File URL: download link                                │
│    - Seller: seller info                                    │
│    - Price: UGX 37,000                                      │
└────────────────┬────────────────────────────────────────────┘
                 │ Display download page
                 ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. Download Page                                            │
│    ✅ Product: Food Mart                                    │
│    ✅ Download button available                             │
│    ✅ Seller gets 90% (UGX 33,300)                         │
│    ✅ Platform gets 10% (UGX 3,700)                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔑 Key Points

### 1. Order ID is the Key
- Order is created **before** redirect to PesaPal
- Order ID is included in the `reference` parameter
- Order ID is also in the `return_url` parameter
- After payment, order ID is in the redirect URL
- System uses order ID to find the correct product

### 2. URL Parameters Explained

#### Going TO PesaPal:
```
https://store.pesapal.com/seltech?
  amount=37000                                    ← Amount in UGX
  &desc=Food%20mart                              ← Product title
  &reference=e17e63e4-7bc1-413c-b2ed-9834ed5ac495  ← Order ID
  &return_url=https://www.seltech.online/order-success?order_id=e17e63e4...  ← Where to return
```

#### Coming BACK from PesaPal:
```
https://www.seltech.online/order-success?
  order_id=e17e63e4-7bc1-413c-b2ed-9834ed5ac495  ← Order ID preserved
```

### 3. Multiple Parameter Support

Your OrderSuccess page now handles ALL these formats:
- `?order_id=...` ← Standard format
- `?order=...` ← Alternative format
- `?product=...` ← Product ID (fallback)
- `?reference=...` ← PesaPal reference
- `?OrderMerchantReference=...` ← PesaPal API format
- `?OrderTrackingId=...` ← PesaPal tracking ID

---

## 💻 Code Implementation

### ProductDetail.tsx (Buy Button)

```typescript
const handleBuyNow = async () => {
  // 1. Create order in database
  const { data: order } = await supabase
    .from('orders')
    .insert({
      buyer_id: profile.id,
      seller_id: product.seller_id,
      product_id: product.id,
      price: product.price,
      status: 'pending'
    })
    .select()
    .single();

  // 2. Build PesaPal URL
  const ugxAmount = Math.round(product.price * 3700);
  const returnUrl = encodeURIComponent(
    `${window.location.origin}/order-success?order_id=${order.id}`
  );
  
  // 3. Redirect to PesaPal
  window.location.href = 
    `https://store.pesapal.com/seltech?` +
    `amount=${ugxAmount}&` +
    `desc=${encodeURIComponent(product.title)}&` +
    `reference=${order.id}&` +
    `return_url=${returnUrl}`;
};
```

### OrderSuccess.tsx (Download Page)

```typescript
// 1. Extract order ID from URL
const orderId = searchParams.get('order_id') || 
                searchParams.get('reference') ||
                searchParams.get('product');

// 2. Look up order in database
const { data: order } = await supabase
  .from('orders')
  .select(`
    *,
    product:products(title, file_url, price),
    seller:profiles!seller_id(full_name, mobile_money_number)
  `)
  .eq('id', orderId)
  .single();

// 3. Display download page with correct product
```

---

## 🧪 Testing Examples

### Example 1: Food Mart (UGX 37,000)

**PesaPal URL:**
```
https://store.pesapal.com/seltech?amount=37000&desc=Food%20mart&reference=e17e63e4-7bc1-413c-b2ed-9834ed5ac495&return_url=https%3A%2F%2Fwww.seltech.online%2Forder-success%3Forder_id%3De17e63e4-7bc1-413c-b2ed-9834ed5ac495
```

**Return URL (after payment):**
```
https://www.seltech.online/order-success?order_id=e17e63e4-7bc1-413c-b2ed-9834ed5ac495
```

### Example 2: Telegram Bot (UGX 74,000)

**PesaPal URL:**
```
https://store.pesapal.com/seltech?amount=74000&desc=Telegram%20Bot%20Template&reference=f28f74f5-8cd2-524d-c3fe-557766551506&return_url=https%3A%2F%2Fwww.seltech.online%2Forder-success%3Forder_id%3Df28f74f5-8cd2-524d-c3fe-557766551506
```

**Return URL (after payment):**
```
https://www.seltech.online/order-success?order_id=f28f74f5-8cd2-524d-c3fe-557766551506
```

---

## ✅ What Happens at Each Step

### Step 1: Order Creation
```sql
INSERT INTO orders (
  id,
  buyer_id,
  seller_id,
  product_id,
  price,
  status
) VALUES (
  'e17e63e4-7bc1-413c-b2ed-9834ed5ac495',
  'buyer-id',
  'seller-id',
  'product-id',
  10.00,
  'pending'
);
```

### Step 2: Redirect to PesaPal
Browser navigates to PesaPal store with order details

### Step 3: Payment on PesaPal
Customer chooses payment method and completes payment

### Step 4: Redirect Back
PesaPal redirects to your return_url with order_id

### Step 5: Order Lookup
```sql
SELECT 
  orders.*,
  products.title,
  products.file_url,
  profiles.full_name as seller_name
FROM orders
JOIN products ON orders.product_id = products.id
JOIN profiles ON orders.seller_id = profiles.id
WHERE orders.id = 'e17e63e4-7bc1-413c-b2ed-9834ed5ac495';
```

### Step 6: Display Download
Show product details and download button

---

## 🎯 Summary

**The URL that takes customers to payment:**
```
https://store.pesapal.com/seltech?
  amount=37000&
  desc=Food%20mart&
  reference=ORDER_ID&
  return_url=https://www.seltech.online/order-success?order_id=ORDER_ID
```

**The URL that brings them back:**
```
https://www.seltech.online/order-success?order_id=ORDER_ID
```

**How the system knows which product:**
1. Order ID is in the URL
2. System looks up order by ID
3. Order contains product_id
4. System fetches product details
5. Download page shows correct product

**That's it!** The order ID connects everything together. 🚀