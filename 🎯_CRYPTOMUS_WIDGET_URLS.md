# 🎯 Cryptomus Widget Configuration URLs

## 📋 URLs for Cryptomus Widget Setup

### ✅ **Success URL (Payment Completed):**
```
https://seltech.online/order-success
```

### 🔄 **Return URL (User Returns/Cancels):**
```
https://seltech.online/marketplace
```

### 🔗 **Webhook URL (Payment Notifications):**
```
https://rtsaarapvlzzinmpjdys.supabase.co/functions/v1/cryptomus-webhook
```

## 🎯 **Your Domain Configuration**

Since your domain is `seltech.online`, use these exact URLs:

| URL Type | URL | Purpose |
|----------|-----|---------|
| **Success URL** | `https://seltech.online/order-success` | Where users go after successful payment |
| **Return URL** | `https://seltech.online/marketplace` | Where users go if they cancel/return |
| **Webhook URL** | `https://rtsaarapvlzzinmpjdys.supabase.co/functions/v1/cryptomus-webhook` | Server notifications |

## 📝 **Widget Configuration Parameters**

When Cryptomus provides the widget code, configure these parameters:

```javascript
// Example widget configuration
{
  merchant: "6e6c1018-48f4-49fd-a10d-36d6cd70eefe",
  url_success: "https://seltech.online/order-success",
  url_return: "https://seltech.online/marketplace", 
  url_callback: "https://rtsaarapvlzzinmpjdys.supabase.co/functions/v1/cryptomus-webhook",
  // ... other parameters
}
```

## 🎯 **Success URL with Order ID**

For dynamic order tracking, you can use:

### **Static Success URL:**
```
https://seltech.online/order-success
```

### **Dynamic Success URL (with order ID):**
```
https://seltech.online/order-success?order={order_id}
```

The `{order_id}` placeholder will be replaced by Cryptomus with the actual order ID.

## 🔧 **Current Order Success Page**

Your existing order success page is already set up at:
- **File:** `src/pages/OrderSuccess.tsx`
- **Route:** `/order-success`
- **Features:** 
  - ✅ Order details display
  - ✅ Download links
  - ✅ Payment confirmation
  - ✅ Seller payout tracking

## 🧪 **Test URLs**

For testing, you can use:

### **Development URLs:**
```
Success: http://localhost:5173/order-success
Return: http://localhost:5173/marketplace
Webhook: https://rtsaarapvlzzinmpjdys.supabase.co/functions/v1/cryptomus-webhook
```

### **Production URLs:**
```
Success: https://seltech.online/order-success
Return: https://seltech.online/marketplace  
Webhook: https://rtsaarapvlzzinmpjdys.supabase.co/functions/v1/cryptomus-webhook
```

## 📋 **What to Tell Cryptomus**

When setting up the widget, provide these URLs:

1. **Success URL:** `https://seltech.online/order-success`
2. **Return/Cancel URL:** `https://seltech.online/marketplace`
3. **Webhook URL:** `https://rtsaarapvlzzinmpjdys.supabase.co/functions/v1/cryptomus-webhook`
4. **Merchant ID:** `6e6c1018-48f4-49fd-a10d-36d6cd70eefe`

## 🎉 **Payment Flow**

1. **User clicks "Buy"** → Widget opens
2. **User completes payment** → Cryptomus processes
3. **Payment successful** → User redirected to `https://seltech.online/order-success`
4. **Webhook sent** → Your Supabase function updates database
5. **Order status updated** → User gets download access
6. **Seller payout** → Automatic 90% revenue share

## ✅ **Ready to Use**

Your success page and webhook are already deployed and ready to handle Cryptomus widget payments! Just provide these URLs to Cryptomus when they set up your widget code.