#!/bin/bash

# Seltech Marketplace - Production Database Setup Script
# This script helps set up the Supabase database for production

set -e

echo "🚀 Setting up Seltech Marketplace Database for Production"
echo "=================================================="

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed. Please install it first:"
    echo "   npm install -g supabase"
    echo "   or visit: https://supabase.com/docs/guides/cli"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

echo "✅ Supabase CLI found"

# Login to Supabase (if not already logged in)
echo "🔐 Checking Supabase authentication..."
if ! supabase projects list &> /dev/null; then
    echo "Please log in to Supabase:"
    supabase login
fi

echo "✅ Authenticated with Supabase"

# Link to the project
echo "🔗 Linking to Supabase project..."
PROJECT_ID=$(grep 'project_id' supabase/config.toml | cut -d'"' -f2)

if [ -z "$PROJECT_ID" ]; then
    echo "❌ Project ID not found in supabase/config.toml"
    exit 1
fi

supabase link --project-ref $PROJECT_ID

echo "✅ Linked to project: $PROJECT_ID"

# Push database migrations
echo "📊 Applying database migrations..."
supabase db push

echo "✅ Database migrations applied successfully"

# Generate TypeScript types
echo "🔧 Generating TypeScript types..."
supabase gen types typescript --linked > src/integrations/supabase/types.ts

echo "✅ TypeScript types generated"

# Setup storage buckets (if not already created)
echo "📁 Setting up storage buckets..."
echo "Note: Storage buckets are created via the migration, but you may need to configure CORS policies manually in the Supabase dashboard."

echo ""
echo "🎉 Production database setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/$PROJECT_ID"
echo "2. Configure authentication providers (Google OAuth, etc.)"
echo "3. Set up storage CORS policies if needed"
echo "4. Create your first admin user by running:"
echo "   SELECT public.create_admin_user('your-email@example.com');"
echo "5. Configure your production environment variables"
echo ""
echo "🔧 Important production settings to review:"
echo "- Authentication settings and providers"
echo "- Storage bucket policies and CORS"
echo "- Rate limiting and security settings"
echo "- Email templates for auth flows"
echo ""
echo "📖 For more information, visit: https://supabase.com/docs"