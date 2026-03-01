# 🧪 Cryptomus Payment Testing Guide

## 📋 Pre-Testing Checklist

Before testing, ensure:

- ✅ Edge functions deployed: `./scripts/deploy-cryptomus.sh`
- ✅ Database migration applied: `add_cryptomus_columns.sql`
- ✅ Environment variables set in `.env`
- ✅ Webhook URL configured in Cryptomus dashboard
- ✅ User account created and logged in

---

## 🔍 Step-by-Step Testing

### Step 1: Create Test Order

1. **Login** to your marketplace
2. **Navigate** to any product page
3. **Click** "Buy Now - Pay with Crypto"
4. **Check browser console** for logs:
   ```
   🚀 Starting Cryptomus payment flow...
   👤 User: [user-id] [email]
   📦 Product: [product-id] [title] [price]
   📝 Step 2: Creating order in database...
   ✅ Order created in database: [order-id] [order-number]
   ```

### Step 2: Verify Order in Database

```sql
-- Check order was created
SELECT 
  id,
  order_number,
  status,
  payment_status,
  amount,
  buyer_id,
  seller_id,
  product_id,
  created_at
FROM orders 
WHERE id = '[order-id-from-console]';

-- Expected result:
-- status: 'pending'
-- payment_status: 'pending'
-- cryptomus_payment_id: NULL (not yet)
```

### Step 3: Payment Invoice Creation

**Check browser console:**
```
💳 Step 3: Creating Cryptomus payment invoice...
🔗 Payment URLs:
  webhook: https://[project].supabase.co/functions/v1/cryptomus-webhook
  success: https://seltech.online/order-success?order_id=[order-id]
  return: https://seltech.online/order-success?order_id=[order-id]
📋 Invoice data: {...}
📨 Cryptomus response: {...}
✅ Payment invoice created successfully
🔗 Payment URL: https://pay.cryptomus.com/pay/[payment-id]
💳 Payment ID: [uuid]
```

**Check edge function logs:**
```bash
supabase functions logs create-cryptomus-payment --tail
```

Look for:
```
📡 Creating Cryptomus payment: { amount, currency, order_id }
📋 Payment data: {...}
🔐 Signature generated
📨 Cryptomus response: {...}
```

### Step 4: Redirect to Cryptomus

**Browser should:**
1. Show toast: "Redirecting to Cryptomus payment..."
2. Redirect to: `https://pay.cryptomus.com/pay/[payment-id]`

**On Cryptomus page:**
- See product details
- See amount in USD
- See crypto payment options (BTC, ETH, USDT, etc.)

### Step 5: Complete Payment

**Test Payment Options:**

#### Option A: Real Crypto (Production)
1. Select cryptocurrency (e.g., USDT)
2. Copy payment address
3. Send crypto from your wallet
4. Wait for blockchain confirmation (5-15 minutes)

#### Option B: Test Mode (if available)
1. Use Cryptomus test mode
2. Complete test payment
3. Webhook should fire immediately

### Step 6: Webhook Confirmation

**Check webhook logs:**
```bash
supabase functions logs cryptomus-webhook --tail
```

**Expected logs:**
```
🔔 STEP 4: Cryptomus webhook received: {
  order_id: '[order-id]',
  status: 'paid',
  payment_amount: '10.00',
  currency: 'USD',
  uuid: '[payment-uuid]'
}
🔍 Looking up order: [order-id]
📦 Order found: [order-number] Status: pending
✅ STEP 5: Payment confirmed - marking order as PAID
✅ Order marked as PAID with download URL
📊 Product download count incremented
💰 Recording seller payout: { seller: 9.00, platform: 1.00 }
✅ Payout record created
```

### Step 7: Verify Order Updated

```sql
-- Check order was updated to paid
SELECT 
  id,
  order_number,
  status,
  payment_status,
  cryptomus_payment_id,
  download_url,
  download_expires_at,
  paid_at
FROM orders 
WHERE id = '[order-id]';

-- Expected result:
-- status: 'paid'
-- payment_status: 'completed'
-- cryptomus_payment_id: '[uuid]'
-- download_url: '[product-file-url]'
-- download_expires_at: [30 days from now]
-- paid_at: [timestamp]
```

### Step 8: Return to Success Page

**User returns to:**
```
https://seltech.online/order-success?order_id=[order-id]
```

**Check browser console:**
```
🎯 STEP 6: User returned to success page
📋 Fetching order details for: [order-id]
⏰ STEP 7: Starting payment status polling...
🔄 Checking backend for payment confirmation...
🔍 STEP 7: Checking backend if order is paid...
📊 Order status from backend: { status: 'paid', payment_status: 'completed', ... }
✅ STEP 8: Order is PAID - unlocking download!
```

**Page should show:**
- ✅ Green success banner
- ✅ "Payment Confirmed - Download Unlocked!"
- ✅ Download button (enabled)
- ✅ Order details
- ✅ Revenue split information

### Step 9: Test Download

1. **Click** "Download Now" button
2. **Verify** file download starts
3. **Check** download URL is valid

### Step 10: Verify Payout Record

```sql
-- Check payout was created
SELECT 
  id,
  seller_id,
  order_id,
  amount,
  currency,
  status,
  payment_method,
  created_at
FROM payouts 
WHERE order_id = '[order-id]';

-- Expected result:
-- amount: [90% of order amount]
-- status: 'pending'
-- payment_method: 'cryptomus'
```

---

## 🐛 Common Issues & Solutions

### Issue 1: Order Not Created

**Symptoms:**
- Error: "Failed to create order"
- No order in database

**Solutions:**
1. Check user is logged in
2. Verify buyer_id exists in profiles table
3. Check product_id is valid
4. Check database permissions

### Issue 2: Payment Invoice Creation Failed

**Symptoms:**
- Error: "Failed to create payment invoice"
- No redirect to Cryptomus

**Solutions:**
1. Check Cryptomus API credentials in edge function
2. Verify merchant UUID is correct
3. Check edge function logs for API errors
4. Test Cryptomus API directly with curl

### Issue 3: Webhook Not Received

**Symptoms:**
- Payment completed but order still pending
- No webhook logs

**Solutions:**
1. Verify webhook URL in Cryptomus dashboard
2. Check webhook URL is publicly accessible
3. Test webhook manually:
   ```bash
   curl -X POST https://[project].supabase.co/functions/v1/cryptomus-webhook \
     -H "Content-Type: application/json" \
     -d '{
       "order_id": "[order-id]",
       "status": "paid",
       "payment_amount": "10.00",
       "currency": "USD",
       "uuid": "test-uuid"
     }'
   ```
4. Check Cryptomus dashboard for webhook delivery status

### Issue 4: Download Not Unlocking

**Symptoms:**
- Order is paid but download button disabled
- Success page shows "pending"

**Solutions:**
1. Check order status in database (should be 'paid')
2. Verify download_url is populated
3. Check browser console for polling logs
4. Manually refresh the page
5. Click "Refresh" button on success page

### Issue 5: Webhook Signature Validation Failed

**Symptoms:**
- Webhook received but rejected
- Error: "Invalid signature"

**Solutions:**
1. Verify API key in edge function matches Cryptomus dashboard
2. Check signature generation algorithm
3. Test with Cryptomus test webhook

---

## 📊 Test Scenarios

### Scenario 1: Successful Payment
- ✅ Order created
- ✅ Payment completed
- ✅ Webhook received
- ✅ Order marked paid
- ✅ Download unlocked

### Scenario 2: Failed Payment
- ✅ Order created
- ❌ Payment failed/cancelled
- ✅ Webhook received (status: 'fail')
- ✅ Order marked failed
- ✅ User can retry

### Scenario 3: Expired Payment
- ✅ Order created
- ⏰ Payment not completed within 1 hour
- ✅ Payment expires
- ✅ Order remains pending
- ✅ User can create new order

### Scenario 4: Multiple Products
- ✅ Buy product A
- ✅ Complete payment
- ✅ Buy product B
- ✅ Complete payment
- ✅ Both downloads available

### Scenario 5: Same Product Twice
- ✅ Buy product once
- ✅ Complete payment
- ✅ Try to buy again
- ✅ New order created
- ✅ Both orders independent

---

## 🔐 Security Testing

### Test 1: Unauthorized Access
```
Try to access: /order-success?order_id=[someone-elses-order-id]
Expected: Error or access denied
```

### Test 2: Invalid Order ID
```
Try to access: /order-success?order_id=invalid-uuid
Expected: "Order not found" error
```

### Test 3: Expired Download
```sql
-- Manually expire download
UPDATE orders 
SET download_expires_at = NOW() - INTERVAL '1 day'
WHERE id = '[order-id]';

-- Try to download
Expected: Download should be blocked or warning shown
```

### Test 4: Webhook Replay Attack
```bash
# Send same webhook twice
curl -X POST [webhook-url] -d '[same-payload]'
curl -X POST [webhook-url] -d '[same-payload]'

Expected: Second webhook should be idempotent (no duplicate payout)
```

---

## 📈 Performance Testing

### Test 1: Concurrent Orders
- Create 10 orders simultaneously
- All should process correctly
- No race conditions

### Test 2: Large File Downloads
- Upload product with large file (500MB)
- Complete payment
- Download should work

### Test 3: Webhook Latency
- Measure time from payment to webhook
- Should be < 30 seconds typically

---

## ✅ Final Checklist

Before going live:

- [ ] Test complete flow end-to-end
- [ ] Verify webhook is working
- [ ] Test with real crypto payment
- [ ] Check all edge function logs
- [ ] Verify database updates correctly
- [ ] Test download links work
- [ ] Check payout records created
- [ ] Test error scenarios
- [ ] Verify security (unauthorized access)
- [ ] Test on mobile devices
- [ ] Check email notifications (if any)
- [ ] Monitor for 24 hours after launch

---

## 📞 Support

If tests fail:

1. Check all logs (browser console + edge functions)
2. Verify database state
3. Test webhook manually
4. Check Cryptomus dashboard
5. Review this guide again

For Cryptomus-specific issues:
- [Cryptomus Support](https://cryptomus.com/support)
- [API Documentation](https://doc.cryptomus.com/)

---

## 🎉 Success Criteria

Your integration is working correctly when:

✅ User can complete full payment flow
✅ Webhook confirms payment automatically
✅ Order status updates to 'paid'
✅ Download unlocks immediately
✅ Seller payout recorded (90/10 split)
✅ No errors in logs
✅ User receives product file

Happy testing! 🚀
