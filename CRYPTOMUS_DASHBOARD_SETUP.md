# Cryptomus Dashboard Setup - Quick Guide

## URLs to Configure in Cryptomus Dashboard

### 1. Success URL (Return URL)
```
https://seltech.online/order-success?order_id={order_id}
```
**What it does**: Redirects users back to your site after payment with their specific order ID

### 2. Webhook URL (Callback URL)
```
https://seltech.online/api/webhooks/cryptomus
```
**What it does**: Receives payment notifications to trigger automatic 90/10 split payouts

### 3. Webhook Secret
```
seltech_webhook_secret_2024
```
**What it does**: Verifies webhook authenticity

## API Credentials (Already in .env)

```env
VITE_CRYPTOMUS_MERCHANT_UUID=6e6c1018-48f4-49fd-a10d-36d6cd70eefe
VITE_CRYPTOMUS_PAYMENT_API_KEY=DSk5vMk3RIBhiQ3qGUw1pH1iYJI1hSSN8iTYmHpm3WpyTj9bsTtIlhadpiFKlK5aVUmpjHH8YoLV9dQsxLAPzpQOdiffl2hzJo0378ExFJB3HMSx49LjTfvnm9qHztoP
VITE_CRYPTOMUS_PAYOUT_API_KEY=2nuhleS45ns1WTJDX1ZoRG8UAmDFDdahvMafGhU5knS5P3Ozn1Yx0tgRYCmjJpKvtNx0GVQ0FTLo0SNVw1ZM7Zy97fXSsbHX8SGbgGepEHCqwtxw3gIJ8LKDIMDJ3W4s
VITE_CRYPTOMUS_WEBHOOK_SECRET=seltech_webhook_secret_2024
```

## How It Works

1. **User buys product** → Order created with 90/10 split calculated
2. **Cryptomus invoice created** → User redirected to Cryptomus payment page
3. **User pays with crypto** → Blockchain confirms transaction
4. **Cryptomus sends webhook** → Your server receives notification
5. **Order marked as paid** → User redirected to success page
6. **Automatic payout** → 90% sent to seller's crypto wallet
7. **Platform keeps 10%** → Automatic fee collection

## Success URL Explained

When a user completes payment, they are redirected to:
```
https://seltech.online/order-success?order_id=abc-123-xyz
```

This page shows:
- ✅ Product they purchased
- ✅ Payment confirmation
- ✅ Download link for the product
- ✅ Order details (amount, date, etc.)

The `order_id` parameter ensures each user sees their specific purchase.

## Webhook Flow

```
Payment Confirmed
    ↓
Webhook: https://seltech.online/api/webhooks/cryptomus
    ↓
Verify signature with webhook secret
    ↓
Update order status to "paid"
    ↓
Check seller's wallet address
    ↓
Create payout: 90% to seller
    ↓
Platform keeps: 10% automatically
    ↓
Send notifications to buyer & seller
```

## Seller Wallet Setup

Sellers must configure their crypto wallet address in:
**Seller Dashboard → Payment Methods → Add Crypto Wallet**

Required:
- Currency (USDT, BTC, ETH, etc.)
- Network (TRC20, ERC20, etc.)
- Wallet Address

Example:
```
Currency: USDT
Network: TRC20
Address: TXYZabc123...
```

## Testing

1. Buy a product on your site
2. Pay with crypto on Cryptomus
3. Check you're redirected to: `https://seltech.online/order-success?order_id=...`
4. Verify webhook received in Cryptomus dashboard
5. Check seller received 90% payout
6. Confirm platform kept 10%

## Configuration Steps

### In Cryptomus Dashboard:

1. **Log in** to https://cryptomus.com/
2. **Go to Settings** → API Settings
3. **Set Success URL**: `https://seltech.online/order-success?order_id={order_id}`
4. **Set Webhook URL**: `https://seltech.online/api/webhooks/cryptomus`
5. **Set Webhook Secret**: `seltech_webhook_secret_2024`
6. **Enable webhook events**:
   - Payment status changed
   - Payment completed
   - Payment failed
7. **Save settings**

That's it! Your payment system is ready. 🚀
