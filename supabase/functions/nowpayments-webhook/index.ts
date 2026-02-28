// Supabase Edge Function: NowPayments Webhook Handler
// Processes payment confirmations and triggers seller payouts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const NOWPAYMENTS_API_KEY = 'ZNGD7SV-MD74WZK-QSSY2K5-6CW1K3D'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-nowpayments-sig',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const payload = await req.json()
    
    console.log('🔔 NowPayments webhook received:', payload)

    // Verify webhook signature (if provided)
    const signature = req.headers.get('x-nowpayments-sig')
    if (signature) {
      // TODO: Implement signature verification
      console.log('🔐 Webhook signature:', signature)
    }

    const { payment_id, order_id, payment_status, price_amount, price_currency, pay_amount, pay_currency } = payload

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, products(seller_id, title)')
      .eq('id', order_id)
      .single()

    if (orderError || !order) {
      console.error('❌ Order not found:', order_id)
      return new Response(JSON.stringify({ error: 'Order not found' }), { status: 404 })
    }

    // Update order status based on payment status
    let orderStatus = 'pending'
    let shouldPayout = false

    switch (payment_status) {
      case 'finished':
      case 'confirmed':
        orderStatus = 'paid'
        shouldPayout = true
        break
      case 'partially_paid':
        orderStatus = 'pending'
        break
      case 'failed':
      case 'expired':
      case 'refunded':
        orderStatus = 'failed'
        break
      default:
        orderStatus = 'pending'
    }

    console.log(`📊 Payment status: ${payment_status} → Order status: ${orderStatus}`)

    // Update order
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: orderStatus,
        payment_status: payment_status,
        paid_amount: pay_amount,
        paid_currency: pay_currency,
        updated_at: new Date().toISOString(),
      })
      .eq('id', order_id)

    if (updateError) {
      console.error('❌ Failed to update order:', updateError)
    }

    // Log transaction update
    await supabase.from('transaction_logs').insert({
      order_id,
      payment_id,
      amount: price_amount,
      currency: price_currency,
      paid_amount: pay_amount,
      paid_currency: pay_currency,
      platform_fee: order.platform_fee,
      seller_earnings: order.seller_earnings,
      seller_id: order.products.seller_id,
      status: payment_status,
      provider: 'nowpayments',
      metadata: payload,
    })

    // If payment is confirmed, process seller payout
    if (shouldPayout) {
      console.log('💸 Processing seller payout...')
      
      // Get seller wallet info
      const { data: seller } = await supabase
        .from('users')
        .select('crypto_wallet_address, crypto_wallet_network, payout_method')
        .eq('id', order.products.seller_id)
        .single()

      if (seller?.crypto_wallet_address) {
        // Create payout record
        const { data: payout, error: payoutError } = await supabase
          .from('payouts')
          .insert({
            seller_id: order.products.seller_id,
            order_id: order_id,
            amount: order.seller_earnings,
            currency: price_currency,
            wallet_address: seller.crypto_wallet_address,
            wallet_network: seller.crypto_wallet_network,
            status: 'pending',
            payout_method: 'crypto',
          })
          .select()
          .single()

        if (!payoutError && payout) {
          console.log('✅ Payout record created:', payout.id)
          
          // Trigger automatic payout via NowPayments (if supported)
          // Or mark for manual processing
          await supabase
            .from('payouts')
            .update({ status: 'processing' })
            .eq('id', payout.id)
        }
      } else {
        console.log('⚠️ Seller has no wallet configured, payout pending manual processing')
      }
    }

    return new Response(
      JSON.stringify({ success: true, order_id, status: orderStatus }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('💥 Webhook processing error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
