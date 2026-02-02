#!/usr/bin/env node

/**
 * Seltech Production Readiness Checker
 * Verifies all systems are ready for production deployment
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFile(filePath, description) {
  const exists = fs.existsSync(filePath);
  log(`${exists ? '✅' : '❌'} ${description}: ${filePath}`, exists ? 'green' : 'red');
  return exists;
}

function checkEnvVar(varName, description) {
  const value = process.env[varName];
  const exists = !!value;
  log(`${exists ? '✅' : '❌'} ${description}: ${varName}`, exists ? 'green' : 'red');
  if (exists && varName.includes('KEY')) {
    log(`    Value: ${value.substring(0, 10)}...`, 'cyan');
  } else if (exists) {
    log(`    Value: ${value}`, 'cyan');
  }
  return exists;
}

function checkPackageJson() {
  log('\n📦 Checking package.json...', 'blue');
  
  if (!fs.existsSync('package.json')) {
    log('❌ package.json not found', 'red');
    return false;
  }
  
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  const requiredScripts = ['build', 'dev', 'preview'];
  let allScriptsExist = true;
  
  requiredScripts.forEach(script => {
    const exists = pkg.scripts && pkg.scripts[script];
    log(`${exists ? '✅' : '❌'} Script "${script}" exists`, exists ? 'green' : 'red');
    if (!exists) allScriptsExist = false;
  });
  
  return allScriptsExist;
}

function checkEnvironmentFiles() {
  log('\n🔧 Checking environment configuration...', 'blue');
  
  let allGood = true;
  
  // Check .env files
  allGood &= checkFile('.env', 'Development environment file');
  allGood &= checkFile('.env.production', 'Production environment file');
  
  // Load and check environment variables
  if (fs.existsSync('.env')) {
    const envContent = fs.readFileSync('.env', 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        envVars[key.trim()] = value.trim();
      }
    });
    
    // Check required environment variables
    const requiredVars = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY'
    ];
    
    requiredVars.forEach(varName => {
      const exists = !!envVars[varName];
      log(`${exists ? '✅' : '❌'} ${varName}`, exists ? 'green' : 'red');
      if (!exists) allGood = false;
    });
  }
  
  return allGood;
}

function checkProjectStructure() {
  log('\n📁 Checking project structure...', 'blue');
  
  const requiredFiles = [
    'src/main.tsx',
    'src/App.tsx',
    'index.html',
    'vite.config.ts',
    'tailwind.config.ts',
    'tsconfig.json'
  ];
  
  const requiredDirs = [
    'src/components',
    'src/pages',
    'src/hooks',
    'src/lib',
    'src/types',
    'supabase/migrations'
  ];
  
  let allGood = true;
  
  requiredFiles.forEach(file => {
    allGood &= checkFile(file, 'Required file');
  });
  
  requiredDirs.forEach(dir => {
    const exists = fs.existsSync(dir) && fs.statSync(dir).isDirectory();
    log(`${exists ? '✅' : '❌'} Required directory: ${dir}`, exists ? 'green' : 'red');
    if (!exists) allGood = false;
  });
  
  return allGood;
}

function checkDeploymentFiles() {
  log('\n🚀 Checking deployment configuration...', 'blue');
  
  let allGood = true;
  
  // Check deployment config files
  const deploymentFiles = [
    { file: 'vercel.json', desc: 'Vercel deployment config' },
    { file: 'netlify.toml', desc: 'Netlify deployment config' }
  ];
  
  deploymentFiles.forEach(({ file, desc }) => {
    checkFile(file, desc);
  });
  
  return allGood;
}

function checkDatabaseMigrations() {
  log('\n🗄️ Checking database migrations...', 'blue');
  
  const migrationsDir = 'supabase/migrations';
  
  if (!fs.existsSync(migrationsDir)) {
    log('❌ Migrations directory not found', 'red');
    return false;
  }
  
  const migrations = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();
  
  log(`✅ Found ${migrations.length} migration files`, 'green');
  
  const requiredMigrations = [
    'production_setup',
    'seller_verification'
  ];
  
  let allRequired = true;
  requiredMigrations.forEach(required => {
    const found = migrations.some(migration => migration.includes(required));
    log(`${found ? '✅' : '❌'} Migration: ${required}`, found ? 'green' : 'red');
    if (!found) allRequired = false;
  });
  
  return allRequired;
}

function checkBuildOutput() {
  log('\n🏗️ Checking build output...', 'blue');
  
  const distExists = fs.existsSync('dist');
  
  if (!distExists) {
    log('⚠️ Build output not found. Run "npm run build" first', 'yellow');
    return false;
  }
  
  const requiredBuildFiles = [
    'dist/index.html',
    'dist/assets'
  ];
  
  let allGood = true;
  requiredBuildFiles.forEach(file => {
    allGood &= checkFile(file, 'Build output');
  });
  
  if (allGood) {
    // Check build size
    const stats = fs.statSync('dist');
    log(`✅ Build directory size: ${(stats.size / 1024).toFixed(2)} KB`, 'green');
  }
  
  return allGood;
}

function generateReport(checks) {
  log('\n📊 Production Readiness Report', 'magenta');
  log('================================', 'magenta');
  
  const passed = checks.filter(check => check.passed).length;
  const total = checks.length;
  const percentage = Math.round((passed / total) * 100);
  
  log(`\nOverall Score: ${passed}/${total} (${percentage}%)`, percentage >= 80 ? 'green' : 'red');
  
  if (percentage >= 90) {
    log('\n🎉 Excellent! Your application is ready for production deployment.', 'green');
  } else if (percentage >= 70) {
    log('\n⚠️ Good progress, but some issues need attention before production.', 'yellow');
  } else {
    log('\n❌ Several critical issues need to be resolved before production deployment.', 'red');
  }
  
  log('\n📋 Next Steps:', 'blue');
  
  if (percentage < 100) {
    log('1. Fix the failing checks above', 'yellow');
  }
  
  log('2. Run "npm run build" to create production build', 'cyan');
  log('3. Test the application thoroughly', 'cyan');
  log('4. Deploy using "./scripts/deploy-production.sh"', 'cyan');
  log('5. Set up monitoring and analytics', 'cyan');
  
  return percentage >= 80;
}

function main() {
  log('🔍 Seltech Production Readiness Check', 'cyan');
  log('=====================================', 'cyan');
  
  const checks = [
    { name: 'Package Configuration', passed: checkPackageJson() },
    { name: 'Environment Files', passed: checkEnvironmentFiles() },
    { name: 'Project Structure', passed: checkProjectStructure() },
    { name: 'Deployment Config', passed: checkDeploymentFiles() },
    { name: 'Database Migrations', passed: checkDatabaseMigrations() },
    { name: 'Build Output', passed: checkBuildOutput() }
  ];
  
  const isReady = generateReport(checks);
  
  process.exit(isReady ? 0 : 1);
}

// Run the check
main();