# Cryptomus Configuration - Complete Setup

## ✅ Good News!

The URLs are **already configured in the code** and will be automatically used with every payment. You don't need to manually configure anything in the Cryptomus dashboard!

## How It Works

Every time a user buys a product, the payment system automatically sends these URLs to Cryptomus:

```javascript
// From: src/components/payment/InstantPaymentWidget.tsx

const invoiceData = {
  amount: product.price.toString(),
  currency: 'USD',
  order_id: order.id,
  url_return: 'https://seltech.online/order-success?order_id={ORDER_ID}',
  url_success: 'https://seltech.online/order-success?order_id={ORDER_ID}',
  url_callback: 'https://seltech.online/api/webhooks/cryptomus',
  lifetime: 3600
};
```

## URLs Being Used

1. **Success URL**: `https://seltech.online/order-success?order_id={order_id}`
   - Where users go after payment
   - Shows their specific order and download link

2. **Webhook URL**: `https://seltech.online/api/webhooks/cryptomus`
   - Receives payment notifications
   - Triggers automatic 90/10 split payouts

3. **Webhook Secret**: `seltech_webhook_secret_2024`
   - Verifies webhook authenticity

## Test the Configuration (Optional)

If you want to verify everything is working, run:

```bash
node scripts/setup-cryptomus.js
```

This will:
- ✅ Test your webhook endpoint
- ✅ Create a test payment with the configured URLs
- ✅ Verify the URLs are being sent correctly

## What Happens When a User Buys

1. **User clicks "Buy Now"**
   - Order created in database
   - 90/10 split calculated

2. **Payment invoice created**
   - Cryptomus API called with URLs
   - User redirected to Cryptomus payment page

3. **User pays with crypto**
   - Blockchain confirms transaction
   - Cryptomus sends webhook to your server

4. **Webhook received**
   - Order marked as "paid"
   - 90% sent to seller's wallet
   - 10% kept by platform

5. **User redirected**
   - Goes to: `https://seltech.online/order-success?order_id=abc-123`
   - Sees their order and download link

## Verify It's Working

### Check Payment Creation:
```bash
# Look in browser console when user clicks "Buy Now"
🚀 Starting Cryptomus payment creation...
✅ Order created: abc-123
📋 Creating Cryptomus invoice
🔗 Payment URLs:
   success: https://seltech.online/order-success?order_id=abc-123
   callback: https://seltech.online/api/webhooks/cryptomus
✅ Cryptomus payment created successfully
```

### Check Webhook:
```bash
# In your server logs
📨 Received Cryptomus webhook
📊 Order abc-123 status: pending → paid
💰 Processing seller payout...
✅ Payout initiated for seller: $27.00 USDT
```

### Check User Experience:
```bash
# User is redirected to:
https://seltech.online/order-success?order_id=abc-123

# Page shows:
✅ Payment Confirmed!
📦 Product: Amazing Bot
💰 Amount: $29.99
📥 Download Link: [Download Now]
```

## Manual Configuration (Not Needed)

If for some reason you want to configure these URLs manually in the Cryptomus dashboard:

1. Go to https://cryptomus.com/
2. Login to your merchant account
3. Navigate to **Settings** → **API Settings**
4. Set:
   - Success URL: `https://seltech.online/order-success?order_id={order_id}`
   - Webhook URL: `https://seltech.online/api/webhooks/cryptomus`
   - Webhook Secret: `seltech_webhook_secret_2024`

But again, **this is not necessary** because the URLs are sent with every payment API call.

## Troubleshooting

### If payments aren't working:

1. **Check API keys in .env**:
   ```env
   VITE_CRYPTOMUS_MERCHANT_UUID=6e6c1018-48f4-49fd-a10d-36d6cd70eefe
   VITE_CRYPTOMUS_PAYMENT_API_KEY=DSk5vMk3RIBhiQ3qGUw1pH1iYJI1hSSN8iTYmHpm3WpyTj9bsTtIlhadpiFKlK5aVUmpjHH8YoLV9dQsxLAPzpQOdiffl2hzJo0378ExFJB3HMSx49LjTfvnm9qHztoP
   ```

2. **Check webhook is accessible**:
   ```bash
   curl https://seltech.online/api/webhooks/cryptomus
   ```

3. **Check Cryptomus dashboard logs**:
   - Go to Cryptomus dashboard
   - Check webhook delivery logs
   - Look for 200 OK responses

4. **Check database**:
   ```sql
   SELECT * FROM orders ORDER BY created_at DESC LIMIT 5;
   SELECT * FROM payouts ORDER BY created_at DESC LIMIT 5;
   ```

## Summary

✅ URLs are configured in the code
✅ Sent automatically with every payment
✅ No manual dashboard configuration needed
✅ 90/10 split happens automatically
✅ Sellers receive payouts to their crypto wallets

**You're all set!** Just test a purchase to verify everything works.
