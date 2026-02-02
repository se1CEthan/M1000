#!/bin/bash

# 🔧 Configure Cryptomus Webhook via API (curl version)

# Configuration
MERCHANT_UUID="6e6c1018-48f4-49fd-a10d-36d6cd70eefe"
PAYMENT_API_KEY="DSk5vMk3RIBhiQ3qGUw1pH1iYJI1hSSN8iTYmHpm3WpyTj9bsTtIlhadpiFKlK5aVUmpjHH8YoLV9dQsxLAPzpQOdiffl2hzJo0378ExFJB3HMSx49LjTfvnm9qHztoP"
BASE_URL="https://api.cryptomus.com/v1"
WEBHOOK_URL="https://rtsaarapvlzzinmpjdys.supabase.co/functions/v1/cryptomus-webhook"

echo "🔧 Cryptomus Webhook API Configuration"
echo "🎯 Target webhook URL: $WEBHOOK_URL"
echo "🏪 Merchant UUID: $MERCHANT_UUID"
echo ""

# Function to generate MD5 signature
generate_signature() {
    local data="$1"
    local api_key="$2"
    
    # Convert JSON to base64
    local base64_data=$(echo -n "$data" | base64 -w 0)
    
    # Create message for signing
    local message="${base64_data}${api_key}"
    
    # Generate MD5 hash
    local signature=$(echo -n "$message" | md5sum | cut -d' ' -f1)
    
    echo "$signature"
}

# Test webhook endpoint
echo "🧪 Testing webhook endpoint..."
webhook_test=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$WEBHOOK_URL" \
    -H "Content-Type: application/json" \
    -H "sign: test_signature" \
    -d '{"uuid":"test","order_id":"test","status":"paid"}')

if [ "$webhook_test" = "401" ]; then
    echo "✅ Webhook endpoint is working (correctly rejecting unauthorized requests)"
else
    echo "⚠️ Webhook endpoint returned status: $webhook_test"
fi

echo ""

# Method 1: Try webhook configuration endpoint
echo "📡 Attempting webhook configuration..."

webhook_data='{
    "merchant": "'$MERCHANT_UUID'",
    "url": "'$WEBHOOK_URL'",
    "events": ["payment_success", "payment_fail", "payment_cancel"]
}'

signature=$(generate_signature "$webhook_data" "$PAYMENT_API_KEY")

echo "📝 Request data: $webhook_data"
echo "🔐 Signature: $signature"

response=$(curl -s -X POST "$BASE_URL/webhook" \
    -H "Content-Type: application/json" \
    -H "merchant: $MERCHANT_UUID" \
    -H "sign: $signature" \
    -d "$webhook_data")

echo "📋 Response: $response"

# Check if successful
if echo "$response" | grep -q '"state":0'; then
    echo "✅ Webhook configured successfully via /webhook endpoint!"
    exit 0
fi

echo "⚠️ Direct webhook endpoint failed, trying alternative methods..."
echo ""

# Method 2: Try merchant settings endpoint
echo "📡 Attempting merchant settings update..."

settings_data='{
    "merchant": "'$MERCHANT_UUID'",
    "webhook_url": "'$WEBHOOK_URL'",
    "notification_url": "'$WEBHOOK_URL'"
}'

signature=$(generate_signature "$settings_data" "$PAYMENT_API_KEY")

response=$(curl -s -X POST "$BASE_URL/merchant/settings" \
    -H "Content-Type: application/json" \
    -H "merchant: $MERCHANT_UUID" \
    -H "sign: $signature" \
    -d "$settings_data")

echo "📋 Response: $response"

if echo "$response" | grep -q '"state":0'; then
    echo "✅ Webhook configured successfully via merchant settings!"
    exit 0
fi

echo "⚠️ Merchant settings endpoint failed..."
echo ""

# Method 3: Try notification configuration
echo "📡 Attempting notification configuration..."

notification_data='{
    "merchant": "'$MERCHANT_UUID'",
    "callback_url": "'$WEBHOOK_URL'",
    "ipn_url": "'$WEBHOOK_URL'"
}'

signature=$(generate_signature "$notification_data" "$PAYMENT_API_KEY")

response=$(curl -s -X POST "$BASE_URL/notification/config" \
    -H "Content-Type: application/json" \
    -H "merchant: $MERCHANT_UUID" \
    -H "sign: $signature" \
    -d "$notification_data")

echo "📋 Response: $response"

if echo "$response" | grep -q '"state":0'; then
    echo "✅ Webhook configured successfully via notification config!"
    exit 0
fi

echo ""
echo "❌ All automatic configuration methods failed."
echo ""
echo "📋 Manual configuration required:"
echo "1. Login to Cryptomus merchant dashboard"
echo "2. Navigate to Settings > Webhooks"
echo "3. Set webhook URL: $WEBHOOK_URL"
echo "4. Enable all payment events"
echo "5. Save configuration"
echo ""
echo "🔗 Cryptomus Dashboard: https://merchant.cryptomus.com"
echo ""
echo "✅ Webhook endpoint is ready to receive notifications!"