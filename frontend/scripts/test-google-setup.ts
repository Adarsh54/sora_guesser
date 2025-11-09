/**
 * Test script to verify Google Cloud and Supabase setup
 * Usage: npx tsx scripts/test-google-setup.ts
 */

import { config } from 'dotenv';
import { getGoogleAuth, getAuthToken } from '../lib/google-auth';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

async function runTests() {
  console.log('🧪 Testing Google Cloud + Supabase Setup\n');
  console.log('='.repeat(60) + '\n');

  let passedTests = 0;
  let totalTests = 0;

  // Test 1: Environment Variables
  totalTests++;
  console.log('Test 1: Environment Variables');
  try {
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'GOOGLE_PROJECT_ID',
      'GOOGLE_APPLICATION_CREDENTIALS',
    ];

    const missing = requiredEnvVars.filter(v => !process.env[v]);
    
    if (missing.length > 0) {
      console.log(`   ❌ Missing: ${missing.join(', ')}`);
    } else {
      console.log('   ✅ All environment variables present');
      passedTests++;
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error}`);
  }

  // Test 2: Service Account File
  totalTests++;
  console.log('\nTest 2: Service Account JSON File');
  try {
    const credPath = path.resolve(
      process.cwd(),
      process.env.GOOGLE_APPLICATION_CREDENTIALS || '../.google-credentials/service-account.json'
    );
    
    if (fs.existsSync(credPath)) {
      const content = JSON.parse(fs.readFileSync(credPath, 'utf-8'));
      console.log(`   ✅ Found at: ${credPath}`);
      console.log(`   📧 Service Account: ${content.client_email}`);
      console.log(`   📁 Project: ${content.project_id}`);
      passedTests++;
    } else {
      console.log(`   ❌ Not found at: ${credPath}`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error}`);
  }

  // Test 3: Google Authentication
  totalTests++;
  console.log('\nTest 3: Google Cloud Authentication');
  try {
    const { projectId, location } = getGoogleAuth();
    console.log(`   ✅ Project ID: ${projectId}`);
    console.log(`   ✅ Location: ${location}`);
    passedTests++;
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  // Test 4: Google Access Token
  totalTests++;
  console.log('\nTest 4: Google Access Token');
  try {
    const token = await getAuthToken();
    console.log(`   ✅ Successfully obtained access token`);
    console.log(`   🔑 Token: ${token.substring(0, 20)}...`);
    passedTests++;
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`);
    console.log(`   💡 Tip: Check service account permissions`);
  }

  // Test 5: Supabase Connection
  totalTests++;
  console.log('\nTest 5: Supabase Connection');
  try {
    const { data, error } = await supabase.from('users').select('count');
    if (error) {
      console.log(`   ⚠️  Table check: ${error.message}`);
    } else {
      console.log('   ✅ Database connection successful');
      passedTests++;
    }
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  // Test 6: Media Challenges Table
  totalTests++;
  console.log('\nTest 6: Media Challenges Table');
  try {
    const { data, error } = await supabase
      .from('media_challenges')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log(`   ❌ Table not found: ${error.message}`);
      console.log(`   💡 Tip: Run schema-v2.sql in Supabase SQL Editor`);
    } else {
      console.log('   ✅ media_challenges table exists');
      passedTests++;
    }
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  // Test 7: Supabase Storage Bucket
  totalTests++;
  console.log('\nTest 7: Supabase Storage Bucket');
  try {
    const { data, error } = await supabase.storage.getBucket('media');
    
    if (error) {
      console.log(`   ❌ Bucket 'media' not found`);
      console.log(`   💡 Tip: Create 'media' bucket in Supabase dashboard`);
    } else {
      console.log('   ✅ Storage bucket "media" exists');
      console.log(`   📦 Public: ${data.public ? 'Yes' : 'No'}`);
      passedTests++;
    }
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  // Test 8: Vertex AI API (requires API call, so we'll just check credentials)
  totalTests++;
  console.log('\nTest 8: Vertex AI API Readiness');
  try {
    const { projectId, location } = getGoogleAuth();
    const token = await getAuthToken();
    
    if (projectId && location && token) {
      console.log('   ✅ Ready to call Vertex AI APIs');
      console.log(`   📍 Endpoint: https://${location}-aiplatform.googleapis.com`);
      console.log('   💡 Try: npm run generate:images -- --count=1');
      passedTests++;
    }
  } catch (error: any) {
    console.log(`   ❌ Not ready: ${error.message}`);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 Test Results: ${passedTests}/${totalTests} passed\n`);

  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! You\'re ready to generate images and videos!');
    console.log('\nNext steps:');
    console.log('  1. npm run generate:images -- --count=1');
    console.log('  2. npm run generate:videos -- --count=1');
  } else {
    console.log('⚠️  Some tests failed. Please review the errors above.');
    console.log('\n📚 Check GOOGLE_CLOUD_SETUP.md for detailed setup instructions.');
  }
}

// Run tests
runTests()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });

