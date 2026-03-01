# Cryptomus Widget Setup Guide for Seltech.online

## Overview
This guide shows how to properly integrate the Cryptomus payment widget with your existing order system.

## Step 1: Cryptomus Dashboard Configuration

### 1.1 Widget Settings
In your Cryptomus merchant dashboard, configure these URLs:

**Success URL:**
```
https://seltech.online/order-success?order={order_id}
```

**Return URL:**
```
https://seltech.online/marketplace
```

**Webhook URL:**
```
https://seltech.online/api/webhooks/cryptomus
```

### 1.2 Widget Parameters
Your widget should support these parameters:
- `amount` - Payment amount
- `currency` - USD (base currency)
- `order_id` - Your internal order ID
- `description` - Product description

## Step 2: Dynamic Widget Integration

Instead of using a static iframe, create dynamic payment URLs that include your order information.

### 2.1 Widget URL Structure
```
https://pay.cryptomus.com/widget/d39cd7e9-6660-4a68-ba36-557cdb52b1d6?amount={amount}&currency=USD&order_id={order_id}&description={description}
```

### 2.2 Implementation
Use the `CryptomusWidgetIntegrated.tsx` component I created, which:
1. Creates an order in your database first
2. Generates a dynamic widget URL with the order ID
3. Shows the widget with proper order tracking

## Step 3: Order Flow Integration

### 3.1 Pre-create Orders
Before showing the widget:
```typescript
// 1. Create order in your database
const order = await createOrder({
  buyer_id: user.id,
  product_id: product.id,
  price: product.price,
  status: 'pending'
});

// 2. Generate widget URL with order ID
const widgetUrl = `https://pay.cryptomus.com/widget/YOUR_WIDGET_ID?amount=${product.price}&currency=USD&order_id=${order.id}&description=${encodeURIComponent(product.title)}`;
```

### 3.2 Widget Display
```jsx
<iframe
  src={widgetUrl}
  width="440"
  height="372"
  frameBorder="0"
  title="Cryptomus Payment"
/>
```

## Step 4: Webhook Configuration

### 4.1 Webhook Endpoint
Your webhook at `/api/webhooks/cryptomus` should:
1. Verify the signature
2. Find the order by `order_id` (not payment_id)
3. Update order status based on payment status
4. Generate download URLs for successful payments
5. Process seller payouts

### 4.2 Webhook Payload Example
```json
{
  "uuid": "payment-uuid-from-cryptomus",
  "order_id": "your-internal-order-id",
  "status": "paid",
  "amount": "29.99",
  "currency": "USD"
}
```

## Step 5: Success Page Integration

### 5.1 URL Structure
After payment, Cryptomus redirects to:
```
https://seltech.online/order-success?order=YOUR_ORDER_ID
```

### 5.2 Success Page Logic
Your `OrderSuccess.tsx` page should:
1. Extract order ID from URL parameter
2. Fetch order details from your database
3. Show payment status and order information
4. Provide download link if payment is complete
5. Poll for status updates if payment is pending

## Step 6: Testing

### 6.1 Test Flow
1. Create a test product
2. Initiate payment (creates order)
3. Complete payment in widget
4. Verify webhook receives notification
5. Check order status is updated
6. Confirm success page shows correct information

### 6.2 Test URLs
- Test webhook: `https://seltech.online/api/webhooks/cryptomus`
- Test success: `https://seltech.online/order-success?order=test-order-id`

## Step 7: Production Deployment

### 7.1 Environment Variables
Ensure these are set in production:
```env
CRYPTOMUS_MERCHANT_UUID=6e6c1018-48f4-49fd-a10d-36d6cd70eefe
CRYPTOMUS_PAYMENT_API_KEY=your-payment-api-key
CRYPTOMUS_PAYOUT_API_KEY=your-payout-api-key
CRYPTOMUS_WEBHOOK_SECRET=your-webhook-secret
```

### 7.2 SSL Certificate
Ensure `seltech.online` has a valid SSL certificate for webhook delivery.

## Common Issues & Solutions

### Issue 1: Order Not Found
**Problem:** Success page shows "Order not found"
**Solution:** Ensure order is created before showing widget

### Issue 2: Webhook Not Received
**Problem:** Payment completes but order status doesn't update
**Solution:** Check webhook URL is accessible and returns 200 status

### Issue 3: Download Not Available
**Problem:** Payment complete but no download link
**Solution:** Verify download URL generation in webhook handler

## Integration Checklist

- [ ] Widget configured with correct URLs
- [ ] Order creation before payment
- [ ] Dynamic widget URL generation
- [ ] Webhook signature verification
- [ ] Order status updates
- [ ] Download URL generation
- [ ] Seller payout processing
- [ ] Success page integration
- [ ] Error handling
- [ ] Production testing

## Next Steps

1. Update your ProductDetail page to use `CryptomusWidgetIntegrated`
2. Test the complete flow in development
3. Deploy to production
4. Monitor webhook logs for any issues