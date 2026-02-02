#!/usr/bin/env node

/**
 * Test Network Fix - Verify CORS Issue Resolution
 * Tests the complete payment flow via Supabase Edge Function
 */

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://rtsaarapvlzzinmpjdys.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0c2FhcmFwdmx6emlubbXBqZHlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzI4NzEsImV4cCI6MjA1MDU0ODg3MX0.Ej5VJhkdJhkdJhkdJhkdJhkdJhkdJhkdJhkdJhkdJhk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testNetworkFix() {
  console.log('🧪 TESTING NETWORK FIX');
  console.log('='.repeat(50));
  
  try {
    console.log('🔄 Testing Supabase Edge Function...');
    
    // Test the create-payment function
    const { data, error } = await supabase.functions.invoke('create-payment', {
      body: {
        productId: 'test-product-123',
        buyerId: 'test-buyer-456',
        currency: 'USDT'
      }
    });
    
    if (error) {
      console.log('❌ Edge Function Error:', error);
      return false;
    }
    
    console.log('✅ Edge Function Response:', data);
    
    if (data && data.success) {
      console.log('🎉 SUCCESS: Network fix working!');
      console.log('💳 Payment URL would be:', data.paymentUrl);
      return true;
    } else {
      console.log('⚠️ Function works but payment failed:', data.error);
      return false;
    }
    
  } catch (error) {
    console.error('💥 Test Error:', error.message);
    return false;
  }
}

// Run the test
testNetworkFix().then(success => {
  if (success) {
    console.log('\n🎯 RESULT: Network fix is working correctly!');
    console.log('✅ Ready for live testing on website');
  } else {
    console.log('\n🚨 RESULT: Network fix needs attention');
    console.log('❌ Check Edge Function deployment');
  }
});