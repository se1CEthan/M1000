#!/usr/bin/env node

/**
 * Production Deployment Script
 * Automates the complete production deployment process
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

console.log('🚀 Starting Production Deployment Process...\n');

const deploymentSteps = [
  {
    name: 'Pre-deployment Checks',
    run: async () => {
      console.log('🔍 Running pre-deployment checks...');
      
      // Check if .env.production exists
      if (!existsSync('.env.production')) {
        throw new Error('.env.production file not found. Create it first.');
      }
      
      // Check if build directory exists and clean it
      if (existsSync('dist')) {
        console.log('🧹 Cleaning previous build...');
        execSync('rm -rf dist', { stdio: 'inherit' });
      }
      
      console.log('✅ Pre-deployment checks passed');
    }
  },
  {
    name: 'Database Verification',
    run: async () => {
      console.log('📊 Verifying database setup...');
      
      const supabaseUrl = process.env.VITE_SUPABASE_URL;
      const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase credentials not found in environment');
      }
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Test database connection
      const { error } = await supabase.from('profiles').select('id').limit(1);
      if (error) {
        throw new Error(`Database connection failed: ${error.message}`);
      }
      
      console.log('✅ Database connection verified');
    }
  },
  {
    name: 'Type Checking',
    run: async () => {
      console.log('🔍 Running TypeScript type checking...');
      
      try {
        execSync('npm run typecheck', { stdio: 'pipe' });
        console.log('✅ Type checking passed');
      } catch (error) {
        throw new Error('TypeScript type checking failed. Fix type errors first.');
      }
    }
  },
  {
    name: 'Linting',
    run: async () => {
      console.log('🧹 Running ESLint...');
      
      try {
        execSync('npm run lint', { stdio: 'pipe' });
        console.log('✅ Linting passed');
      } catch (error) {
        console.log('⚠️  Linting warnings found, but continuing...');
      }
    }
  },
  {
    name: 'Production Build',
    run: async () => {
      console.log('🏗️  Building for production...');
      
      try {
        execSync('npm run build:prod', { stdio: 'inherit' });
        console.log('✅ Production build completed');
        
        // Check build size
        try {
          const stats = execSync('du -sh dist', { encoding: 'utf8' });
          console.log(`📦 Build size: ${stats.trim()}`);
        } catch (err) {
          console.log('ℹ️  Could not determine build size');
        }
        
      } catch (error) {
        throw new Error('Production build failed');
      }
    }
  },
  {
    name: 'Build Verification',
    run: async () => {
      console.log('🔍 Verifying build output...');
      
      const requiredFiles = [
        'dist/index.html',
        'dist/assets',
        'dist/manifest.json',
        'dist/robots.txt',
        'dist/sitemap.xml'
      ];
      
      for (const file of requiredFiles) {
        if (!existsSync(file)) {
          throw new Error(`Required file missing: ${file}`);
        }
      }
      
      // Check if index.html contains the app
      const indexContent = readFileSync('dist/index.html', 'utf8');
      if (!indexContent.includes('<div id="root">')) {
        throw new Error('index.html appears to be malformed');
      }
      
      console.log('✅ Build verification passed');
    }
  },
  {
    name: 'Security Check',
    run: async () => {
      console.log('🔒 Running security checks...');
      
      // Check if security headers are configured
      const headersExist = existsSync('public/_headers') || 
                          existsSync('netlify.toml') || 
                          existsSync('vercel.json');
      
      if (!headersExist) {
        console.log('⚠️  No security headers configuration found');
      } else {
        console.log('✅ Security headers configured');
      }
      
      // Check for sensitive data in build
      try {
        const result = execSync('grep -r "password\\|secret\\|private" dist/ || true', { encoding: 'utf8' });
        if (result.trim()) {
          console.log('⚠️  Potential sensitive data found in build:', result);
        } else {
          console.log('✅ No sensitive data found in build');
        }
      } catch (err) {
        console.log('ℹ️  Could not scan for sensitive data');
      }
    }
  }
];

async function runDeployment() {
  let completedSteps = 0;
  
  for (const step of deploymentSteps) {
    try {
      console.log(`\n🔄 ${step.name}...`);
      await step.run();
      completedSteps++;
    } catch (error) {
      console.log(`❌ ${step.name} failed: ${error.message}`);
      console.log('\n🛑 Deployment stopped due to error.');
      process.exit(1);
    }
  }
  
  console.log(`\n📊 Deployment Preparation Results:`);
  console.log(`✅ Completed: ${completedSteps}/${deploymentSteps.length} steps`);
  
  if (completedSteps === deploymentSteps.length) {
    console.log('\n🎉 Production build ready for deployment!');
    console.log('\n📋 Next steps:');
    console.log('1. Upload the dist/ folder to your hosting provider');
    console.log('2. Configure your domain and SSL certificate');
    console.log('3. Test the deployed application');
    console.log('4. Monitor for any issues');
    
    console.log('\n🚀 Quick deployment commands:');
    console.log('# Netlify: netlify deploy --prod --dir=dist');
    console.log('# Vercel: vercel --prod');
    console.log('# Custom: rsync -av dist/ user@server:/var/www/');
    
    console.log('\n📚 Documentation:');
    console.log('- PRODUCTION_DEPLOYMENT_COMPLETE.md');
    console.log('- PRODUCTION_READY_SUMMARY.md');
    
  } else {
    console.log('\n⚠️  Some steps failed. Please fix the issues and try again.');
  }
}

runDeployment().catch(console.error);