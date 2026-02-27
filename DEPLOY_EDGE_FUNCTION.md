# Deploy Cryptomus Payment Edge Function

## Quick Deploy

Run this command to deploy the Edge Function:

```bash
./scripts/deploy-edge-function.sh
```

Or manually:

```bash
supabase functions deploy create-cryptomus-payment
```

## Prerequisites

1. **Install Supabase CLI**:
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**:
   ```bash
   supabase login
   ```

3. **Link your project**:
   ```bash
   supabase link --project-ref rtsaarapvlzzinmpjdys
   ```

## What This Does

The Edge Function:
- ✅ Receives payment requests from your frontend
- ✅ Generates proper Cryptomus API signatures
- ✅ Calls Cryptomus API to create payment invoices
- ✅ Returns payment URL to frontend
- ✅ Handles CORS properly

## After Deployment

The function will be available at:
```
https://rtsaarapvlzzinmpjdys.supabase.co/functions/v1/create-cryptomus-payment
```

Your frontend already calls this via:
```typescript
await supabase.functions.invoke('create-cryptomus-payment', {
  body: invoiceData
});
```

## Test the Function

```bash
curl -X POST https://rtsaarapvlzzinmpjdys.supabase.co/functions/v1/create-cryptomus-payment \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -d '{
    "amount": "10",
    "currency": "USD",
    "order_id": "test-123",
    "url_return": "https://seltech.online/order-success?order_id=test-123",
    "url_success": "https://seltech.online/order-success?order_id=test-123",
    "url_callback": "https://seltech.online/api/webhooks/cryptomus"
  }'
```

## Troubleshooting

### Error: "Supabase CLI not found"
```bash
npm install -g supabase
```

### Error: "Not logged in"
```bash
supabase login
```

### Error: "Project not linked"
```bash
supabase link --project-ref rtsaarapvlzzinmpjdys
```

### Error: "Function deployment failed"
Check the function logs:
```bash
supabase functions logs create-cryptomus-payment
```

## Alternative: Deploy via Supabase Dashboard

1. Go to https://supabase.com/dashboard/project/rtsaarapvlzzinmpjdys
2. Click "Edge Functions" in the sidebar
3. Click "New Function"
4. Name it: `create-cryptomus-payment`
5. Copy the code from `supabase/functions/create-cryptomus-payment/index.ts`
6. Click "Deploy"

## Verify Deployment

After deployment, test a purchase on your website:
1. Click "Buy Now" on any product
2. Check browser console for logs
3. You should see: "✅ Cryptomus payment created successfully"
4. User should be redirected to Cryptomus payment page

## Next Steps

Once deployed:
1. ✅ Test a purchase
2. ✅ Verify payment creation works
3. ✅ Check user is redirected to Cryptomus
4. ✅ Verify webhook receives payment confirmation
5. ✅ Check seller receives 90% payout
