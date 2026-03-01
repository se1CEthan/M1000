#!/bin/bash

# 🚀 Deploy Cryptomus Edge Functions to Supabase
# This script deploys both the payment creation and webhook handler functions

set -e

echo "🚀 Deploying Cryptomus Edge Functions..."
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

echo "✅ Supabase CLI found"
echo ""

# Deploy create-cryptomus-payment function
echo "📦 Deploying create-cryptomus-payment function..."
supabase functions deploy create-cryptomus-payment --no-verify-jwt

if [ $? -eq 0 ]; then
    echo "✅ create-cryptomus-payment deployed successfully"
else
    echo "❌ Failed to deploy create-cryptomus-payment"
    exit 1
fi

echo ""

# Deploy cryptomus-webhook function
echo "📦 Deploying cryptomus-webhook function..."
supabase functions deploy cryptomus-webhook --no-verify-jwt

if [ $? -eq 0 ]; then
    echo "✅ cryptomus-webhook deployed successfully"
else
    echo "❌ Failed to deploy cryptomus-webhook"
    exit 1
fi

echo ""
echo "🎉 All Cryptomus functions deployed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Configure webhook URL in Cryptomus dashboard:"
echo "   https://your-project.supabase.co/functions/v1/cryptomus-webhook"
echo ""
echo "2. Test the payment flow:"
echo "   - Go to any product page"
echo "   - Click 'Buy Now'"
echo "   - Complete payment on Cryptomus"
echo "   - Check webhook logs: supabase functions logs cryptomus-webhook"
echo ""
echo "3. Monitor logs:"
echo "   supabase functions logs create-cryptomus-payment"
echo "   supabase functions logs cryptomus-webhook"
echo ""
