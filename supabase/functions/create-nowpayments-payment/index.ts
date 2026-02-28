// Supabase Edge Function: Create NowPayments Payment
// Securely creates payment invoices via NowPayments API

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const NOWPAYMENTS_API_KEY = 'ZNGD7SV-MD74WZK-QSSY2K5-6CW1K3D'
const NOWPAYMENTS_BASE_URL = 'https://api.nowpayments.io/v1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { amount, currency, order_id, product_id, seller_id, buyer_email } = await req.json()

    console.log('📡 Creating NowPayments invoice:', { amount, currency, order_id })

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
      platformFee,
      sellerEarnings,
    })

    // Create payment invoice via NowPayments API
    const paymentData = {
      price_amount: amount,
      price_currency: currency,
      pay_currency: currency, // Allow any crypto
      order_id: order_id,
      order_description: `Order ${order_id}`,
      ipn_callback_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/nowpayments-webhook`,
      success_url: `https://seltech.online/order-success?order_id=${order_id}`,
      cancel_url: `https://seltech.online/products/${product_id}`,
    }

    const response = await fetch(`${NOWPAYMENTS_BASE_URL}/invoice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': NOWPAYMENTS_API_KEY,
      },
      body: JSON.stringify(paymentData),
    })

    const result = await response.json()

    console.log('📨 NowPayments response:', result)

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
          payment_provider: 'nowpayments',
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
        provider: 'nowpayments',
        metadata: result,
      })

      return new Response(
        JSON.stringify({
          success: true,
          payment_url: result.invoice_url,
          payment_id: result.id,
          order_id: result.order_id,
          amount: result.price_amount,
          currency: result.price_currency,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      console.error('❌ NowPayments API error:', result)
      return new Response(
        JSON.stringify({
          success: false,
          error: result.message || 'Failed to create payment invoice',
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
