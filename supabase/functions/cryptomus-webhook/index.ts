// Supabase Edge Function: Cryptomus Webhook Handler
// 
// STEP 4: Cryptomus sends webhook when payment is confirmed
// STEP 5: Backend marks order as PAID and generates download URL

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
    
    console.log('🔔 STEP 4: Cryptomus webhook received:', payload)

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Extract payment info from Cryptomus webhook
    const { order_id, status, payment_amount, currency, uuid } = payload

    if (!order_id) {
      console.error('❌ No order_id in webhook payload')
      return new Response(
        JSON.stringify({ success: false, error: 'Missing order_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('🔍 Looking up order:', order_id)

    // Find the order in database
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, product:products(*)')
      .eq('id', order_id)
      .single()

    if (orderError || !order) {
      console.error('❌ Order not found:', order_id, orderError)
      return new Response(
        JSON.stringify({ success: false, error: 'Order not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('📦 Order found:', order.order_number, 'Status:', order.status)

    // STEP 5: Mark order as PAID when payment is confirmed
    if (status === 'paid' || status === 'paid_over') {
      console.log('✅ STEP 5: Payment confirmed - marking order as PAID')

      // Generate download URL (expires in 30 days)
      const downloadExpiresAt = new Date()
      downloadExpiresAt.setDate(downloadExpiresAt.getDate() + 30)

      // Update order to PAID status
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'paid',
          payment_status: 'completed',
          cryptomus_payment_id: uuid,
          paid_at: new Date().toISOString(),
          download_url: order.product?.file_url || null,
          download_expires_at: downloadExpiresAt.toISOString(),
        })
        .eq('id', order_id)

      if (updateError) {
        console.error('❌ Failed to update order:', updateError)
        throw updateError
      }

      console.log('✅ Order marked as PAID with download URL')

      // Increment product download count
      if (order.product_id) {
        await supabase.rpc('increment_download_count', {
          product_id: order.product_id
        })
        console.log('📊 Product download count incremented')
      }

      // Calculate and record seller payout (90/10 split)
      const sellerEarnings = parseFloat(payment_amount || order.price) * 0.9
      const platformFee = parseFloat(payment_amount || order.price) * 0.1

      console.log('💰 Recording seller payout:', {
        seller: sellerEarnings,
        platform: platformFee
      })

      // Create payout record
      try {
        await supabase
          .from('payouts')
          .insert({
            seller_id: order.seller_id,
            order_id: order.id,
            amount: sellerEarnings,
            currency: currency || 'USD',
            status: 'pending',
            payment_method: 'cryptomus',
          })

        console.log('✅ Payout record created')
      } catch (payoutError) {
        console.error('⚠️ Failed to create payout record:', payoutError)
        // Continue - order is still paid
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Payment confirmed - order marked as PAID',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } 
    
    // Handle failed payments
    else if (status === 'cancel' || status === 'fail' || status === 'wrong_amount') {
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
    } 
    
    // Handle pending/processing payments
    else {
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
