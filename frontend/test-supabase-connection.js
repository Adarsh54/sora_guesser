#!/usr/bin/env node

/**
 * Quick test script to verify Supabase connection
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function testConnection() {
  console.log('🔍 Testing Supabase Connection...\n');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    console.error(`   URL: ${supabaseUrl ? '✓' : '✗'}`);
    console.error(`   Key: ${supabaseKey ? '✓' : '✗'}`);
    process.exit(1);
  }
  
  console.log('✅ Environment variables loaded');
  console.log(`   URL: ${supabaseUrl}\n`);
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test basic connection by checking if we can query
    console.log('📡 Attempting to connect...');
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      if (error.message.includes('relation "users" does not exist')) {
        console.log('\n⚠️  Connection successful, but tables not created yet!');
        console.log('\n📋 Next step: Run the schema in Supabase SQL Editor');
        console.log('   File: frontend/supabase/schema-v2.sql');
        console.log('   Location: Supabase Dashboard → SQL Editor → New Query\n');
        return;
      }
      throw error;
    }
    
    console.log('\n✅ Supabase connection successful!');
    console.log('✅ Database tables found and accessible\n');
    
  } catch (error) {
    console.error('\n❌ Connection failed:');
    console.error(`   ${error.message}\n`);
    process.exit(1);
  }
}

testConnection();


