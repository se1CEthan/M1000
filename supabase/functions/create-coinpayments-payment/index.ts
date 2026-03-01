// Supabase Edge Function: Create CoinPayments Invoice
// Securely creates payment invoices via CoinPayments API

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const COINPAYMENTS_CONFIG = {
  API_URL: 'https://api.coinpayments.net',
  CLIENT_ID: 'bfac314b50fd498fa7bfe48b01431afa',
  CLIENT_SECRET: 'hEvJZAOvDxqzQxdNs53L6a8GxJ4XiT87zD1qKCza/YU=',
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Generate OAuth token for CoinPayments API
async function getAccessToken(): Promise<string> {
  const response = await fetch(`${COINPAYMENTS_CONFIG.API_URL}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: COINPAYMENTS_CONFIG.CLIENT_ID,
      client_secret: COINPAYMENTS_CONFIG.CLIENT_SECRET,
    }),
  })

  const data = await response.json()
  
  if (!response.ok || !data.access_token) {
    throw new Error('Failed to get access token')
  }

  return data.access_token
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { amount, currency, order_id, product_id, seller_id, buyer_email } = await req.json()

    console.log('📡 Creating CoinPayments invoice:', { amount, currency, order_id })

    // Validate required fields
    if (!amount || !currency || !order_id || !product_id || !seller_id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Calculate revenue split (90% seller, 10% platform)
    const platformFee = amount * 0.10
    const sellerEarnings = amount * 0.90

    console.log('💰 Revenue split:', {
      total: amount,
      platformFee: platformFee.toFixed(2),
      sellerEarnings: sellerEarnings.toFixed(2),
    })

    // Get OAuth access token
    const accessToken = await getAccessToken()
    console.log('🔐 Access token obtained')

    // Create invoice via CoinPayments API
    const invoiceData = {
      amount: amount.toString(),
      currency_id: currency,
      buyer_email: buyer_email || 'customer@seltech.online',
      invoice_id: order_id,
      success_url: `https://seltech.online/order-success?order_id=${order_id}`,
      cancel_url: `https://seltech.online/products/${product_id}`,
      ipn_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/coinpayments-webhook`,
      notes: `Order ${order_id} - Seltech Marketplace`,
    }

    console.log('📋 Invoice data:', invoiceData)

    const response = await fetch(`${COINPAYMENTS_CONFIG.API_URL}/api/v1/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(invoiceData),
    })

    const result = await response.json()

    console.log('📨 CoinPayments response:', result)

    if (response.ok && result.id) {
      // Initialize Supabase client
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const supabase = createClient(supabaseUrl, supabaseKey)

      // Update order with payment details and revenue split
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          payment_id: result.id,
          payment_status: 'pending',
          platform_fee: platformFee,
          seller_earnings: sellerEarnings,
          payment_provider: 'coinpayments',
        })
        .eq('id', order_id)

      if (updateError) {
        console.error('❌ Failed to update order:', updateError)
      }

      // Log transaction
      await supabase.from('transaction_logs').insert({
        order_id,
        payment_id: result.id,
        amount,
        currency,
        platform_fee: platformFee,
        seller_earnings: sellerEarnings,
        seller_id,
        status: 'pending',
        provider: 'coinpayments',
        metadata: result,
      })

      return new Response(
        JSON.stringify({
          success: true,
          payment_url: result.invoice_url || result.checkout_url,
          payment_id: result.id,
          order_id: result.invoice_id,
          amount: result.amount,
          currency: result.currency_id,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      console.error('❌ CoinPayments API error:', result)
      return new Response(
        JSON.stringify({
          success: false,
          error: result.error || result.message || 'Failed to create payment invoice',
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  } catch (error: any) {
    console.error('💥 Payment creation error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
