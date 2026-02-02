import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🔔 PesaPal webhook received')
    
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse webhook data
    const webhookData = await req.json()
    console.log('📋 Webhook data:', webhookData)

    const { OrderTrackingId, OrderMerchantReference, Status } = webhookData

    if (!OrderTrackingId) {
      console.error('❌ No OrderTrackingId in webhook')
      return new Response('Missing OrderTrackingId', { status: 400 })
    }

    // Find the order by tracking ID
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select('*')
      .eq('pesapal_tracking_id', OrderTrackingId)
      .single()

    if (orderError || !order) {
      console.error('❌ Order not found:', OrderTrackingId)
      return new Response('Order not found', { status: 404 })
    }

    console.log('📦 Found order:', order.id)

    // Process payment based on status
    if (Status === 'COMPLETED' || Status === 'PAID') {
      console.log('✅ Payment completed for order:', order.id)

      // Update order status to paid
      await supabaseClient
        .from('orders')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          payment_status: Status
        })
        .eq('id', order.id)

      // Process 90/10 split
      await process90_10Split(supabaseClient, order)

      // Send notifications
      await sendPaymentNotifications(supabaseClient, order)

      console.log('🎉 Payment processing completed for order:', order.id)

    } else if (Status === 'FAILED' || Status === 'CANCELLED') {
      console.log('❌ Payment failed/cancelled for order:', order.id)

      // Update order status
      await supabaseClient
        .from('orders')
        .update({
          status: 'failed',
          payment_status: Status,
          error_message: `Payment ${Status.toLowerCase()}`
        })
        .eq('id', order.id)

    } else {
      console.log('⏳ Payment pending for order:', order.id, 'Status:', Status)

      // Update order with current status
      await supabaseClient
        .from('orders')
        .update({
          payment_status: Status
        })
        .eq('id', order.id)
    }

    return new Response('Webhook processed successfully', { 
      status: 200, 
      headers: corsHeaders 
    })

  } catch (error) {
    console.error('💥 Webhook processing error:', error)
    
    return new Response(
      JSON.stringify({ error: 'Webhook processing failed' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

// Process 90/10 revenue split
async function process90_10Split(supabaseClient: any, order: any) {
  try {
    console.log('💰 Processing 90/10 split for order:', order.id)

    // 90% to seller
    const sellerAmount = order.seller_earnings
    
    // 10% to platform (already calculated in order)
    const platformAmount = order.platform_fee

    console.log(`💵 Seller gets: ${sellerAmount}, Platform gets: ${platformAmount}`)

    // Create seller payout record
    const { error: payoutError } = await supabaseClient
      .from('seller_payouts')
      .insert({
        seller_id: order.seller_id,
        order_id: order.id,
        amount: sellerAmount,
        currency: order.currency || 'KES',
        payout_method: 'pending_setup',
        status: 'pending',
        created_at: new Date().toISOString()
      })

    if (payoutError) {
      console.error('❌ Failed to create seller payout:', payoutError)
    } else {
      console.log('✅ Seller payout record created')
    }

    // Update platform earnings
    const { error: platformError } = await supabaseClient
      .from('platform_earnings')
      .insert({
        order_id: order.id,
        amount: platformAmount,
        currency: order.currency || 'KES',
        source: 'order_commission',
        created_at: new Date().toISOString()
      })

    if (platformError) {
      console.error('❌ Failed to record platform earnings:', platformError)
    } else {
      console.log('✅ Platform earnings recorded')
    }

    // Update seller stats
    await supabaseClient
      .from('profiles')
      .update({
        total_earnings: supabaseClient.raw(`COALESCE(total_earnings, 0) + ${sellerAmount}`),
        total_sales: supabaseClient.raw(`COALESCE(total_sales, 0) + 1`)
      })
      .eq('user_id', order.seller_id)

    console.log('✅ 90/10 split processing completed')

  } catch (error) {
    console.error('💥 90/10 split processing error:', error)
  }
}

// Send payment notifications
async function sendPaymentNotifications(supabaseClient: any, order: any) {
  try {
    console.log('📧 Sending payment notifications for order:', order.id)

    // Notify buyer
    await supabaseClient
      .from('notifications')
      .insert({
        user_id: order.buyer_id,
        type: 'payment_success',
        title: 'Payment Successful! 🎉',
        message: 'Your payment has been processed successfully. You can now download your product.',
        data: {
          order_id: order.id,
          amount: order.price,
          currency: order.currency
        }
      })

    // Notify seller
    await supabaseClient
      .from('notifications')
      .insert({
        user_id: order.seller_id,
        type: 'sale_notification',
        title: 'New Sale! 💰',
        message: `You made a sale! You'll receive ${order.seller_earnings} ${order.currency || 'KES'} (90% of ${order.price}).`,
        data: {
          order_id: order.id,
          amount: order.seller_earnings,
          currency: order.currency,
          buyer_id: order.buyer_id
        }
      })

    console.log('✅ Notifications sent successfully')

  } catch (error) {
    console.error('💥 Notification sending error:', error)
  }
}