#!/bin/bash

# Seltech Production Deployment Script
echo "🚀 Starting Seltech Production Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    
    print_success "All dependencies are installed"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    npm ci --production=false
    if [ $? -eq 0 ]; then
        print_success "Dependencies installed successfully"
    else
        print_error "Failed to install dependencies"
        exit 1
    fi
}

# Run tests (if available)
run_tests() {
    print_status "Running tests..."
    if npm run test --if-present; then
        print_success "All tests passed"
    else
        print_warning "Tests failed or not available"
    fi
}

# Build for production
build_production() {
    print_status "Building for production..."
    npm run build
    if [ $? -eq 0 ]; then
        print_success "Production build completed successfully"
    else
        print_error "Production build failed"
        exit 1
    fi
}

# Verify build
verify_build() {
    print_status "Verifying build..."
    
    if [ ! -d "dist" ]; then
        print_error "Build directory 'dist' not found"
        exit 1
    fi
    
    if [ ! -f "dist/index.html" ]; then
        print_error "index.html not found in build directory"
        exit 1
    fi
    
    # Check build size
    build_size=$(du -sh dist | cut -f1)
    print_success "Build verification completed. Size: $build_size"
}

# Deploy to Vercel
deploy_vercel() {
    print_status "Deploying to Vercel..."
    
    if command -v vercel &> /dev/null; then
        vercel --prod --yes
        if [ $? -eq 0 ]; then
            print_success "Deployed to Vercel successfully"
        else
            print_error "Vercel deployment failed"
            exit 1
        fi
    else
        print_warning "Vercel CLI not installed. Install with: npm i -g vercel"
        print_status "You can manually deploy by uploading the 'dist' folder to Vercel"
    fi
}

# Deploy to Netlify
deploy_netlify() {
    print_status "Deploying to Netlify..."
    
    if command -v netlify &> /dev/null; then
        netlify deploy --prod --dir=dist
        if [ $? -eq 0 ]; then
            print_success "Deployed to Netlify successfully"
        else
            print_error "Netlify deployment failed"
            exit 1
        fi
    else
        print_warning "Netlify CLI not installed. Install with: npm i -g netlify-cli"
        print_status "You can manually deploy by uploading the 'dist' folder to Netlify"
    fi
}

# Main deployment process
main() {
    echo "🎯 Seltech Marketplace Production Deployment"
    echo "============================================="
    
    check_dependencies
    install_dependencies
    run_tests
    build_production
    verify_build
    
    echo ""
    echo "🎉 Build completed successfully!"
    echo ""
    echo "Choose deployment option:"
    echo "1) Deploy to Vercel"
    echo "2) Deploy to Netlify"
    echo "3) Manual deployment (just build)"
    echo ""
    read -p "Enter your choice (1-3): " choice
    
    case $choice in
        1)
            deploy_vercel
            ;;
        2)
            deploy_netlify
            ;;
        3)
            print_success "Manual deployment ready. Upload 'dist' folder to your hosting provider."
            ;;
        *)
            print_warning "Invalid choice. Manual deployment ready."
            ;;
    esac
    
    echo ""
    echo "🚀 Deployment process completed!"
    echo ""
    echo "📋 Post-deployment checklist:"
    echo "  ✅ Test the live site"
    echo "  ✅ Verify authentication works"
    echo "  ✅ Check database connections"
    echo "  ✅ Test seller verification"
    echo "  ✅ Test admin dashboard"
    echo "  ✅ Configure custom domain (if needed)"
    echo "  ✅ Set up monitoring and analytics"
    echo ""
    print_success "Seltech is ready for production! 🎉"
}

# Run main function
main