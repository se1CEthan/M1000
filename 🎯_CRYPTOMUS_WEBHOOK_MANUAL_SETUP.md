# 🎯 Cryptomus Webhook Manual Setup Guide

## ❌ API Configuration Not Available

The automatic API configuration failed because Cryptomus doesn't provide public endpoints for webhook configuration. **Manual setup is required.**

## ✅ Your Webhook is Ready

**Good news:** Your Supabase Edge Function is working correctly and ready to receive webhooks!

**Webhook URL:** `https://rtsaarapvlzzinmpjdys.supabase.co/functions/v1/cryptomus-webhook`

## 📋 Manual Configuration Steps

### Step 1: Login to Cryptomus Dashboard
1. Go to [https://merchant.cryptomus.com](https://merchant.cryptomus.com)
2. Login with your merchant credentials
3. Navigate to your merchant dashboard

### Step 2: Find Webhook Settings
Look for one of these menu sections:
- **Settings** → **Webhooks**
- **API** → **Webhook Configuration**
- **Integration** → **Notifications**
- **Account** → **Webhook Settings**
- **Developer** → **Webhooks**

### Step 3: Configure Webhook URL
1. **Find the webhook URL field** (may be labeled as):
   - Webhook URL
   - Callback URL
   - Notification URL
   - IPN URL
   - Server URL

2. **Enter your webhook URL:**
   ```
   https://rtsaarapvlzzinmpjdys.supabase.co/functions/v1/cryptomus-webhook
   ```

3. **Select webhook events:**
   - ✅ Payment Success / Paid
   - ✅ Payment Failed / Failed
   - ✅ Payment Cancelled / Cancelled
   - ✅ Payment Processing / Pending

4. **Set HTTP method:** POST

5. **Content type:** application/json

### Step 4: Save and Test
1. Click **Save** or **Update Settings**
2. Look for **Test Webhook** button (if available)
3. Send a test notification
4. Verify it appears in your Supabase function logs

## 🧪 Test Your Webhook

After configuration, test with this command:

```bash
# Test webhook manually
curl -X POST "https://rtsaarapvlzzinmpjdys.supabase.co/functions/v1/cryptomus-webhook" \
  -H "Content-Type: application/json" \
  -H "sign: test_signature" \
  -d '{
    "uuid": "test-payment-123",
    "order_id": "test-order-456",
    "status": "paid",
    "amount": "10.00",
    "currency": "USD",
    "payer_currency": "USDT",
    "payer_amount": "10.00"
  }'
```

**Expected response:** `401 Unauthorized` (this is correct - it means the webhook is working but rejecting invalid signatures)

## 🔍 Verify Configuration

### Check Supabase Function Logs:
1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/rtsaarapvlzzinmpjdys/functions)
2. Click on **cryptomus-webhook** function
3. View logs for incoming webhook calls

### Test with Real Payment:
1. Create a small test payment ($1-5)
2. Complete the payment process
3. Check if order status updates in your database
4. Verify webhook logs in Supabase

## 📱 Visual Guide

### What the Cryptomus Dashboard Should Look Like:

```
┌─────────────────────────────────────────────────┐
│ Cryptomus Merchant Dashboard                    │
├─────────────────────────────────────────────────┤
│ Settings > Webhooks                             │
│                                                 │
│ Webhook URL: [_________________________]       │
│ https://rtsaarapvlzzinmpjdys.supabase.co/...   │
│                                                 │
│ Events:                                         │
│ ☑ Payment Success                               │
│ ☑ Payment Failed                                │
│ ☑ Payment Cancelled                             │
│ ☑ Payment Processing                            │
│                                                 │
│ HTTP Method: POST                               │
│ Content-Type: application/json                  │
│                                                 │
│ [Test Webhook] [Save Settings]                  │
└─────────────────────────────────────────────────┘
```

## 🚨 Troubleshooting

### If you can't find webhook settings:
1. **Check permissions:** Ensure you have admin/merchant access
2. **Look for "Advanced" or "Developer" sections**
3. **Contact Cryptomus support** for webhook access
4. **Check documentation** in your merchant dashboard

### If webhook test fails:
1. **Verify URL is exact:** `https://rtsaarapvlzzinmpjdys.supabase.co/functions/v1/cryptomus-webhook`
2. **Check HTTPS:** Must be HTTPS, not HTTP
3. **Verify function is deployed:** Check Supabase dashboard
4. **Check function logs** for error messages

## 📞 Need Help?

### Cryptomus Support:
- **Email:** support@cryptomus.com
- **Dashboard:** Look for "Support" or "Help" in merchant dashboard
- **Documentation:** Check their API documentation

### Common Issues:
1. **"Webhook field not visible"** → Contact support for webhook access
2. **"Test webhook fails"** → Check URL and HTTPS
3. **"No webhook events"** → Verify all events are selected
4. **"Signature errors"** → Check webhook secret configuration

## ✅ Success Indicators

Once properly configured, you should see:
- ✅ Webhook URL saved in Cryptomus dashboard
- ✅ Test webhook returns expected response
- ✅ Real payments trigger webhook calls
- ✅ Order status updates automatically
- ✅ Seller payouts initiated automatically

## 🎯 Next Steps

1. ✅ **Configure webhook in Cryptomus dashboard**
2. ✅ **Test with small payment**
3. ✅ **Verify order status updates**
4. ✅ **Deploy frontend to production**
5. ✅ **Launch your marketplace!**

Your payment system is ready - just needs the webhook URL configured in Cryptomus! 🚀