// Supabase Edge Function: Process Seller Payout
// Handles 90/10 split: 90% to seller's crypto wallet, 10% to platform

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CRYPTOMUS_CONFIG = {
  PAYOUT_API_KEY: Deno.env.get('CRYPTOMUS_PAYOUT_API_KEY') || '2nuhleS45ns1WTJDX1ZoRG8UAmDFDdahvMafGhU5knS5P3Ozn1Yx0tgRYCmjJpKvtNx0GVQ0FTLo0SNVw1ZM7Zy97fXSsbHX8SGbgGepEHCqwtxw3gIJ8LKDIMDJ3W4s',
  BASE_URL: 'https://api.cryptomus.com/v1',
  MERCHANT_UUID: Deno.env.get('CRYPTOMUS_MERCHANT_UUID') || '6e6c1018-48f4-49fd-a10d-36d6cd70eefe',
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Generate MD5 signature for Cryptomus API
async function generateSignature(data: Record<string, any>, apiKey: string): Promise<string> {
  const jsonString = JSON.stringify(data)
  const base64Data = btoa(jsonString)
  const message = base64Data + apiKey
  
  const encoder = new TextEncoder()
  const msgBuffer = encoder.encode(message)
  const hashBuffer = await crypto.subtle.digest('MD5', msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  
  return hashHex
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { order_id, seller_id, amount, currency = 'USD' } = await req.json()

    console.log('💰 Processing seller payout:', { order_id, seller_id, amount })

    if (!order_id || !seller_id || !amount) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: order_id, seller_id, amount',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get seller's crypto wallet info
    const { data: sellerProfile, error: profileError } = await supabase
      .from('seller_profiles')
      .select('crypto_wallet_address, crypto_wallet_network, crypto_wallet_verified')
      .eq('user_id', seller_id)
      .single()

    if (profileError) {
      console.error('Error fetching seller profile:', profileError)
      throw new Error('Seller profile not found')
    }

    // Calculate 90/10 split
    const sellerAmount = amount * 0.9
    const platformAmount = amount * 0.1

    console.log('💵 Split calculation:', {
      total: amount,
      seller: sellerAmount,
      platform: platformAmount,
      hasWallet: !!sellerProfile?.crypto_wallet_address
    })

    // If seller has a verified crypto wallet, send 90% to them
    if (sellerProfile?.crypto_wallet_address && sellerProfile?.crypto_wallet_verified) {
      console.log('📤 Sending payout to seller wallet:', sellerProfile.crypto_wallet_address)

      const payoutData = {
        amount: sellerAmount.toFixed(2),
        currency,
        network: sellerProfile.crypto_wallet_network || 'TRC20',
        address: sellerProfile.crypto_wallet_address,
        order_id: `payout-${order_id}`,
        is_subtract: '1', // Subtract fees from amount
      }

      const signature = await generateSignature(payoutData, CRYPTOMUS_CONFIG.PAYOUT_API_KEY)

      const response = await fetch(`${CRYPTOMUS_CONFIG.BASE_URL}/payout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'merchant': CRYPTOMUS_CONFIG.MERCHANT_UUID,
          'sign': signature,
        },
        body: JSON.stringify(payoutData),
      })

      const result = await response.json()

      console.log('📨 Cryptomus payout response:', result)

      if (response.ok && result.state === 0) {
        // Record successful payout
        await supabase.from('payouts').insert({
          order_id,
          seller_id,
          amount: sellerAmount,
          currency,
          wallet_address: sellerProfile.crypto_wallet_address,
          network: sellerProfile.crypto_wallet_network,
          status: 'completed',
          payout_id: result.result?.uuid,
          completed_at: new Date().toISOString(),
        })

        return new Response(
          JSON.stringify({
            success: true,
            seller_payout: sellerAmount,
            platform_fee: platformAmount,
            payout_id: result.result?.uuid,
            message: '90% sent to seller, 10% retained by platform',
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } else {
        console.error('❌ Cryptomus payout failed:', result)
        
        // Record failed payout
        await supabase.from('payouts').insert({
          order_id,
          seller_id,
          amount: sellerAmount,
          currency,
          wallet_address: sellerProfile.crypto_wallet_address,
          network: sellerProfile.crypto_wallet_network,
          status: 'failed',
          error_message: result.message || 'Payout failed',
        })

        throw new Error(result.message || 'Payout failed')
      }
    } else {
      // No wallet configured - 100% goes to platform
      console.log('⚠️ No wallet configured - 100% retained by platform')

      // Record pending payout (manual)
      await supabase.from('payouts').insert({
        order_id,
        seller_id,
        amount: amount, // Full amount pending
        currency,
        status: 'pending',
        notes: 'Seller has no crypto wallet configured. Manual payout required.',
      })

      return new Response(
        JSON.stringify({
          success: true,
          seller_payout: 0,
          platform_fee: amount,
          message: 'No wallet configured. 100% retained by platform. Seller must add wallet for automatic payouts.',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  } catch (error: any) {
    console.error('💥 Payout processing error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
