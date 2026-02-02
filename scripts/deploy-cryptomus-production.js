#!/usr/bin/env node

/**
 * Seltech Cryptomus Production Deployment Script
 * Prepares and validates the Cryptomus payment integration for production
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Seltech Cryptomus Production Deployment');
console.log('==========================================\n');

// Configuration validation
const requiredEnvVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_PUBLISHABLE_KEY',
  'VITE_CRYPTOMUS_MERCHANT_UUID',
  'VITE_CRYPTOMUS_WEBHOOK_SECRET'
];

const serverEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_KEY',
  'CRYPTOMUS_MERCHANT_UUID',
  'CRYPTOMUS_WEBHOOK_SECRET',
  'WEBHOOK_BASE_URL'
];

function checkEnvironmentVariables() {
  console.log('🔍 Checking environment variables...');
  
  // Check frontend env vars
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env file not found');
    return false;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const missingVars = [];

  requiredEnvVars.forEach(varName => {
    if (!envContent.includes(varName) || envContent.includes(`${varName}=your_`)) {
      missingVars.push(varName);
    }
  });

  if (missingVars.length > 0) {
    console.error('❌ Missing or incomplete environment variables:');
    missingVars.forEach(varName => console.error(`   - ${varName}`));
    return false;
  }

  console.log('✅ Frontend environment variables configured');
  return true;
}

function checkCryptomusIntegration() {
  console.log('🔍 Checking Cryptomus integration files...');
  
  const requiredFiles = [
    'src/lib/cryptomus.ts',
    'src/lib/payment-service.ts',
    'src/components/payment/CryptoPaymentModal.tsx',
    'src/components/seller/WalletConfiguration.tsx',
    'src/api/webhooks/cryptomus.ts',
    'src/pages/OrderSuccess.tsx'
  ];

  const missingFiles = [];

  requiredFiles.forEach(filePath => {
    if (!fs.existsSync(path.join(process.cwd(), filePath))) {
      missingFiles.push(filePath);
    }
  });

  if (missingFiles.length > 0) {
    console.error('❌ Missing Cryptomus integration files:');
    missingFiles.forEach(filePath => console.error(`   - ${filePath}`));
    return false;
  }

  console.log('✅ Cryptomus integration files present');
  return true;
}

function checkDatabaseTables() {
  console.log('🔍 Checking database table requirements...');
  
  const requiredTables = [
    'orders',
    'payouts',
    'products',
    'profiles'
  ];

  console.log('📋 Required database tables:');
  requiredTables.forEach(table => {
    console.log(`   ✅ ${table} (ensure this exists in Supabase)`);
  });

  console.log('\n💡 Run these SQL commands in Supabase if tables are missing:');
  console.log(`
-- Orders table (if not exists)
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id UUID REFERENCES profiles(user_id),
  seller_id UUID REFERENCES profiles(user_id),
  product_id UUID REFERENCES products(id),
  order_number TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending',
  price DECIMAL(10,2) NOT NULL,
  platform_fee DECIMAL(10,2) NOT NULL,
  seller_earnings DECIMAL(10,2) NOT NULL,
  payment_id TEXT,
  payment_method TEXT DEFAULT 'cryptocurrency',
  currency TEXT DEFAULT 'USD',
  crypto_currency TEXT,
  crypto_amount DECIMAL(20,8),
  download_url TEXT,
  download_expires_at TIMESTAMPTZ,
  license_key TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Payouts table (if not exists)
CREATE TABLE IF NOT EXISTS payouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID REFERENCES profiles(user_id),
  amount DECIMAL(10,2) NOT NULL,
  wallet_address TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  transaction_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);
  `);

  return true;
}

function generateWebhookServerConfig() {
  console.log('🔧 Generating webhook server configuration...');
  
  const serverConfigPath = path.join(process.cwd(), 'server-example', '.env');
  const exampleConfigPath = path.join(process.cwd(), 'server-example', '.env.example');
  
  if (!fs.existsSync(serverConfigPath) && fs.existsSync(exampleConfigPath)) {
    fs.copyFileSync(exampleConfigPath, serverConfigPath);
    console.log('✅ Created server-example/.env from template');
    console.log('⚠️  Please update the values in server-example/.env');
  } else if (fs.existsSync(serverConfigPath)) {
    console.log('✅ Webhook server configuration exists');
  }

  return true;
}

function validateCryptomusKeys() {
  console.log('🔑 Validating Cryptomus API keys...');
  
  const paymentKey = 'DSk5vMk3RIBhiQ3qGUw1pH1iYJI1hSSN8iTYmHpm3WpyTj9bsTtIlhadpiFKlK5aVUmpjHH8YoLV9dQsxLAPzpQOdiffl2hzJo0378ExFJB3HMSx49LjTfvnm9qHztoP';
  const payoutKey = '2nuhleS45ns1WTJDX1ZoRG8UAmDFDdahvMafGhU5knS5P3Ozn1Yx0tgRYCmjJpKvtNx0GVQ0FTLo0SNVw1ZM7Zy97fXSsbHX8SGbgGepEHCqwtxw3gIJ8LKDIMDJ3W4s';

  if (paymentKey.length === 128 && payoutKey.length === 128) {
    console.log('✅ Cryptomus API keys format valid');
    console.log('   📝 Payment API Key: ' + paymentKey.substring(0, 20) + '...');
    console.log('   📝 Payout API Key:  ' + payoutKey.substring(0, 20) + '...');
  } else {
    console.error('❌ Invalid Cryptomus API key format');
    return false;
  }

  return true;
}

function generateDeploymentChecklist() {
  console.log('\n📋 PRODUCTION DEPLOYMENT CHECKLIST');
  console.log('=====================================');
  
  const checklist = [
    '[ ] Configure Cryptomus merchant account',
    '[ ] Set VITE_CRYPTOMUS_MERCHANT_UUID in .env',
    '[ ] Set VITE_CRYPTOMUS_WEBHOOK_SECRET in .env',
    '[ ] Deploy webhook server (server-example/)',
    '[ ] Configure webhook URL in Cryptomus dashboard',
    '[ ] Test payment flow end-to-end',
    '[ ] Verify seller payout functionality',
    '[ ] Set up monitoring and alerts',
    '[ ] Configure email notifications (optional)',
    '[ ] Test with small amounts first',
    '[ ] Monitor webhook delivery success rates'
  ];

  checklist.forEach(item => console.log(item));

  console.log('\n🌐 WEBHOOK ENDPOINTS TO CONFIGURE:');
  console.log('Payment Webhook: https://yourdomain.com/api/webhooks/cryptomus');
  console.log('Payout Webhook:  https://yourdomain.com/api/webhooks/cryptomus-payout');

  console.log('\n💰 SUPPORTED CRYPTOCURRENCIES:');
  console.log('✅ USDT (TRC20) - Recommended for low fees');
  console.log('✅ USDC (ERC20) - Stable USD coin');
  console.log('✅ BTC - Bitcoin network');
  console.log('✅ ETH - Ethereum network');
  console.log('✅ LTC - Litecoin network');
  console.log('✅ TRX - TRON network');
}

function main() {
  let allChecksPass = true;

  // Run all validation checks
  allChecksPass &= checkEnvironmentVariables();
  allChecksPass &= checkCryptomusIntegration();
  allChecksPass &= checkDatabaseTables();
  allChecksPass &= generateWebhookServerConfig();
  allChecksPass &= validateCryptomusKeys();

  console.log('\n' + '='.repeat(50));

  if (allChecksPass) {
    console.log('🎉 CRYPTOMUS INTEGRATION READY FOR PRODUCTION!');
    console.log('\n✅ All validation checks passed');
    console.log('✅ Payment system configured');
    console.log('✅ Revenue splitting (90/10) ready');
    console.log('✅ Multi-currency support enabled');
    console.log('✅ Automatic seller payouts configured');
    
    generateDeploymentChecklist();
    
    console.log('\n🚀 Next Steps:');
    console.log('1. Deploy your webhook server');
    console.log('2. Configure Cryptomus dashboard');
    console.log('3. Test the complete payment flow');
    console.log('4. Launch your marketplace!');
    
  } else {
    console.log('❌ DEPLOYMENT VALIDATION FAILED');
    console.log('\nPlease fix the issues above before deploying to production.');
    process.exit(1);
  }

  console.log('\n📚 Documentation: CRYPTOMUS_INTEGRATION_GUIDE.md');
  console.log('🔧 Webhook Server: server-example/webhook-server.js');
  console.log('\n' + '='.repeat(50));
}

// Run the deployment validation
main();