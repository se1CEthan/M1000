#!/bin/bash

# Fix Render 502 Deployment Issues
# Run this script to trigger a fresh deployment

echo "🚨 FIXING RENDER 502 ERROR"
echo "=========================="

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Not in a git repository. Please run from project root."
    exit 1
fi

# Check git status
echo "📋 Current git status:"
git status --porcelain

# Add all changes
echo "📦 Adding all changes..."
git add .

# Create a deployment fix commit
echo "💾 Creating deployment fix commit..."
git commit -m "🚨 Fix Render 502 error - redeploy with updated build config

- Updated render.yaml build command
- Added render-build.sh script
- Fixed PesaPal integration
- Resolved deployment issues"

# Push to trigger Render deployment
echo "🚀 Pushing to trigger Render deployment..."
git push origin main

echo ""
echo "✅ DEPLOYMENT FIX PUSHED!"
echo "========================="
echo ""
echo "🔍 Next steps:"
echo "1. Go to render.com dashboard"
echo "2. Check your seltech-marketplace service"
echo "3. Monitor the build logs"
echo "4. Wait for deployment to complete (2-5 minutes)"
echo ""
echo "🌐 Your site should be back online at:"
echo "   https://seltech.online"
echo ""
echo "📊 If still failing, check:"
echo "   - Render service logs"
echo "   - Environment variables"
echo "   - Build command errors"