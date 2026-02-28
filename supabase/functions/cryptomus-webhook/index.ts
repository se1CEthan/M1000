// Supabase Edge Function: Cryptomus Webhook Handler
// Processes payment confirmations and triggers seller payouts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const payload = await req.json()
    
    console.log('🔔 Cryptomus webhook received:', payload)

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Extract payment info
    const { order_id, status, payment_amount, currency, uuid } = payload

    if (!order_id) {
      console.error('❌ No order_id in webhook payload')
      return new Response(
        JSON.stringify({ success: false, error: 'Missing order_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Find the order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, product:products(*)')
      .eq('id', order_id)
      .single()

    if (orderError || !order) {
      console.error('❌ Order not found:', order_id)
      return new Response(
        JSON.stringify({ success: false, error: 'Order not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('📦 Order found:', order.order_number)

    // Update order status based on payment status
    if (status === 'paid' || status === 'paid_over') {
      console.log('✅ Payment confirmed - updating order')

      // Update order to paid
      await supabase
        .from('orders')
        .update({
          status: 'paid',
          payment_status: 'completed',
          cryptomus_payment_id: uuid,
          paid_at: new Date().toISOString(),
        })
        .eq('id', order_id)

      // Increment product download count
      if (order.product_id) {
        await supabase.rpc('increment_download_count', {
          product_id: order.product_id
        })
      }

      // Trigger seller payout (90/10 split)
      console.log('💰 Triggering seller payout...')
      
      try {
        const payoutResponse = await fetch(
          `${supabaseUrl}/functions/v1/process-seller-payout`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify({
              order_id: order.id,
              seller_id: order.seller_id,
              amount: parseFloat(payment_amount || order.price),
              currency: currency || 'USD',
            }),
          }
        )

        const payoutResult = await payoutResponse.json()
        console.log('💵 Payout result:', payoutResult)

        if (!payoutResult.success) {
          console.error('⚠️ Payout failed but order is paid:', payoutResult.error)
          // Order is still paid, just payout failed - admin can handle manually
        }
      } catch (payoutError) {
        console.error('💥 Payout processing error:', payoutError)
        // Continue - order is paid, payout can be retried
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Payment confirmed and payout processed',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else if (status === 'cancel' || status === 'fail' || status === 'wrong_amount') {
      console.log('❌ Payment failed - updating order')

      await supabase
        .from('orders')
        .update({
          status: 'failed',
          payment_status: 'failed',
          cryptomus_payment_id: uuid,
        })
        .eq('id', order_id)

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Payment failed - order updated',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      console.log('⏳ Payment pending:', status)

      await supabase
        .from('orders')
        .update({
          payment_status: 'pending',
          cryptomus_payment_id: uuid,
        })
        .eq('id', order_id)

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Payment status updated',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  } catch (error: any) {
    console.error('💥 Webhook processing error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
