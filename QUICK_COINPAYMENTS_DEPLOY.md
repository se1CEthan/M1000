# ⚡ Quick CoinPayments Deployment Guide

## Your CoinPayments Credentials
- API URL: `https://api.coinpayments.net`
- Client ID: `bfac314b50fd498fa7bfe48b01431afa`
- Client Secret: `hEvJZAOvDxqzQxdNs53L6a8GxJ4XiT87zD1qKCza/YU=`

**Secured in edge functions - never exposed to frontend**

## Deploy in 3 Steps

### Step 1: Deploy Edge Functions
```bash
bash scripts/deploy-coinpayments.sh
```

### Step 2: Configure CoinPayments IPN
1. Go to https://www.coinpayments.net/acct-settings
2. Click "Merchant Settings"
3. Set IPN URL:
   ```
   https://rtsaarapvlzzinmpjdys.supabase.co/functions/v1/coinpayments-webhook
   ```
4. Enable IPN
5. Save

### Step 3: Test
Visit any product page and click "Buy Now"

## What Happens
1. User pays with crypto via CoinPayments
2. System automatically calculates:
   - 10% platform fee
   - 90% seller earnings
3. Payment confirmed via webhook
4. Seller payout triggered automatically
5. All transactions logged

## Success URL
After payment: `https://seltech.online/order-success?order_id={ORDER_ID}`

## Monitor
View logs: https://supabase.com/dashboard/project/rtsaarapvlzzinmpjdys/functions

Done! 🚀
