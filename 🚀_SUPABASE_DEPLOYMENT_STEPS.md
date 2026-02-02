# 🚀 Complete Supabase Edge Functions Deployment

## Step 1: Install Supabase CLI

### On Windows:
```bash
npm install -g supabase
```

### On Mac/Linux:
```bash
npm install -g supabase
# OR
brew install supabase/tap/supabase
```

## Step 2: Login to Supabase
```bash
supabase login
```
This will open your browser to authenticate with Supabase.

## Step 3: Link Your Project
```bash
supabase link --project-ref rtsaarapvlzzinmpjdys
```
Use your project reference ID from your Supabase URL.

## Step 4: Deploy Edge Functions
```bash
# Deploy both functions
supabase functions deploy create-payment
supabase functions deploy cryptomus-webhook
```

## Step 5: Set Environment Variables
```bash
# Set the service role key (get from Supabase dashboard > Settings > API)
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## Step 6: Test the Functions
```bash
# Test payment creation
curl -X POST "https://rtsaarapvlzzinmpjdys.supabase.co/functions/v1/create-payment" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"productId":"test","buyerId":"test","currency":"USDT"}'

# Test webhook
curl -X POST "https://rtsaarapvlzzinmpjdys.supabase.co/functions/v1/cryptomus-webhook" \
  -H "Content-Type: application/json" \
  -d '{"uuid":"test","order_id":"123","status":"paid"}'
```

## Step 7: Configure Cryptomus Webhook
In your Cryptomus merchant dashboard, set webhook URL:
```
https://rtsaarapvlzzinmpjdys.supabase.co/functions/v1/cryptomus-webhook
```

## Step 8: Deploy Frontend to Render
Your `render.yaml` is already configured. Just push to GitHub:
```bash
git add .
git commit -m "Add Supabase Edge Functions for Cryptomus"
git push origin main
```

Then deploy on Render.com by connecting your repository.

## 🎯 Your URLs After Deployment

**Frontend:** `https://seltech-marketplace.onrender.com`
**Payment Function:** `https://rtsaarapvlzzinmpjdys.supabase.co/functions/v1/create-payment`
**Webhook Function:** `https://rtsaarapvlzzinmpjdys.supabase.co/functions/v1/cryptomus-webhook`

## 🧪 Test Complete Payment Flow

1. Go to your deployed site
2. Browse to any product
3. Click "Buy Now"
4. Select cryptocurrency (USDT recommended)
5. Click "Continue to Payment"
6. You'll be redirected to Cryptomus
7. Complete payment
8. Return to success page

## 🔍 Monitor Functions

### View Function Logs
```bash
supabase functions logs create-payment
supabase functions logs cryptomus-webhook
```

### Check Function Status
Go to Supabase Dashboard > Edge Functions to see deployment status and logs.

## 🎉 Benefits of Supabase Edge Functions

✅ **No CORS Issues** - Server-side execution
✅ **No "Unknown API Error"** - Direct Cryptomus integration
✅ **Free Tier** - Generous limits
✅ **Global Edge Network** - Fast worldwide
✅ **TypeScript Support** - Type-safe code
✅ **Integrated with Database** - Direct Supabase access
✅ **Automatic Scaling** - Handles traffic spikes
✅ **Built-in Authentication** - Secure by default

## 🚨 Important Notes

1. **Service Role Key**: Get this from Supabase Dashboard > Settings > API
2. **Function URLs**: Use your actual project reference ID
3. **Webhook Security**: Functions verify signatures automatically
4. **Database Access**: Functions use service role for full access

## 🔄 Alternative: PHP Backend on Render

If you prefer PHP, you can still use the PHP backend files I created, but Supabase Edge Functions are more integrated and performant.

## 🎯 Next Steps

1. ✅ Install Supabase CLI
2. ✅ Login and link project
3. ✅ Deploy Edge Functions
4. ✅ Set environment variables
5. ✅ Test functions
6. ✅ Configure Cryptomus webhook
7. ✅ Deploy frontend to Render
8. ✅ Test complete payment flow
9. ✅ Launch production payments!

The Supabase Edge Functions solution provides the most integrated and scalable approach for your Cryptomus payment system.