# Cryptomus Widget Information

## 🎨 Widget Iframe Code

If you want to embed the Cryptomus payment widget directly on a page (alternative to redirect):

```html
<iframe 
  src="https://pay.cryptomus.com/widget/ad03d118-5bfc-4322-bfd9-7e37c8aafec1" 
  height="372px" 
  width="728px"
  frameborder="0"
  style="border: none;"
></iframe>
```

## 📋 Widget Details

- **Merchant UUID**: `ad03d118-5bfc-4322-bfd9-7e37c8aafec1`
- **Widget URL**: `https://pay.cryptomus.com/widget/ad03d118-5bfc-4322-bfd9-7e37c8aafec1`
- **Dimensions**: 728px × 372px
- **Type**: Embedded payment widget

## 🔄 Current Implementation

We're currently using the **redirect flow** instead of the embedded widget:

1. User clicks "Buy Now"
2. System creates order in database
3. System creates payment invoice via Cryptomus API
4. User is redirected to Cryptomus payment page
5. User completes payment
6. Cryptomus sends webhook to our backend
7. User returns to success page

## 💡 Alternative: Embedded Widget

If you prefer to embed the widget directly on your page instead of redirecting:

### Option 1: Modal with Iframe

```tsx
// In InstantPaymentWidget.tsx
return (
  <Dialog open={isOpen} onOpenChange={onClose}>
    <DialogContent className="max-w-3xl">
      <DialogHeader>
        <DialogTitle>Complete Payment</DialogTitle>
      </DialogHeader>
      <iframe 
        src={`https://pay.cryptomus.com/widget/${merchantUuid}?order_id=${orderId}&amount=${amount}`}
        height="372px" 
        width="100%"
        frameBorder="0"
        style={{ border: 'none' }}
      />
    </DialogContent>
  </Dialog>
);
```

### Option 2: Inline on Product Page

```tsx
// In ProductDetail.tsx
{showPayment && (
  <div className="mt-6 border rounded-lg p-4">
    <h3 className="text-lg font-semibold mb-4">Complete Your Purchase</h3>
    <iframe 
      src={`https://pay.cryptomus.com/widget/ad03d118-5bfc-4322-bfd9-7e37c8aafec1`}
      height="372px" 
      width="728px"
      frameBorder="0"
      className="mx-auto"
    />
  </div>
)}
```

## ⚠️ Important Notes

1. **Webhook is still required** - Even with embedded widget, you need webhook to confirm payment
2. **Order must be created first** - Create order in your database before showing widget
3. **Pass order_id to widget** - Include order ID in widget URL parameters
4. **Listen for postMessage** - Widget may send messages when payment completes

## 🎯 Recommendation

**Stick with redirect flow** (current implementation) because:

- ✅ Better mobile experience
- ✅ Full-screen payment interface
- ✅ Cryptomus handles all UI/UX
- ✅ Easier to maintain
- ✅ More secure (no iframe issues)
- ✅ Better conversion rates

The embedded widget is good for:
- Dashboard integrations
- Admin panels
- Quick payments without leaving page

But for e-commerce checkout, redirect is the industry standard.

## 🔗 Resources

- [Cryptomus API Docs](https://doc.cryptomus.com/)
- [Cryptomus Dashboard](https://cryptomus.com/dashboard)
- [Widget Documentation](https://doc.cryptomus.com/payments/widget)
