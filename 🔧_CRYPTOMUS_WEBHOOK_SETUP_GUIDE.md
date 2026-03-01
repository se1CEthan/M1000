# 🔧 How to Configure Cryptomus Webhook URL

## 📋 Webhook URL to Configure:
```
https://rtsaarapvlzzinmpjdys.supabase.co/functions/v1/cryptomus-webhook
```

## 🚀 Step-by-Step Instructions

### Step 1: Login to Cryptomus Merchant Dashboard
1. Go to [https://merchant.cryptomus.com](https://merchant.cryptomus.com)
2. Login with your merchant credentials
3. You should see your merchant dashboard

### Step 2: Navigate to Webhook Settings
**Option A: Via Settings Menu**
1. Look for "Settings" or "Configuration" in the main menu
2. Click on "Webhooks" or "Notifications"
3. Find "Webhook URL" or "Callback URL" section

**Option B: Via Integration/API Section**
1. Look for "Integration" or "API" in the menu
2. Click on "Webhooks" or "Callback Settings"
3. Find the webhook configuration area

### Step 3: Configure Webhook URL
1. **Find the webhook URL field** (may be labeled as):
   - "Webhook URL"
   - "Callback URL" 
   - "Notification URL"
   - "IPN URL"

2. **Enter your webhook URL:**
   ```
   https://rtsaarapvlzzinmpjdys.supabase.co/functions/v1/cryptomus-webhook
   ```

3. **Select webhook events** (if available):
   - ✅ Payment completed
   - ✅ Payment confirmed
   - ✅ Payment failed
   - ✅ Payment cancelled

### Step 4: Test Webhook (if available)
1. Look for "Test Webhook" or "Send Test" button
2. Click to send a test notification
3. Verify it reaches your endpoint successfully

### Step 5: Save Configuration
1. Click "Save" or "Update" button
2. Confirm the webhook URL is saved
3. Note any webhook secret/key provided

## 🔍 Common Webhook Field Names

Different sections might use these labels:
- **Webhook URL** ← Most common
- **Callback URL**
- **Notification URL** 
- **IPN URL** (Instant Payment Notification)
- **Server URL**
- **Endpoint URL**

## 📱 Visual Guide

### What to Look For:
```
┌─────────────────────────────────────┐
│ Cryptomus Merchant Dashboard        │
├─────────────────────────────────────┤
│ Settings > Webhooks                 │
│                                     │
│ Webhook URL: [________________]     │
│                                     │
│ Events:                             │
│ ☑ Payment Success                   │
│ ☑ Payment Failed                    │
│ ☑ Payment Cancelled                 │
│                                     │
│ [Test Webhook] [Save Settings]      │
└─────────────────────────────────────┘
```

## 🎯 Alternative Locations

If you can't find webhook settings, try these sections:
1. **Account Settings** → Webhooks
2. **API Configuration** → Callbacks
3. **Integration** → Notifications
4. **Developer Tools** → Webhooks
5. **Payment Settings** → Callbacks

## 🔧 Webhook Configuration Details

### Required Settings:
- **URL:** `https://rtsaarapvlzzinmpjdys.supabase.co/functions/v1/cryptomus-webhook`
- **Method:** POST
- **Content-Type:** application/json
- **Events:** All payment events

### Optional Settings:
- **Timeout:** 30 seconds
- **Retry:** 3 attempts
- **Secret:** (if provided, note it down)

## 🧪 Testing Your Webhook

After configuration, test with a small payment:
1. Create a test payment
2. Complete the payment process
3. Check your Supabase function logs
4. Verify order status updates in database

## 🚨 Troubleshooting

### If webhook field is not visible:
1. Check if you have merchant/admin permissions
2. Look for "Advanced Settings" or "Developer Mode"
3. Contact Cryptomus support for webhook access

### If webhook fails:
1. Verify URL is exactly: `https://rtsaarapvlzzinmpjdys.supabase.co/functions/v1/cryptomus-webhook`
2. Check Supabase function logs for errors
3. Ensure HTTPS (not HTTP)

## 📞 Need Help?

If you can't find the webhook settings:
1. **Cryptomus Support:** Contact their merchant support
2. **Documentation:** Check Cryptomus API documentation
3. **Live Chat:** Use their merchant dashboard chat (if available)

## ✅ Verification

Once configured, you should see:
- ✅ Webhook URL saved in Cryptomus dashboard
- ✅ Test webhook successful (if tested)
- ✅ Payment notifications arriving at your endpoint
- ✅ Order status updates in your database

Your webhook is now ready to receive payment notifications automatically! 🎉