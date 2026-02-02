#!/bin/bash

# 🚀 Deploy Supabase Edge Functions for Cryptomus Integration
echo "🚀 Deploying Supabase Edge Functions..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Installing..."
    npm install -g supabase
fi

# Login to Supabase (if not already logged in)
echo "🔐 Checking Supabase authentication..."
supabase projects list > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "Please login to Supabase:"
    supabase login
fi

# Link to project
echo "🔗 Linking to Supabase project..."
supabase link --project-ref rtsaarapvlzzinmpjdys

# Deploy functions
echo "📦 Deploying create-payment function..."
supabase functions deploy create-payment

echo "📦 Deploying cryptomus-webhook function..."
supabase functions deploy cryptomus-webhook

# Set environment variables
echo "🔧 Setting environment variables..."
echo "Please set your Supabase Service Role Key:"
echo "Get it from: https://supabase.com/dashboard/project/rtsaarapvlzzinmpjdys/settings/api"
read -p "Enter Service Role Key: " SERVICE_ROLE_KEY

supabase secrets set SUPABASE_SERVICE_ROLE_KEY="$SERVICE_ROLE_KEY"

echo "✅ Deployment complete!"
echo ""
echo "🎯 Your function URLs:"
echo "Payment: https://rtsaarapvlzzinmpjdys.supabase.co/functions/v1/create-payment"
echo "Webhook: https://rtsaarapvlzzinmpjdys.supabase.co/functions/v1/cryptomus-webhook"
echo ""
echo "📋 Next steps:"
echo "1. Configure Cryptomus webhook URL: https://rtsaarapvlzzinmpjdys.supabase.co/functions/v1/cryptomus-webhook"
echo "2. Deploy frontend to Render"
echo "3. Test payment flow"
echo ""
echo "🧪 Test payment function:"
echo 'curl -X POST "https://rtsaarapvlzzinmpjdys.supabase.co/functions/v1/create-payment" \'
echo '  -H "Authorization: Bearer YOUR_ANON_KEY" \'
echo '  -H "Content-Type: application/json" \'
echo '  -d '"'"'{"productId":"test","buyerId":"test","currency":"USDT"}'"'"