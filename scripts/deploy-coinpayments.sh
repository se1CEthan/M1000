#!/bin/bash

echo "🚀 Deploying CoinPayments Integration..."

# Deploy edge functions
echo "📦 Deploying create-coinpayments-payment..."
supabase functions deploy create-coinpayments-payment --no-verify-jwt

echo "📦 Deploying coinpayments-webhook..."
supabase functions deploy coinpayments-webhook --no-verify-jwt

echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Run database migration if not already done"
echo "2. Configure IPN URL in CoinPayments dashboard:"
echo "   https://rtsaarapvlzzinmpjdys.supabase.co/functions/v1/coinpayments-webhook"
echo "3. Test payment flow"
