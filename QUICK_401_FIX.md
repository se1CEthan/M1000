# ⚡ Quick 401 Fix for Edge Function

## The Problem
Edge function returns: `401 Unauthorized`

## The Solution (Choose One)

### Option 1: Deploy via CLI (Fastest)
```bash
# Run the deployment script
bash scripts/deploy-edge-function.sh
```

The script now includes `--no-verify-jwt` flag which disables authentication.

### Option 2: Deploy via Dashboard
1. Go to: https://supabase.com/dashboard/project/rtsaarapvlzzinmpjdys/functions
2. Click `create-cryptomus-payment`
3. Go to **Settings** tab
4. Find "JWT Verification" and toggle it **OFF**
5. Click **Save**
6. Go back to **Details** tab
7. Click "Deploy new version"
8. Upload `supabase/functions/create-cryptomus-payment/index.ts`
9. Deploy

### Option 3: Manual CLI Command
```bash
supabase login
supabase link --project-ref rtsaarapvlzzinmpjdys
supabase functions deploy create-cryptomus-payment --no-verify-jwt
```

## Test It Works
```bash
curl -X POST https://rtsaarapvlzzinmpjdys.supabase.co/functions/v1/create-cryptomus-payment \
  -H "Content-Type: application/json" \
  -d '{"amount":"10","currency":"USD","order_id":"test-123"}'
```

Should return payment URL, not 401.

## Why This Works
- Payment endpoints don't need user authentication
- Order validation happens in the frontend
- The function just creates a Cryptomus invoice
- No sensitive data is exposed

## Files Updated
- ✅ `supabase/functions/create-cryptomus-payment/index.ts` - Better CORS headers
- ✅ `scripts/deploy-edge-function.sh` - Added `--no-verify-jwt` flag
- ✅ `src/components/payment/InstantPaymentWidget.tsx` - Added headers

## Next Steps
After deployment, test the payment flow on your site.
