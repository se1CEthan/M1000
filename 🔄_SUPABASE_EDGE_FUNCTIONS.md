# 🔄 Supabase Edge Functions Alternative

## ⚠️ Important Note

Supabase Edge Functions use **Deno/TypeScript**, not PHP. We'd need to convert the PHP code to TypeScript.

## 🚀 Converting to Supabase Edge Functions

### Step 1: Create Edge Function Structure
```
supabase/
└── functions/
    ├── create-payment/
    │   └── index.ts
    ├── webhook-handler/
    │   └── index.ts
    └── _shared/
        └── cryptomus.ts
```

### Step 2: Create Payment Function
**`supabase/functions/create-payment/index.ts`**:
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { productId, buyerId, currency } = await req.json()
    
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get product details
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('status', 'approved')
      .single()

    if (productError || !product) {
      throw new Error('Product not found')
    }

    // Create order
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
    
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        buyer_id: buyerId,
        seller_id: product.seller_id,
        product_id: productId,
        order_number: orderNumber,
        status: 'pending',
        price: product.price,
        platform_fee: product.price * 0.1,
        seller_earnings: product.price * 0.9,
        payment_method: 'cryptocurrency',
        currency: 'USD',
        crypto_currency: currency
      })
      .select()
      .single()

    if (orderError || !order) {
      throw new Error('Failed to create order')
    }

    // Call Cryptomus API
    const cryptomusData = {
      amount: product.price.toString(),
      currency: 'USD',
      order_id: order.id,
      url_return: `https://seltech.online/order-success?order=${order.id}`,
      url_success: `https://seltech.online/order-success?order=${order.id}`,
      url_callback: `https://your-project.supabase.co/functions/v1/webhook-handler`,
      to_currency: currency,
      lifetime: 3600,
      is_payment_multiple: false,
      merchant: Deno.env.get('CRYPTOMUS_MERCHANT_UUID')
    }

    // Generate signature
    const jsonString = JSON.stringify(cryptomusData)
    const base64Data = btoa(jsonString)
    const message = base64Data + Deno.env.get('CRYPTOMUS_PAYMENT_API_KEY')
    
    const encoder = new TextEncoder()
    const data = encoder.encode(message)
    const hashBuffer = await crypto.subtle.digest('MD5', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    // Call Cryptomus
    const response = await fetch('https://api.cryptomus.com/v1/payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'merchant': Deno.env.get('CRYPTOMUS_MERCHANT_UUID') ?? '',
        'sign': signature
      },
      body: JSON.stringify(cryptomusData)
    })

    const result = await response.json()

    if (result.state !== 0) {
      throw new Error('Cryptomus API error')
    }

    // Update order with payment details
    await supabase
      .from('orders')
      .update({
        payment_id: result.result.uuid,
        crypto_amount: parseFloat(result.result.payer_amount || '0'),
        payment_address: result.result.address,
        payment_network: result.result.network
      })
      .eq('id', order.id)

    return new Response(
      JSON.stringify({
        success: true,
        orderId: order.id,
        paymentUrl: result.result.url
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
```

### Step 3: Deploy Edge Functions
```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Deploy functions
supabase functions deploy create-payment
supabase functions deploy webhook-handler

# Set environment variables
supabase secrets set CRYPTOMUS_MERCHANT_UUID=6e6c1018-48f4-49fd-a10d-36d6cd70eefe
supabase secrets set CRYPTOMUS_PAYMENT_API_KEY=your-key-here
```

### Step 4: Update Frontend for Edge Functions
```typescript
// Update simple-cryptomus-payment.ts
const response = await fetch(`${supabaseUrl}/functions/v1/create-payment`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${supabaseAnonKey}`
  },
  body: JSON.stringify({
    productId: data.productId,
    buyerId: data.buyerId,
    currency: data.currency
  })
});
```

## 🤔 Comparison: Render vs Supabase

| Feature | Render PHP | Supabase Edge Functions |
|---------|------------|------------------------|
| **Language** | PHP (existing code) | TypeScript (need conversion) |
| **Setup Time** | 5 minutes | 30+ minutes |
| **Cost** | Free tier | Free tier |
| **Performance** | Good | Excellent (edge) |
| **Maintenance** | Low | Medium |
| **Complexity** | Simple | Complex |

## 🎯 Recommendation

**Use Render** for fastest deployment since:
- ✅ Your PHP code works as-is
- ✅ 5-minute setup vs 30+ minutes
- ✅ No code conversion needed
- ✅ Easier debugging and maintenance

**Use Supabase Edge Functions** only if:
- You want everything in Supabase ecosystem
- You're comfortable converting PHP to TypeScript
- You need global edge performance