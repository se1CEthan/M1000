#!/bin/bash

# Deploy All Cryptomus Edge Functions
# This script deploys all edge functions needed for the crypto payout system

echo "🚀 Deploying All Cryptomus Edge Functions..."
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed"
    echo ""
    echo "Install it with:"
    echo "  npm install -g supabase"
    echo ""
    exit 1
fi

# Check if logged in
if ! supabase projects list &> /dev/null; then
    echo "❌ Not logged in to Supabase"
    echo ""
    echo "Login with:"
    echo "  supabase login"
    echo ""
    exit 1
fi

echo "📦 Deploying functions..."
echo ""

# Deploy create-cryptomus-payment (no JWT verification - public endpoint)
echo "1️⃣  Deploying create-cryptomus-payment..."
supabase functions deploy create-cryptomus-payment --no-verify-jwt
if [ $? -ne 0 ]; then
    echo "❌ Failed to deploy create-cryptomus-payment"
    exit 1
fi
echo "✅ create-cryptomus-payment deployed"
echo ""

# Deploy cryptomus-webhook (no JWT verification - webhook endpoint)
echo "2️⃣  Deploying cryptomus-webhook..."
supabase functions deploy cryptomus-webhook --no-verify-jwt
if [ $? -ne 0 ]; then
    echo "❌ Failed to deploy cryptomus-webhook"
    exit 1
fi
echo "✅ cryptomus-webhook deployed"
echo ""

# Deploy process-seller-payout (requires JWT - internal use)
echo "3️⃣  Deploying process-seller-payout..."
supabase functions deploy process-seller-payout
if [ $? -ne 0 ]; then
    echo "❌ Failed to deploy process-seller-payout"
    exit 1
fi
echo "✅ process-seller-payout deployed"
echo ""

echo "🎉 All functions deployed successfully!"
echo ""
echo "📋 Function URLs:"
echo "   Payment:  https://rtsaarapvlzzinmpjdys.supabase.co/functions/v1/create-cryptomus-payment"
echo "   Webhook:  https://rtsaarapvlzzinmpjdys.supabase.co/functions/v1/cryptomus-webhook"
echo "   Payout:   https://rtsaarapvlzzinmpjdys.supabase.co/functions/v1/process-seller-payout"
echo ""
echo "⚙️  Next Steps:"
echo "   1. Configure Cryptomus webhook URL in dashboard"
echo "   2. Run database migrations"
echo "   3. Test payment flow"
echo ""
