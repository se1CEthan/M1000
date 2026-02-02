import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Cryptomus Configuration
const CRYPTOMUS_CONFIG = {
  MERCHANT_UUID: '6e6c1018-48f4-49fd-a10d-36d6cd70eefe',
  PAYMENT_API_KEY: 'DSk5vMk3RIBhiQ3qGUw1pH1iYJI1hSSN8iTYmHpm3WpyTj9bsTtIlhadpiFKlK5aVUmpjHH8YoLV9dQsxLAPzpQOdiffl2hzJo0378ExFJB3HMSx49LjTfvnm9qHztoP',
  BASE_URL: 'https://api.cryptomus.com/v1'
}

// Generate MD5 hash (Deno compatible)
async function generateMD5(message: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(message)
  const hashBuffer = await crypto.subtle.digest('MD5', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// Generate Cryptomus signature
async function generateSignature(data: Record<string, any>, apiKey: string): Promise<string> {
  const jsonString = JSON.stringify(data)
  const base64Data = btoa(jsonString)
  const message = base64Data + apiKey
  return await generateMD5(message)
}

// Call Cryptomus API
async function callCryptomusAPI(endpoint: string, data: Record<string, any>) {
  data.merchant = CRYPTOMUS_CONFIG.MERCHANT_UUID
  const signature = await generateSignature(data, CRYPTOMUS_CONFIG.PAYMENT_API_KEY)
  
  const response = await fetch(`${CRYPTOMUS_CONFIG.BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'merchant': CRYPTOMUS_CONFIG.MERCHANT_UUID,
      'sign': signature
    },
    body: JSON.stringify(data)
  })
  
  if (!response.ok) {
    throw new Error(`Cryptomus API error: ${response.statusText}`)
  }
  
  return await response.json()
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ success: false, error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const { productId, buyerId, currency, paymentData, signature, merchantUuid } = await req.json()

    if (!productId || !buyerId || !currency) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields: productId, buyerId, currency' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Creating payment for product: ${productId}, buyer: ${buyerId}, currency: ${currency}`)

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // If paymentData is provided, use it directly (from production-crypto-payment.ts)
    if (paymentData && signature && merchantUuid) {
      console.log('Using provided payment data from client')
      
      // Call Cryptomus API directly with provided data
      const response = await fetch(`${CRYPTOMUS_CONFIG.BASE_URL}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'merchant': merchantUuid,
          'sign': signature
        },
        body: JSON.stringify(paymentData)
      })
      
      if (!response.ok) {
        throw new Error(`Cryptomus API error: ${response.statusText}`)
      }
      
      const result = await response.json()
      console.log('Cryptomus API response:', result)

      if (result.state === 0 && result.result) {
        return new Response(
          JSON.stringify({
            success: true,
            orderId: paymentData.order_id,
            paymentUrl: result.result.url,
            paymentId: result.result.uuid,
            amount: result.result.amount,
            currency: result.result.currency,
            toCurrency: result.result.payer_currency,
            expiresAt: result.result.expired_at,
            qrCode: result.result.qr_code
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } else {
        return new Response(
          JSON.stringify({
            success: false,
            error: result.message || 'Payment creation failed'
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Get product details
    const { data: product, error: productError } = await supabaseClient
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('status', 'approved')
      .single()

    if (productError || !product) {
      console.error('Product fetch error:', productError)
      return new Response(
        JSON.stringify({ success: false, error: 'Product not found or not available' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user already owns this product
    const { data: existingOrder } = await supabaseClient
      .from('orders')
      .select('id')
      .eq('buyer_id', buyerId)
      .eq('product_id', productId)
      .eq('status', 'paid')
      .single()

    if (existingOrder) {
      return new Response(
        JSON.stringify({ success: false, error: 'You already own this product' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Calculate revenue split
    const price = parseFloat(product.price)
    const platformFee = price * 0.1
    const sellerEarnings = price * 0.9

    // Create order in database
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`

    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .insert({
        buyer_id: buyerId,
        seller_id: product.seller_id,
        product_id: productId,
        order_number: orderNumber,
        status: 'pending',
        price: price,
        platform_fee: platformFee,
        seller_earnings: sellerEarnings,
        payment_method: 'cryptocurrency',
        currency: 'USD',
        crypto_currency: currency
      })
      .select()
      .single()

    if (orderError || !order) {
      console.error('Order creation error:', orderError)
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to create order' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Order created successfully:', order.id)

    // Prepare Cryptomus payment data
    const baseUrl = 'https://seltech.online'
    
    const paymentData = {
      amount: price.toString(),
      currency: 'USD',
      order_id: order.id,
      url_return: `${baseUrl}/order-success?order=${order.id}`,
      url_success: `${baseUrl}/order-success?order=${order.id}`,
      url_callback: `${baseUrl}/supabase/functions/v1/cryptomus-webhook`,
      to_currency: currency,
      lifetime: 3600, // 1 hour
      is_payment_multiple: false
    }

    console.log('Creating Cryptomus invoice:', paymentData)

    // Call Cryptomus API
    const response = await callCryptomusAPI('/payment', paymentData)

    if (response.state !== 0 || !response.result) {
      console.error('Cryptomus API error:', response)
      
      // Update order status to failed
      await supabaseClient
        .from('orders')
        .update({ status: 'refunded' })
        .eq('id', order.id)

      return new Response(
        JSON.stringify({ success: false, error: 'Failed to create payment invoice' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const paymentResult = response.result

    // Update order with payment details
    await supabaseClient
      .from('orders')
      .update({
        payment_id: paymentResult.uuid,
        crypto_amount: parseFloat(paymentResult.payer_amount || '0'),
        payment_address: paymentResult.address,
        payment_network: paymentResult.network
      })
      .eq('id', order.id)

    console.log('Payment created successfully for order:', order.id)

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        orderId: order.id,
        paymentUrl: paymentResult.url,
        paymentId: paymentResult.uuid,
        amount: paymentResult.amount,
        currency: paymentResult.currency,
        toCurrency: paymentResult.payer_currency,
        expiresAt: paymentResult.expired_at
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Payment creation error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Payment creation failed'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})