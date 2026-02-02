#!/usr/bin/env node

/**
 * Debug Environment Variables Script
 * Check what environment variables are available
 */

import dotenv from 'dotenv';

// Load environment variables from .env files
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.production' });

console.log('🔍 Environment Variables Debug');
console.log('==============================\n');

// Check Node environment
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('VITE_NODE_ENV:', process.env.VITE_NODE_ENV);
console.log('VITE_MODE:', process.env.VITE_MODE);

// Check Supabase variables
console.log('\n📡 Supabase Configuration:');
console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing');
console.log('VITE_SUPABASE_PUBLISHABLE_KEY:', process.env.VITE_SUPABASE_PUBLISHABLE_KEY ? '✅ Set' : '❌ Missing');

if (process.env.VITE_SUPABASE_URL) {
  console.log('URL Value:', process.env.VITE_SUPABASE_URL);
}

if (process.env.VITE_SUPABASE_PUBLISHABLE_KEY) {
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  console.log('Key Length:', key.length);
  console.log('Key Preview:', key.substring(0, 50) + '...');
  
  // Check if it's a valid JWT format
  const parts = key.split('.');
  console.log('JWT Parts:', parts.length, '(should be 3)');
  
  if (parts.length === 3) {
    try {
      const header = JSON.parse(atob(parts[0]));
      const payload = JSON.parse(atob(parts[1]));
      console.log('JWT Header:', header);
      console.log('JWT Payload Role:', payload.role);
      console.log('JWT Payload Ref:', payload.ref);
    } catch (e) {
      console.log('❌ Invalid JWT format:', e.message);
    }
  }
}

// Check app configuration
console.log('\n🚀 App Configuration:');
console.log('VITE_APP_NAME:', process.env.VITE_APP_NAME);
console.log('VITE_APP_URL:', process.env.VITE_APP_URL);

// Check all VITE_ variables
console.log('\n🔧 All VITE_ Variables:');
Object.keys(process.env)
  .filter(key => key.startsWith('VITE_'))
  .sort()
  .forEach(key => {
    const value = process.env[key];
    console.log(`${key}: ${value ? (value.length > 50 ? value.substring(0, 50) + '...' : value) : 'undefined'}`);
  });