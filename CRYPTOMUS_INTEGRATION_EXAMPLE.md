# Cryptomus Integration Example

## How to Use the New Widget Component

### 1. Import the Component
```tsx
import { CryptomusWidgetModal } from '@/components/payment/CryptomusWidgetModal';
```

### 2. Add to Your ProductDetail Page
```tsx
export default function ProductDetail() {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);

  const handlePurchase = () => {
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = (orderId: string) => {
    // Redirect to success page or show success message
    window.location.href = `/order-success?order=${orderId}`;
  };

  return (
    <div>
      {/* Your existing product display code */}
      
      <Button onClick={handlePurchase}>
        Buy Now - ${product?.price}
      </Button>

      {/* Payment Modal */}
      <CryptomusWidgetModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        product={product!}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
```

### 3. Widget Configuration in Cryptomus Dashboard

**Widget ID:** `d39cd7e9-6660-4a68-ba36-557cdb52b1d6`

**Success URL:**
```
https://seltech.online/order-success?order={order_id}
```

**Webhook URL:**
```
https://seltech.online/api/webhooks/cryptomus
```

**Return URL:**
```
https://seltech.online/marketplace
```

## How It Works

1. **User clicks "Buy Now"** → Opens payment modal
2. **Modal creates order** → Stores in your database with pending status
3. **Widget URL generated** → Includes order ID and product details
4. **User completes payment** → In the embedded Cryptomus widget
5. **Cryptomus sends webhook** → Updates order status to paid
6. **Success redirect** → User goes to your success page with order ID
7. **Download available** → User can download their product

## Key Benefits

- ✅ **Order tracking** - Orders are created in your database before payment
- ✅ **Proper integration** - Widget knows about your products and users
- ✅ **Automatic payouts** - Sellers get paid automatically when orders complete
- ✅ **Download management** - Secure download links with expiration
- ✅ **Real-time updates** - Order status updates via webhooks
- ✅ **Error handling** - Proper error messages and retry functionality

## Testing

1. Create a test product in your system
2. Click "Buy Now" to open the payment modal
3. Complete the payment flow in the widget
4. Verify the webhook receives the payment notification
5. Check that the order status updates to "paid"
6. Confirm the success page shows the correct order information

This integration properly connects your existing order system with the Cryptomus widget, ensuring customers get access to their purchases and sellers receive their payouts.