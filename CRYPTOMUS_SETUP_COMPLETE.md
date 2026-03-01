# 🎉 Cryptomus Payment Integration - Complete Setup Guide

## ✅ Implementation Complete

Your marketplace now uses **Cryptomus** for cryptocurrency payments with the following flow:

### 📋 Payment Flow

```
1️⃣ User clicks "Buy Now" on product page
   ↓
2️⃣ System creates order in YOUR database (status: pending)
   ↓
3️⃣ System redirects user to Cryptomus payment page
   ↓
4️⃣ User pays with crypto (BTC, ETH, USDT, etc.)
   ↓
5️⃣ Cryptomus sends webhook to YOUR backend when payment confirmed
   ↓
6️⃣ Backend marks order as PAID and generates download URL
   ↓
7️⃣ User returns to success page
   ↓
8️⃣ Success page checks backend if order is paid
   ↓
9️⃣ THEN unlock download page (only if paid!)
```

---

## 🔧 Configuration Required

### 1. Environment Variables

Add these to your `.env` file:

```bash
# Cryptomus API Credentials
VITE_CRYPTOMUS_MERCHANT_UUID=6e6c1018-48f4-49fd-a10d-36d6cd70eefe
VITE_CRYPTOMUS_PAYMENT_API_KEY=DSk5vMk3RIBhiQ3qGUw1pH1iYJI1hSSN8iTYmHpm3WpyTj9bsTtIlhadpiFKlK5aVUmpjHH8YoLV9dQsxLAPzpQOdiffl2hzJo0378ExFJB3HMSx49LjTfvnm9qHztoP

# Supabase (for webhook)
SUPABASE_URL=your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 2. Deploy Edge Functions

Deploy the Cryptomus edge functions to Supabase:

```bash
# Deploy payment creation function
supabase functions deploy create-cryptomus-payment

# Deploy webhook handler
supabase functions deploy cryptomus-webhook
```

### 3. Configure Cryptomus Webhook

In your Cryptomus dashboard:

1. Go to **Settings** → **Webhooks**
2. Set webhook URL to:
   ```
   https://your-project.supabase.co/functions/v1/cryptomus-webhook
   ```
3. Enable webhook for payment status updates

---

## 📁 Files Modified

### Frontend Components

- ✅ `src/components/payment/InstantPaymentWidget.tsx` - Main payment widget
- ✅ `src/pages/ProductDetail.tsx` - Product page with buy button
- ✅ `src/pages/OrderSuccess.tsx` - Success page with download unlock

### Backend Functions

- ✅ `supabase/functions/create-cryptomus-payment/index.ts` - Creates payment invoice
- ✅ `supabase/functions/cryptomus-webhook/index.ts` - Handles payment confirmation

---

## 🧪 Testing the Flow

### Test Payment Flow:

1. **Login** to your marketplace
2. **Browse** to any product
3. **Click** "Buy Now - Pay with Crypto"
4. **System creates order** in database (check `orders` table)
5. **Redirects** to Cryptomus payment page
6. **Pay** with test crypto (or real crypto in production)
7. **Cryptomus sends webhook** to your backend
8. **Backend marks order as paid** (check `orders` table - status should be 'paid')
9. **User returns** to success page
10. **Success page polls backend** every 5 seconds
11. **Download unlocks** when order is confirmed paid

### Check Logs:

```bash
# Check edge function logs
supabase functions logs create-cryptomus-payment
supabase functions logs cryptomus-webhook

# Check browser console for frontend logs
# Look for: 🚀 🔔 ✅ ❌ emojis
```

---

## 🔐 Security Features

✅ **Order verification** - Only order owner can download
✅ **Webhook validation** - Cryptomus signature verification
✅ **Download expiration** - Links expire after 30 days
✅ **Status polling** - Frontend checks backend, not Cryptomus directly
✅ **No direct payment access** - Users can't bypass payment

---

## 💰 Revenue Split (90/10)

When payment is confirmed:

- **90%** goes to seller (recorded in `payouts` table)
- **10%** platform fee
- Automatic calculation in webhook handler

---

## 🐛 Troubleshooting

### Payment not confirming?

1. Check webhook is configured in Cryptomus dashboard
2. Check edge function logs: `supabase functions logs cryptomus-webhook`
3. Verify order exists in database with correct `id`
4. Check webhook URL is publicly accessible

### Download not unlocking?

1. Check order status in database: `SELECT * FROM orders WHERE id = 'order-id'`
2. Should have `status = 'paid'` and `download_url` populated
3. Check browser console for polling logs
4. Verify user is logged in and owns the order

### Webhook not receiving?

1. Test webhook URL manually:
   ```bash
   curl -X POST https://your-project.supabase.co/functions/v1/cryptomus-webhook \
     -H "Content-Type: application/json" \
     -d '{"order_id":"test-order","status":"paid"}'
   ```
2. Check Cryptomus dashboard for webhook delivery logs
3. Verify webhook URL is correct in Cryptomus settings

---

## 📊 Database Schema

### Orders Table

```sql
- id (uuid)
- buyer_id (uuid)
- seller_id (uuid)
- product_id (uuid)
- amount (decimal)
- status (text) -- 'pending', 'paid', 'failed'
- payment_status (text) -- 'pending', 'completed', 'failed'
- payment_method (text) -- 'cryptomus'
- cryptomus_payment_id (text)
- download_url (text) -- Populated when paid
- download_expires_at (timestamp)
- created_at (timestamp)
- paid_at (timestamp)
```

---

## 🎯 Next Steps

1. ✅ Test payment flow end-to-end
2. ✅ Configure webhook in Cryptomus dashboard
3. ✅ Deploy edge functions to production
4. ✅ Test with real crypto payment
5. ✅ Monitor webhook logs for issues

---

## 📞 Support

If you encounter issues:

1. Check browser console logs (look for 🚀 emojis)
2. Check edge function logs
3. Verify Cryptomus webhook configuration
4. Check database order status

---

## 🎉 You're All Set!

Your Cryptomus payment integration is complete and follows the exact flow:

**User clicks Buy → Create order → Redirect to Cryptomus → Webhook confirms → Backend marks paid → Success page checks → Download unlocks**

Happy selling! 🚀
