#!/usr/bin/env node

/**
 * Database Migration Runner
 * Runs the admin dashboard migration script
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('🚀 Running Admin Dashboard Migration...\n');

  try {
    // Read the migration SQL file
    const migrationSQL = readFileSync('scripts/fix-missing-admin-tables.sql', 'utf8');
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments and empty statements
      if (statement.startsWith('--') || statement.length < 10) {
        continue;
      }

      try {
        console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
        
        const { error } = await supabase.rpc('exec_sql', { 
          sql_query: statement + ';' 
        });

        if (error) {
          // Try direct query if RPC fails
          const { error: directError } = await supabase
            .from('_temp_migration')
            .select('*')
            .limit(0);
          
          if (directError && directError.message.includes('does not exist')) {
            // Create a simple table first to test connection
            await supabase.rpc('exec_sql', { 
              sql_query: 'CREATE TABLE IF NOT EXISTS _temp_migration (id UUID);' 
            });
          }
          
          throw error;
        }

        successCount++;
        console.log(`✅ Statement ${i + 1} executed successfully`);
        
      } catch (error) {
        errorCount++;
        console.log(`❌ Statement ${i + 1} failed: ${error.message}`);
        
        // Continue with other statements unless it's a critical error
        if (error.message.includes('already exists')) {
          console.log('   ℹ️  Resource already exists, continuing...');
          successCount++;
        }
      }
    }

    console.log(`\n📊 Migration Results:`);
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);

    if (errorCount === 0) {
      console.log('\n🎉 Migration completed successfully!');
    } else {
      console.log('\n⚠️  Migration completed with some errors. Check the logs above.');
    }

    // Test the results
    console.log('\n🧪 Testing migration results...');
    await testTables();

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('\n💡 Alternative approach:');
    console.log('1. Copy the contents of scripts/fix-missing-admin-tables.sql');
    console.log('2. Paste it into your Supabase SQL editor');
    console.log('3. Run it manually');
  }
}

async function testTables() {
  const tables = [
    'seller_verification_applications',
    'product_reviews', 
    'admin_activity_log',
    'notifications'
  ];

  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('id')
        .limit(1);
      
      if (error) throw error;
      console.log(`✅ ${table}: OK`);
    } catch (error) {
      console.log(`❌ ${table}: ${error.message}`);
    }
  }
}

runMigration().catch(console.error);