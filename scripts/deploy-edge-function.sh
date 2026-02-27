#!/bin/bash

# Deploy Cryptomus Payment Edge Function to Supabase

echo "🚀 Deploying Cryptomus Payment Edge Function..."
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

echo "📦 Deploying create-cryptomus-payment function (without JWT verification)..."
supabase functions deploy create-cryptomus-payment --no-verify-jwt

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Edge Function deployed successfully!"
    echo ""
    echo "📋 Function URL:"
    echo "   https://rtsaarapvlzzinmpjdys.supabase.co/functions/v1/create-cryptomus-payment"
    echo ""
    echo "🧪 Test it with:"
    echo "   curl -X POST https://rtsaarapvlzzinmpjdys.supabase.co/functions/v1/create-cryptomus-payment \\"
    echo "     -H 'Content-Type: application/json' \\"
    echo "     -d '{\"amount\":\"10\",\"currency\":\"USD\",\"order_id\":\"test-123\"}'"
    echo ""
else
    echo ""
    echo "❌ Deployment failed"
    echo ""
    echo "Troubleshooting:"
    echo "1. Make sure you're logged in: supabase login"
    echo "2. Link your project: supabase link --project-ref rtsaarapvlzzinmpjdys"
    echo "3. Try deploying again"
    echo ""
    exit 1
fi
