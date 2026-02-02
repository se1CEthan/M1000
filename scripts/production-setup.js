#!/usr/bin/env node

/**
 * Production Setup Script
 * Prepares the application for production deployment
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

console.log('🚀 Starting Production Setup...\n');

// Production setup tasks
const tasks = [
  {
    name: 'Database Setup',
    run: async () => {
      console.log('📊 Setting up production database...');
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Missing Supabase credentials');
      }

      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Test database connection
      const { data, error } = await supabase.from('profiles').select('id').limit(1);
      if (error) throw error;
      
      console.log('✅ Database connection verified');
      
      // Check required tables
      const requiredTables = [
        'profiles',
        'products', 
        'orders',
        'seller_verification_applications',
        'admin_activity_log',
        'notifications'
      ];
      
      for (const table of requiredTables) {
        try {
          const { error } = await supabase.from(table).select('id').limit(1);
          if (error && error.message.includes('does not exist')) {
            console.log(`⚠️  Table ${table} missing - needs migration`);
          } else {
            console.log(`✅ Table ${table} exists`);
          }
        } catch (err) {
          console.log(`❌ Error checking table ${table}: ${err.message}`);
        }
      }
    }
  },
  {
    name: 'Environment Configuration',
    run: async () => {
      console.log('⚙️  Configuring production environment...');
      
      // Check .env.production exists
      if (!existsSync('.env.production')) {
        console.log('📝 Creating .env.production template...');
        
        const prodEnv = `# Production Environment Variables
VITE_SUPABASE_URL=${supabaseUrl}
VITE_SUPABASE_PUBLISHABLE_KEY=${supabaseKey}
VITE_APP_NAME=Seltech
VITE_APP_URL=https://seltech.online
VITE_APP_DESCRIPTION=The premier marketplace for developer tools and digital assets
VITE_ENABLE_MAINTENANCE_MODE=false
VITE_ENABLE_REGISTRATION=true
VITE_ENABLE_SELLER_REGISTRATION=true
VITE_MAX_FILE_SIZE_MB=500
NODE_ENV=production
`;
        
        writeFileSync('.env.production', prodEnv);
        console.log('✅ .env.production created');
      } else {
        console.log('✅ .env.production exists');
      }
    }
  },
  {
    name: 'Build Optimization',
    run: async () => {
      console.log('🔧 Optimizing build configuration...');
      
      // Check if vite.config.ts has production optimizations
      const viteConfig = readFileSync('vite.config.ts', 'utf8');
      
      if (!viteConfig.includes('build: {')) {
        console.log('⚠️  Vite config needs production optimizations');
      } else {
        console.log('✅ Vite config has build optimizations');
      }
      
      // Check package.json scripts
      const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
      
      if (!packageJson.scripts['build:prod']) {
        console.log('📝 Adding production build script...');
        packageJson.scripts['build:prod'] = 'NODE_ENV=production vite build --mode production';
        packageJson.scripts['preview:prod'] = 'vite preview --mode production';
        writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
        console.log('✅ Production scripts added');
      } else {
        console.log('✅ Production scripts exist');
      }
    }
  },
  {
    name: 'Security Headers',
    run: async () => {
      console.log('🔒 Setting up security headers...');
      
      // Check if security headers are configured
      const files = ['netlify.toml', 'vercel.json', '_headers'];
      let hasSecurityConfig = false;
      
      for (const file of files) {
        if (existsSync(file)) {
          const content = readFileSync(file, 'utf8');
          if (content.includes('X-Frame-Options') || content.includes('Content-Security-Policy')) {
            hasSecurityConfig = true;
            console.log(`✅ Security headers found in ${file}`);
            break;
          }
        }
      }
      
      if (!hasSecurityConfig) {
        console.log('📝 Creating security headers configuration...');
        
        const headersConfig = `/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Strict-Transport-Security: max-age=31536000; includeSubDomains
`;
        
        writeFileSync('public/_headers', headersConfig);
        console.log('✅ Security headers configuration created');
      }
    }
  },
  {
    name: 'Performance Optimization',
    run: async () => {
      console.log('⚡ Checking performance optimizations...');
      
      // Check for lazy loading
      const appFile = readFileSync('src/App.tsx', 'utf8');
      if (appFile.includes('React.lazy') || appFile.includes('lazy(')) {
        console.log('✅ Lazy loading implemented');
      } else {
        console.log('⚠️  Consider implementing lazy loading for routes');
      }
      
      // Check for image optimization
      const hasImageOptimization = existsSync('public/images') || 
                                   appFile.includes('loading="lazy"');
      
      if (hasImageOptimization) {
        console.log('✅ Image optimization configured');
      } else {
        console.log('⚠️  Consider implementing image optimization');
      }
    }
  },
  {
    name: 'SEO Configuration',
    run: async () => {
      console.log('🔍 Setting up SEO configuration...');
      
      const indexHtml = readFileSync('index.html', 'utf8');
      
      const seoChecks = [
        { check: 'meta name="description"', name: 'Meta description' },
        { check: 'meta property="og:', name: 'Open Graph tags' },
        { check: 'meta name="twitter:', name: 'Twitter cards' },
        { check: 'link rel="canonical"', name: 'Canonical URL' }
      ];
      
      for (const { check, name } of seoChecks) {
        if (indexHtml.includes(check)) {
          console.log(`✅ ${name} configured`);
        } else {
          console.log(`⚠️  ${name} missing`);
        }
      }
    }
  },
  {
    name: 'Production Build Test',
    run: async () => {
      console.log('🏗️  Testing production build...');
      
      try {
        console.log('Building for production...');
        execSync('npm run build', { stdio: 'pipe' });
        console.log('✅ Production build successful');
        
        // Check build size
        try {
          const stats = execSync('du -sh dist', { encoding: 'utf8' });
          console.log(`📦 Build size: ${stats.trim()}`);
        } catch (err) {
          console.log('ℹ️  Could not determine build size');
        }
        
      } catch (error) {
        console.log('❌ Production build failed');
        console.log(error.message);
      }
    }
  }
];

// Run all tasks
async function runProductionSetup() {
  let completedTasks = 0;
  
  for (const task of tasks) {
    try {
      console.log(`\n🔄 Running: ${task.name}`);
      await task.run();
      completedTasks++;
    } catch (error) {
      console.log(`❌ ${task.name} failed: ${error.message}`);
    }
  }
  
  console.log(`\n📊 Production Setup Results:`);
  console.log(`✅ Completed: ${completedTasks}/${tasks.length} tasks`);
  
  if (completedTasks === tasks.length) {
    console.log('\n🎉 Production setup complete!');
    console.log('\n📋 Next steps:');
    console.log('1. Run missing database migrations if any');
    console.log('2. Configure your production domain');
    console.log('3. Set up SSL certificates');
    console.log('4. Deploy to your hosting platform');
    console.log('5. Run final production tests');
  } else {
    console.log('\n⚠️  Some tasks need attention. Review the output above.');
  }
  
  console.log('\n📚 Documentation:');
  console.log('- PRODUCTION_DEPLOYMENT_GUIDE.md');
  console.log('- ADMIN_DASHBOARD_FINAL_SETUP.md');
  console.log('- PRODUCTION_READY_CHECKLIST.md');
}

runProductionSetup().catch(console.error);