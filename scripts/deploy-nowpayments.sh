#!/bin/bash

echo "🚀 Deploying NowPayments Integration..."

# Deploy edge functions
echo "📦 Deploying create-nowpayments-payment..."
supabase functions deploy create-nowpayments-payment --no-verify-jwt

echo "📦 Deploying nowpayments-webhook..."
supabase functions deploy nowpayments-webhook --no-verify-jwt

echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Run database migration: supabase/migrations/add_nowpayments_support.sql"
echo "2. Configure webhook URL in NowPayments dashboard"
echo "3. Test payment flow"
