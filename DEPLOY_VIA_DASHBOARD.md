# Deploy Edge Function via Supabase Dashboard (Easy Way)

Since Supabase CLI installation is having issues, deploy directly through the dashboard:

## Step 1: Go to Supabase Dashboard

1. Open: https://supabase.com/dashboard/project/rtsaarapvlzzinmpjdys
2. Click **"Edge Functions"** in the left sidebar
3. Click **"Create a new function"** button

## Step 2: Create the Function

1. **Function Name**: `create-cryptomus-payment`
2. **Copy and paste this code**:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const CRYPTOMUS_CONFIG = {
  PAYMENT_API_KEY: 'DSk5vMk3RIBhiQ3qGUw1pH1iYJI1hSSN8iTYmHpm3WpyTj9bsTtIlhadpiFKlK5aVUmpjHH8YoLV9dQsxLAPzpQOdiffl2hzJo0378ExFJB3HMSx49LjTfvnm9qHztoP',
  BASE_URL: 'https://api.cryptomus.com/v1',
  MERCHANT_UUID: '6e6c1018-48f4-49fd-a10d-36d6cd70eefe',
}

async function generateSignature(data: Record<string, any>, apiKey: string): Promise<string> {
  const jsonString = JSON.stringify(data)
  const base64Data = btoa(jsonString)
  const message = base64Data + apiKey
  
  const encoder = new TextEncoder()
  const msgBuffer = encoder.encode(message)
  const hashBuffer = await crypto.subtle.digest('MD5', msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  
  return hashHex
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  }

  try {
    const { amount, currency, order_id, url_return, url_success, url_callback } = await req.json()

    console.log('Creating payment:', { amount, currency, order_id })

    if (!amount || !currency || !order_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    const paymentData = {
      amount: amount.toString(),
      currency,
      order_id,
      url_return: url_return || `https://seltech.online/order-success?order_id=${order_id}`,
      url_success: url_success || `https://seltech.online/order-success?order_id=${order_id}`,
      url_callback: url_callback || `https://seltech.online/api/webhooks/cryptomus`,
      lifetime: 3600,
      is_payment_multiple: false,
      merchant: CRYPTOMUS_CONFIG.MERCHANT_UUID,
    }

    const signature = await generateSignature(paymentData, CRYPTOMUS_CONFIG.PAYMENT_API_KEY)

    const response = await fetch(`${CRYPTOMUS_CONFIG.BASE_URL}/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'merchant': CRYPTOMUS_CONFIG.MERCHANT_UUID,
        'sign': signature,
      },
      body: JSON.stringify(paymentData),
    })

    const result = await response.json()

    if (response.ok && result.state === 0 && result.result) {
      return new Response(
        JSON.stringify({
          success: true,
          payment_url: result.result.url,
          payment_id: result.result.uuid,
          order_id: result.result.order_id,
          amount: result.result.amount,
          currency: result.result.currency,
          expired_at: result.result.expired_at,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    } else {
      return new Response(
        JSON.stringify({ success: false, error: result.message || 'Failed to create payment' }),
        { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    )
  }
})
```

3. Click **"Deploy"** button

## Step 3: Verify Deployment

After deployment, the function will be available at:
```
https://rtsaarapvlzzinmpjdys.supabase.co/functions/v1/create-cryptomus-payment
```

## Step 4: Test It

Go to your website and try to buy a product. It should now work!

## What This Does

- ✅ Receives payment requests from your frontend
- ✅ Generates Cryptomus API signatures
- ✅ Creates payment invoices
- ✅ Returns payment URL
- ✅ Handles CORS

## Troubleshooting

### If deployment fails:
1. Make sure you're logged into Supabase dashboard
2. Check the function logs in the dashboard
3. Verify the code was copied correctly

### If payments still fail:
1. Check browser console for errors
2. Go to Supabase Dashboard → Edge Functions → Logs
3. Look for error messages

## Alternative: Use Supabase CLI with Homebrew (Mac/Linux)

If you want to use CLI later:

```bash
# On Mac
brew install supabase/tap/supabase

# On Linux
curl -fsSL https://github.com/supabase/cli/releases/latest/download/supabase_linux_amd64.tar.gz | tar -xz
sudo mv supabase /usr/local/bin/
```

Then:
```bash
supabase login
supabase link --project-ref rtsaarapvlzzinmpjdys
supabase functions deploy create-cryptomus-payment
```

But for now, **just use the dashboard method above** - it's easier! 🚀
