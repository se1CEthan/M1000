import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// PesaPal Configuration
const PESAPAL_CONFIG = {
  CONSUMER_KEY: 'weWg875DVTHfXKyPK2w2qq0SuZjLKnFx',
  CONSUMER_SECRET: 'owNK+kmjk1tgSYIfOGxuvnxCSos=',
  BASE_URL: 'https://pay.pesapal.com/v3',
  CURRENCY: 'UGX'
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
    const { paymentData, accessToken, orderId } = await req.json()

    if (!paymentData || !accessToken || !orderId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields: paymentData, accessToken, orderId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Creating PesaPal payment for order: ${orderId}`)

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Call PesaPal Submit Order API
    console.log('Calling PesaPal Submit Order API...')
    
    const pesapalResponse = await fetch(`${PESAPAL_CONFIG.BASE_URL}/api/Transactions/SubmitOrderRequest`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(paymentData)
    })

    if (!pesapalResponse.ok) {
      const errorText = await pesapalResponse.text()
      console.error('PesaPal API error:', errorText)
      throw new Error(`PesaPal API error: ${pesapalResponse.statusText}`)
    }

    const pesapalResult = await pesapalResponse.json()
    console.log('PesaPal API response:', pesapalResult)

    if (pesapalResult.order_tracking_id && pesapalResult.redirect_url) {
      // Update order with PesaPal details
      await supabaseClient
        .from('orders')
        .update({
          pesapal_tracking_id: pesapalResult.order_tracking_id,
          payment_url: pesapalResult.redirect_url,
          payment_id: pesapalResult.order_tracking_id
        })
        .eq('id', orderId)

      console.log('PesaPal payment created successfully for order:', orderId)

      // Return success response
      return new Response(
        JSON.stringify({
          success: true,
          orderId: orderId,
          paymentUrl: pesapalResult.redirect_url,
          trackingId: pesapalResult.order_tracking_id,
          merchantReference: pesapalResult.merchant_reference
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      console.error('Invalid PesaPal response:', pesapalResult)
      
      // Update order status to failed
      await supabaseClient
        .from('orders')
        .update({ status: 'failed', error_message: 'PesaPal payment creation failed' })
        .eq('id', orderId)

      return new Response(
        JSON.stringify({
          success: false,
          error: pesapalResult.error || 'Failed to create PesaPal payment'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    console.error('PesaPal payment creation error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Payment creation failed'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})