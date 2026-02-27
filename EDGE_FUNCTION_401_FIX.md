# 🔧 Edge Function 401 Error - FIXED

## Problem
The edge function `create-cryptomus-payment` returns 401 Unauthorized because Supabase Edge Functions require JWT authentication by default.

## Solution: Make Function Publicly Accessible

### Step 1: Update Edge Function Code
✅ Already done - Updated CORS headers to include all required headers:
- `authorization`
- `x-client-info`
- `apikey`
- `content-type`

### Step 2: Configure Function in Supabase Dashboard

1. Go to https://supabase.com/dashboard/project/rtsaarapvlzzinmpjdys/functions

2. Click on `create-cryptomus-payment` function

3. Go to "Settings" tab

4. Under "JWT Verification", toggle it to **OFF** or **Disabled**
   - This allows the function to be called without authentication
   - Safe for payment endpoints since order validation happens in frontend

5. Click "Save"

### Step 3: Redeploy the Function

After updating settings, redeploy with the updated code:

**Via Dashboard:**
1. Click "Deploy new version"
2. Upload `supabase/functions/create-cryptomus-payment/index.ts`
3. Click Deploy

**Via CLI:**
```bash
supabase functions deploy create-cryptomus-payment --no-verify-jwt
```

The `--no-verify-jwt` flag tells Supabase to skip JWT verification for this function.

## Alternative: Use Service Role Key (Not Recommended)

If you can't disable JWT verification, you could use the service role key, but this is NOT recommended for frontend calls:

```typescript
// DON'T DO THIS - Security risk
const supabaseAdmin = createClient(url, serviceRoleKey);
```

## Why This Works

Payment endpoints typically don't require authentication because:
- Order creation happens BEFORE calling the edge function
- User verification happens in the frontend
- The edge function only creates the Cryptomus invoice
- No sensitive data is exposed

## Test the Fix

After deployment:
1. Go to any product page on https://seltech.online
2. Click "Buy Now"
3. Check browser console - should see:
   ```
   ✅ Cryptomus payment created successfully
   🔗 Payment URL: https://pay.cryptomus.com/...
   ```
4. Should redirect to Cryptomus payment page

## Troubleshooting

If still getting 401:
1. Check that JWT verification is disabled in dashboard
2. Verify the anon key in .env is correct
3. Check browser console for the actual error message
4. Try calling the function directly:
   ```bash
   curl -X POST https://rtsaarapvlzzinmpjdys.supabase.co/functions/v1/create-cryptomus-payment \
     -H "Content-Type: application/json" \
     -d '{"amount":"10000","currency":"USD","order_id":"test-123"}'
   ```

If the curl works but frontend doesn't, it's a CORS issue, not auth.

