// Supabase Edge Function: Create Cryptomus Payment
// This function creates a payment invoice via Cryptomus API

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CRYPTOMUS_CONFIG = {
  PAYMENT_API_KEY: 'DSk5vMk3RIBhiQ3qGUw1pH1iYJI1hSSN8iTYmHpm3WpyTj9bsTtIlhadpiFKlK5aVUmpjHH8YoLV9dQsxLAPzpQOdiffl2hzJo0378ExFJB3HMSx49LjTfvnm9qHztoP',
  BASE_URL: 'https://api.cryptomus.com/v1',
  MERCHANT_UUID: '6e6c1018-48f4-49fd-a10d-36d6cd70eefe',
}

// Generate MD5 signature for Cryptomus API
async function generateSignature(data: Record<string, any>, apiKey: string): Promise<string> {
  const jsonString = JSON.stringify(data)
  const base64Data = btoa(jsonString)
  const message = base64Data + apiKey
  
  // Use Web Crypto API for MD5
  const encoder = new TextEncoder()
  const msgBuffer = encoder.encode(message)
  const hashBuffer = await crypto.subtle.digest('MD5', msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  
  return hashHex
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
    })
  }

  try {
    const { amount, currency, order_id, url_return, url_success, url_callback } = await req.json()

    console.log('📡 Creating Cryptomus payment:', { amount, currency, order_id })

    // Validate required fields
    if (!amount || !currency || !order_id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: amount, currency, order_id',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Prepare payment data
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

    console.log('📋 Payment data:', paymentData)

    // Generate signature
    const signature = await generateSignature(paymentData, CRYPTOMUS_CONFIG.PAYMENT_API_KEY)

    console.log('🔐 Signature generated')

    // Call Cryptomus API
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

    console.log('📨 Cryptomus response:', result)

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
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    } else {
      console.error('❌ Cryptomus API error:', result)
      return new Response(
        JSON.stringify({
          success: false,
          error: result.message || 'Failed to create payment invoice',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }
  } catch (error: any) {
    console.error('💥 Payment creation error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
