/**
 * Quick script to generate a video challenge
 */

import { config } from 'dotenv';
import * as path from 'path';

config({ path: path.resolve(process.cwd(), '.env.local') });

async function generateVideo() {
  const prompt = process.argv[2];
  
  if (!prompt) {
    console.log('Usage: npx esrun scripts/quick-generate-video.ts "your prompt here"');
    process.exit(1);
  }

  console.log('🎬 Generating video...');
  console.log(`📝 Prompt: "${prompt}"\n`);
  console.log('⏳ This will take 1-2 minutes...\n');

  try {
    const response = await fetch('http://localhost:3000/api/generate-video-veo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        difficulty: 'medium',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate video');
    }

    const data = await response.json();
    
    console.log('\n✅ Video generated successfully!');
    console.log('📊 Details:');
    console.log(`   Video URL: ${data.videoUrl}`);
    console.log(`   Prompt: ${data.prompt}`);
    console.log(`   Duration: ${data.duration}s`);
    console.log(`   Challenge ID: ${data.challenge.id}`);
    console.log('\n🔗 View in app: http://localhost:3000\n');

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

generateVideo();


