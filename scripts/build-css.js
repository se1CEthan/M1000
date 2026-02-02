#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🎨 Building CSS with Tailwind...');

try {
  // Use Tailwind CLI to build CSS
  const command = 'npx tailwindcss -i ./src/index.css -o ./dist/assets/tailwind.css --minify';
  
  console.log('Running:', command);
  execSync(command, { stdio: 'inherit' });
  
  console.log('✅ CSS built successfully');
  
  // Check if the file was created
  const cssPath = './dist/assets/tailwind.css';
  if (fs.existsSync(cssPath)) {
    const stats = fs.statSync(cssPath);
    console.log(`📦 CSS file size: ${(stats.size / 1024).toFixed(2)} KB`);
    
    // Read first few lines to verify content
    const content = fs.readFileSync(cssPath, 'utf8');
    const firstLine = content.split('\n')[0];
    console.log('📄 First line:', firstLine);
    
    if (firstLine.includes('@tailwind')) {
      console.error('❌ Tailwind directives not processed!');
      process.exit(1);
    } else {
      console.log('✅ Tailwind CSS processed correctly');
    }
  } else {
    console.error('❌ CSS file not created');
    process.exit(1);
  }
  
} catch (error) {
  console.error('❌ CSS build failed:', error.message);
  process.exit(1);
}