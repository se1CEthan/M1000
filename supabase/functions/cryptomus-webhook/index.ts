import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Production Cryptomus Configuration
const CRYPTOMUS_PRODUCTION_CONFIG = {
  PAYOUT_API_KEY: '2nuhleS45ns1WTJDX1ZoRG8UAmDFDdahvMafGhU5knS5P3Ozn1Yx0tgRYCmjJpKvtNx0GVQ0FTLo0SNVw1ZM7Zy97fXSsbHX8SGbgGepEHCqwtxw3gIJ8LKDIMDJ3W4s',
  MERCHANT_UUID: '6e6c1018-48f4-49fd-a10d-36d6cd70eefe',
  BASE_URL: 'https://api.cryptomus.com/v1',
  WEBHOOK_SECRET: 'seltech_production_webhook_2024',
  MINIMUM_PAYOUT_USD: 10
}

// Generate MD5 hash (Deno compatible)
async function generateMD5(message: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(message)
  const hashBuffer = await crypto.subtle.digest('MD5', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// Verify webhook signature
async function verifyWebhookSignature(payload: string, signature: string): Promise<boolean> {
  try {
    const message = payload + CRYPTOMUS_PRODUCTION_CONFIG.WEBHOOK_SECRET
    const expectedSignature = await generateMD5(message)
    return signature === expectedSignature
  } catch (error) {
    console.error('Webhook signature verification error:', error)
    return false
  }
}

// Generate Cryptomus API signature
async function generateCryptomusSignature(data: any): Promise<string> {
  const jsonString = JSON.stringify(data)
  const base64Data = btoa(jsonString)
  const message = base64Data + CRYPTOMUS_PRODUCTION_CONFIG.PAYOUT_API_KEY
  return await generateMD5(message)
}

// Execute Cryptomus payout API call
async function executeCryptomusPayout(params: {
  payoutId: string
  amount: number
  currency: string
  network: string
  address: string
}): Promise<{ success: boolean; cryptomusId?: string; transactionHash?: string; error?: string }> {
  try {
    const payoutData = {
      amount: params.amount.toString(),
      currency: params.currency,
      network: params.network,
      address: params.address,
      order_id: params.payoutId,
      merchant: CRYPTOMUS_PRODUCTION_CONFIG.MERCHANT_UUID,
      url_callback: 'https://seltech.online/api/webhooks/cryptomus-payout'
    }

    const signature = await generateCryptomusSignature(payoutData)

    const response = await fetch(`${CRYPTOMUS_PRODUCTION_CONFIG.BASE_URL}/payout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'merchant': CRYPTOMUS_PRODUCTION_CONFIG.MERCHANT_UUID,
        'sign': signature
      },
      body: JSON.stringify(payoutData)
    })

    const result = await response.json()
    console.log('Cryptomus payout API response:', result)

    if (result.state === 0 && result.result) {
      return {
        success: true,
        cryptomusId: result.result.uuid,
        transactionHash: result.result.txid || 'pending'
      }
    } else {
      return {
        success: false,
        error: result.message || 'Cryptomus payout failed'
      }
    }
  } catch (error) {
    console.error('Cryptomus payout API error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Payout API call failed'
    }
  }
}

// Add earnings to pending balance
async function addToPendingBalance(supabase: any, sellerId: string, amount: number, orderId: string) {
  try {
    // Get or create pending balance
    const { data: existingBalance } = await supabase
      .from('seller_pending_balances')
      .select('amount')
      .eq('seller_id', sellerId)
      .single()
    
    if (existingBalance) {
      await supabase
        .from('seller_pending_balances')
        .update({
          amount: existingBalance.amount + amount,
          updated_at: new Date().toISOString()
        })
        .eq('seller_id', sellerId)
    } else {
      await supabase
        .from('seller_pending_balances')
        .insert({
          seller_id: sellerId,
          amount: amount
        })
    }

    // Record pending transaction
    await supabase
      .from('pending_payout_transactions')
      .insert({
        seller_id: sellerId,
        order_id: orderId,
        amount: amount,
        status: 'pending'
      })

    console.log(`💰 Added $${amount} to pending balance for seller: ${sellerId}`)
  } catch (error) {
    console.error('Error adding to pending balance:', error)
  }
}

// Generate secure download URL for completed orders
async function generateSecureDownloadUrl(supabase: any, productId: string): Promise<string | null> {
  try {
    // Get product file information
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('file_url, title')
      .eq('id', productId)
      .single()

    if (productError || !product?.file_url) {
      console.error('Product file not found:', productError)
      return null
    }

    // Create signed URL from product-files bucket (7 days expiry)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('product-files')
      .createSignedUrl(product.file_url, 7 * 24 * 60 * 60) // 7 days

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error('Signed URL generation error:', signedUrlError)
      return null
    }

    return signedUrlData.signedUrl
  } catch (error) {
    console.error('Download URL generation error:', error)
    return null
  }
}
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('total_earnings, total_sales')
      .eq('user_id', sellerId)
      .single()

    if (profile) {
      await supabase
        .from('profiles')
        .update({
          total_earnings: (profile.total_earnings || 0) + amount,
          total_sales: (profile.total_sales || 0) + 1
        })
        .eq('user_id', sellerId)
    }
  } catch (error) {
    console.error('Error updating seller stats:', error)
  }
}

// Process automatic seller payout (90% of payment)
async function processSellerPayout(supabase: any, orderId: string, sellerEarnings: number, currency: string) {
  try {
    console.log(`🚀 Processing seller payout for order: ${orderId}, amount: ${sellerEarnings}`)

    // Get seller's crypto wallet and order details
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select(`
        seller_id,
        seller_crypto_wallets!seller_crypto_wallets_seller_id_fkey(
          address, currency, network, is_default, is_verified
        )
      `)
      .eq('id', orderId)
      .single()
    
    if (orderError || !orderData) {
      console.error('Order not found:', orderError)
      return false
    }

    const sellerId = orderData.seller_id
    const wallet = orderData.seller_crypto_wallets

    if (!wallet || !wallet.address || !wallet.is_verified) {
      console.log(`No verified crypto wallet for seller: ${sellerId}`)
      
      // Add to pending balance
      await addToPendingBalance(supabase, sellerId, sellerEarnings, orderId)
      
      // Notify seller to setup wallet
      await supabase
        .from('notifications')
        .insert({
          user_id: sellerId,
          type: 'setup_crypto_wallet',
          title: 'Setup Crypto Wallet 💳',
          message: `You have earnings of $${sellerEarnings}! Setup your crypto wallet to receive automatic payouts.`,
          data: { amount: sellerEarnings, order_id: orderId }
        })
      
      return false
    }
    
    // Check minimum payout amount ($10)
    if (sellerEarnings >= CRYPTOMUS_PRODUCTION_CONFIG.MINIMUM_PAYOUT_USD) {
      console.log(`💰 Processing crypto payout: $${sellerEarnings} to ${wallet.address}`)
      
      // Create payout record
      const { data: payout, error: payoutError } = await supabase
        .from('crypto_payouts')
        .insert({
          seller_id: sellerId,
          order_id: orderId,
          amount: sellerEarnings,
          currency: wallet.currency,
          network: wallet.network,
          wallet_address: wallet.address,
          status: 'processing'
        })
        .select()
        .single()
      
      if (payoutError) {
        console.error('Payout record creation error:', payoutError)
        return false
      }

      // Execute Cryptomus payout
      const payoutResult = await executeCryptomusPayout({
        payoutId: payout.id,
        amount: sellerEarnings,
        currency: wallet.currency,
        network: wallet.network,
        address: wallet.address
      })

      if (payoutResult.success) {
        // Update payout record
        await supabase
          .from('crypto_payouts')
          .update({
            status: 'completed',
            cryptomus_payout_id: payoutResult.cryptomusId,
            transaction_hash: payoutResult.transactionHash,
            processed_at: new Date().toISOString()
          })
          .eq('id', payout.id)

        // Update seller stats
        await updateSellerStats(supabase, sellerId, sellerEarnings)

        // Send success notification
        await supabase
          .from('notifications')
          .insert({
            user_id: sellerId,
            type: 'crypto_payout_success',
            title: 'Crypto Payout Sent! 💰',
            message: `Your payout of $${sellerEarnings} has been sent to your ${wallet.currency} wallet. Transaction: ${payoutResult.transactionHash}`,
            data: { 
              amount: sellerEarnings, 
              currency: wallet.currency,
              transactionHash: payoutResult.transactionHash,
              estimatedArrival: '10-30 minutes'
            }
          })

        console.log(`✅ Crypto payout successful: ${payoutResult.transactionHash}`)
        return true
      } else {
        // Update payout record with failure
        await supabase
          .from('crypto_payouts')
          .update({
            status: 'failed',
            error_message: payoutResult.error
          })
          .eq('id', payout.id)

        // Send failure notification
        await supabase
          .from('notifications')
          .insert({
            user_id: sellerId,
            type: 'crypto_payout_failed',
            title: 'Crypto Payout Failed ⚠️',
            message: `Your crypto payout of $${sellerEarnings} failed: ${payoutResult.error}`,
            data: { amount: sellerEarnings, error: payoutResult.error }
          })

        console.error(`❌ Crypto payout failed: ${payoutResult.error}`)
        return false
      }
    } else {
      // Add to pending balance if below minimum
      await addToPendingBalance(supabase, sellerId, sellerEarnings, orderId)
      
      // Send pending balance notification
      await supabase
        .from('notifications')
        .insert({
          user_id: sellerId,
          type: 'pending_balance',
          title: 'Earnings Added to Pending Balance 💰',
          message: `Your earnings of $${sellerEarnings} have been added to your pending balance. You need $${CRYPTOMUS_PRODUCTION_CONFIG.MINIMUM_PAYOUT_USD} minimum for automatic payout.`,
          data: { amount: sellerEarnings, minimum: CRYPTOMUS_PRODUCTION_CONFIG.MINIMUM_PAYOUT_USD }
        })
      
      console.log(`💰 Added $${sellerEarnings} to pending balance (below $${CRYPTOMUS_PRODUCTION_CONFIG.MINIMUM_PAYOUT_USD} minimum)`)
      return true
    }
    
  } catch (error) {
    console.error('Seller payout processing error:', error)
    return false
  }
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

    // Get raw POST data and signature
    const payload = await req.text()
    const signature = req.headers.get('sign') || ''
    
    console.log('🔔 Production webhook received - Signature:', signature)
    console.log('📦 Webhook payload:', payload)
    
    // Verify signature
    if (!(await verifyWebhookSignature(payload, signature))) {
      console.log('❌ Invalid webhook signature')
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Parse webhook data
    const webhookData = JSON.parse(payload)
    console.log('✅ Webhook data parsed:', webhookData)
    
    // Extract payment information
    const paymentId = webhookData.uuid
    const orderId = webhookData.order_id
    const status = webhookData.status
    const paymentStatus = webhookData.payment_status
    const txid = webhookData.txid
    const amount = webhookData.amount
    const payerAmount = webhookData.payer_amount
    const currency = webhookData.payer_currency
    
    if (!paymentId || !orderId) {
      console.log('❌ Missing required webhook fields')
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    // Get order details
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('payment_id', paymentId)
      .single()
    
    if (orderError || !order) {
      console.log(`❌ Order not found: ${orderId} with payment ID: ${paymentId}`)
      return new Response(
        JSON.stringify({ success: false, error: 'Order not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    console.log(`🔄 Processing webhook for order: ${orderId}, status: ${status}, payment_status: ${paymentStatus}`)
    
    // Update order based on payment status
    let newStatus = 'pending'
    const updateFields: any = {
      payment_status: paymentStatus
    }
    
    if (txid) {
      updateFields.transaction_id = txid
    }
    
    if (payerAmount) {
      updateFields.crypto_amount = parseFloat(payerAmount)
    }
    
    // Determine order status based on Cryptomus status
    switch (status) {
      case 'paid':
      case 'paid_over':
        newStatus = 'paid'
        updateFields.paid_at = new Date().toISOString()
        break
      case 'fail':
      case 'cancel':
      case 'system_fail':
        newStatus = 'refunded'
        break
      case 'process':
      case 'confirm_check':
        newStatus = 'processing'
        break
      default:
        newStatus = 'pending'
    }
    
    updateFields.status = newStatus
    
    // Update order in database
    const { error: updateError } = await supabaseClient
      .from('orders')
      .update(updateFields)
      .eq('id', orderId)
    
    if (updateError) {
      console.error('❌ Order update error:', updateError)
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to update order' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    console.log(`✅ Order ${orderId} updated to status: ${newStatus}`)
    
    // If payment is successful, process seller payout (90% of payment)
    if (newStatus === 'paid' && order.seller_earnings > 0) {
      console.log(`💰 Payment confirmed! Processing 90% payout: $${order.seller_earnings}`)
      const payoutSuccess = await processSellerPayout(supabaseClient, orderId, order.seller_earnings, currency)
      if (payoutSuccess) {
        console.log(`✅ Seller payout initiated for order: ${orderId}`)
      } else {
        console.log(`⚠️ Seller payout deferred (pending balance or wallet setup needed)`)
      }
    }
    
    // Log webhook processing
    await supabaseClient
      .from('webhook_logs')
      .insert({
        webhook_type: 'cryptomus_payment',
        payment_id: paymentId,
        order_id: orderId,
        status: newStatus,
        payload: payload
      })
    
    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        orderId: orderId,
        status: newStatus,
        message: 'Production webhook processed successfully',
        sellerPayoutProcessed: newStatus === 'paid'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('❌ Production webhook processing error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Production webhook processing failed'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})