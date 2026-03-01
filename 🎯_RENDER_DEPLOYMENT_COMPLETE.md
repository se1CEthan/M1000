# 🎯 Complete Render Deployment Guide

## ✅ What's Ready for Deployment

I've prepared everything for **Render deployment** - the fastest and easiest option:

### **Files Updated:**
- ✅ `render.yaml` - Added PHP backend service
- ✅ `php-backend/config.php` - Environment variable support
- ✅ `src/lib/simple-cryptomus-payment.ts` - Render backend URL

## 🚀 Deploy to Render (5 Minutes)

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Add PHP backend for Cryptomus integration"
git push origin main
```

### Step 2: Deploy on Render
1. Go to [render.com](https://render.com)
2. Click "New" → "Blueprint"
3. Connect your GitHub repository
4. Render will detect `render.yaml` and create 2 services:
   - `seltech-marketplace` (frontend)
   - `seltech-php-backend` (PHP backend)

### Step 3: Set Environment Variables
In Render dashboard, go to `seltech-php-backend` service and set:

**Required Variables:**
```
DB_PASS = your_actual_supabase_password
CRYPTOMUS_PAYMENT_API_KEY = DSk5vMk3RIBhiQ3qGUw1pH1iYJI1hSSN8iTYmHpm3WpyTj9bsTtIlhadpiFKlK5aVUmpjHH8YoLV9dQsxLAPzpQOdiffl2hzJo0378ExFJB3HMSx49LjTfvnm9qHztoP
CRYPTOMUS_PAYOUT_API_KEY = 2nuhleS45ns1WTJDX1ZoRG8UAmDFDdahvMafGhU5knS5P3Ozn1Yx0tgRYCmjJpKvtNx0GVQ0FTLo0SNVw1ZM7Zy97fXSsbHX8SGbgGepEHCqwtxw3gIJ8LKDIMDJ3W4s
```

### Step 4: Test Deployment
Once deployed, test your PHP backend:
```
https://seltech-php-backend.onrender.com/test-connection.php
```

Expected response:
```json
{
  "success": true,
  "message": "PHP Backend Test Results",
  "tests": {
    "database": { "success": true },
    "cryptomus": { "success": true }
  }
}
```

### Step 5: Configure Cryptomus Webhook
In your Cryptomus merchant dashboard, set webhook URL:
```
https://seltech-php-backend.onrender.com/webhook.php
```

## 🎯 Your Deployment URLs

After deployment, you'll have:

**Frontend:** `https://seltech-marketplace.onrender.com`
**PHP Backend:** `https://seltech-php-backend.onrender.com`
**Custom Domain:** Point `seltech.online` to frontend URL

## 🧪 Test Complete Payment Flow

1. Go to your deployed site
2. Browse to any product
3. Click "Buy Now"
4. Select cryptocurrency (USDT recommended)
5. Click "Continue to Payment"
6. You'll be redirected to Cryptomus
7. Complete payment
8. Return to success page

## 🔍 Monitoring & Debugging

### Check Render Logs
- Go to Render dashboard
- Select `seltech-php-backend` service
- Click "Logs" tab
- Monitor for errors

### Test Individual Endpoints
```bash
# Test payment creation
curl -X POST https://seltech-php-backend.onrender.com/create-payment.php \
  -H "Content-Type: application/json" \
  -d '{"productId":"test","buyerId":"test","currency":"USDT"}'

# Test webhook
curl -X POST https://seltech-php-backend.onrender.com/webhook.php \
  -H "Content-Type: application/json" \
  -d '{"uuid":"test","order_id":"123","status":"paid"}'
```

## 🎉 Benefits of Render Solution

✅ **No CORS Issues** - Server-side API calls
✅ **No "Unknown API Error"** - Direct Cryptomus integration
✅ **Free Tier** - No cost for basic usage
✅ **Automatic HTTPS** - Secure by default
✅ **Git Deployment** - Push to deploy
✅ **Environment Variables** - Secure config
✅ **PHP 8+ Support** - Modern PHP features
✅ **Automatic Scaling** - Handles traffic spikes

## 🚨 Important Notes

1. **Free Tier Limitations:**
   - Services sleep after 15 minutes of inactivity
   - First request after sleep takes ~30 seconds
   - Upgrade to paid plan for always-on service

2. **Environment Variables:**
   - Set `DB_PASS` with your actual Supabase password
   - Keep API keys secure in Render dashboard

3. **Custom Domain:**
   - Point `seltech.online` to your Render frontend URL
   - Update DNS A/CNAME records

## 🔄 Alternative: Supabase Edge Functions

If you prefer keeping everything in Supabase, I've also created a guide for converting to Edge Functions, but Render is much faster to deploy since your PHP code works as-is.

## 🎯 Next Steps

1. ✅ Push code to GitHub
2. ✅ Deploy on Render
3. ✅ Set environment variables
4. ✅ Test PHP backend
5. ✅ Configure Cryptomus webhook
6. ✅ Test complete payment flow
7. ✅ Point custom domain to Render
8. ✅ Launch production payments!

The Render deployment eliminates all your CORS and API errors while providing a robust, scalable payment system.