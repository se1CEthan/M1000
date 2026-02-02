#!/bin/bash

# Render Build Script for Seltech Marketplace
# Fixes 502 Bad Gateway errors

set -e  # Exit on any error

echo "🚀 Starting Render build process..."

# Check Node.js version
echo "📋 Node.js version: $(node --version)"
echo "📋 NPM version: $(npm --version)"

# Clean install dependencies
echo "📦 Installing dependencies..."
npm ci --production=false

# Check if build command exists
echo "🔍 Checking build configuration..."
if ! npm run build --dry-run > /dev/null 2>&1; then
    echo "❌ Build script not found in package.json"
    exit 1
fi

# Build the application
echo "🏗️ Building application..."
npm run build

# Verify dist folder was created
if [ ! -d "dist" ]; then
    echo "❌ Build failed - dist folder not created"
    exit 1
fi

# Check if index.html exists
if [ ! -f "dist/index.html" ]; then
    echo "❌ Build failed - index.html not found in dist"
    exit 1
fi

echo "✅ Build completed successfully!"
echo "📁 Dist folder size: $(du -sh dist | cut -f1)"
echo "📄 Files in dist: $(ls -la dist | wc -l) files"

# List key files for debugging
echo "🔍 Key files in dist:"
ls -la dist/ | head -10

echo "🎉 Render build process completed!"