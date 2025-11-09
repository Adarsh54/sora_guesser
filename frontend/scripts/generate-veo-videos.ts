/**
 * Script to generate videos using Google Veo
 * Usage: npm run generate:videos
 */

import { config } from 'dotenv';
import { generateVideoWithVeo, base64ToBlob } from '../lib/google-veo';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
config({ path: path.resolve(process.cwd(), '.env.local') });

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Example prompts for dgenerate game
const EXAMPLE_PROMPTS = [
  {
    prompt: "A time-lapse of a city transitioning from day to night, with lights turning on across buildings",
    difficulty: "medium",
    duration: 5,
  },
  {
    prompt: "Ocean waves crashing on a beach at sunset with seagulls flying overhead",
    difficulty: "easy",
    duration: 5,
  },
  {
    prompt: "Abstract visualization of data flowing through a neural network with glowing nodes",
    difficulty: "hard",
    duration: 8,
  },
  {
    prompt: "A drone flying through a dense forest with sunlight filtering through the trees",
    difficulty: "medium",
    duration: 8,
  },
  {
    prompt: "Coffee being poured into a cup in slow motion with steam rising",
    difficulty: "easy",
    duration: 5,
  },
];

interface GenerateOptions {
  prompts?: Array<{ prompt: string; difficulty?: string; duration?: number }>;
  count?: number;
  aspectRatio?: '1:1' | '9:16' | '16:9';
  defaultDuration?: 5 | 8;
  saveLocal?: boolean;
}

async function generateVideos(options: GenerateOptions = {}) {
  const {
    prompts = EXAMPLE_PROMPTS,
    count = prompts.length,
    aspectRatio = '16:9',
    defaultDuration = 5,
    saveLocal = false,
  } = options;

  console.log('🎬 Starting Google Veo batch generation...');
  console.log(`   Generating ${count} videos`);
  console.log(`   Aspect Ratio: ${aspectRatio}`);
  console.log(`   Duration: ${defaultDuration}s`);
  console.log(`   ⚠️  Note: Each video takes 1-2 minutes to generate\n`);

  const results = [];
  const promptsToGenerate = prompts.slice(0, count);

  for (let i = 0; i < promptsToGenerate.length; i++) {
    const { prompt, difficulty = 'medium', duration = defaultDuration } = promptsToGenerate[i];
    
    console.log(`\n[${i + 1}/${promptsToGenerate.length}] Generating video:`);
    console.log(`   Prompt: ${prompt}`);
    console.log(`   Duration: ${duration}s`);

    const startTime = Date.now();

    try {
      // Generate video
      const result = await generateVideoWithVeo({
        prompt,
        duration,
        aspectRatio,
      });

      if (!result.videos || result.videos.length === 0) {
        console.error('   ❌ No videos generated');
        continue;
      }

      const videoData = result.videos[0];
      
      // Convert to Blob
      const videoBlob = base64ToBlob(
        videoData.bytesBase64Encoded,
        videoData.mimeType
      );

      // Generate filename
      const filename = `${uuidv4()}.mp4`;
      const filepath = `videos/${filename}`;

      // Save locally if requested
      if (saveLocal) {
        const localDir = path.join(process.cwd(), 'generated-videos');
        if (!fs.existsSync(localDir)) {
          fs.mkdirSync(localDir, { recursive: true });
        }
        const localPath = path.join(localDir, filename);
        fs.writeFileSync(localPath, Buffer.from(await videoBlob.arrayBuffer()));
        console.log(`   💾 Saved locally: ${localPath}`);
      }

      // Upload to Supabase
      console.log('   📤 Uploading to Supabase...');
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('media')
        .upload(filepath, videoBlob, {
          contentType: videoData.mimeType,
          upsert: false,
        });

      if (uploadError) {
        console.error('   ❌ Upload failed:', uploadError);
        continue;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('media')
        .getPublicUrl(uploadData.path);

      const permanentUrl = urlData.publicUrl;

      // Save to database
      console.log('   💾 Saving to database...');
      const { data: challengeData, error: dbError } = await supabase
        .from('media_challenges')
        .insert({
          media_url: permanentUrl,
          media_type: 'video',
          prompt: prompt,
          difficulty: difficulty,
          metadata: {
            duration,
            aspectRatio,
            resolution: '1080p',
            format: 'mp4',
            model: result.modelVersion,
            source: 'google-veo',
            generatedAt: new Date().toISOString(),
          },
        })
        .select()
        .single();

      if (dbError) {
        console.error('   ❌ Database save failed:', dbError);
        continue;
      }

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`   ✅ Success! (${elapsed}s)`);
      console.log(`   🔗 URL: ${permanentUrl}`);

      results.push({
        prompt,
        url: permanentUrl,
        id: challengeData.id,
        duration,
      });

    } catch (error) {
      console.error(`   ❌ Error:`, error);
    }

    // Add delay between requests
    if (i < promptsToGenerate.length - 1) {
      console.log('   ⏳ Waiting 5 seconds before next generation...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\n✅ Generation complete!`);
  console.log(`   Total: ${results.length}/${promptsToGenerate.length} videos generated\n`);

  if (results.length > 0) {
    console.log('Generated videos:');
    results.forEach((r, i) => {
      console.log(`   ${i + 1}. ${r.prompt.substring(0, 50)}... (${r.duration}s)`);
      console.log(`      ${r.url}\n`);
    });
  }
}

// Run if called directly
if (require.main === module) {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const countArg = args.find(arg => arg.startsWith('--count='));
  const count = countArg ? parseInt(countArg.split('=')[1]) : 3; // Default to 3 because videos are slow
  const saveLocal = args.includes('--save-local');
  const aspectRatioArg = args.find(arg => arg.startsWith('--aspect-ratio='));
  const aspectRatio = aspectRatioArg?.split('=')[1] as any || '16:9';
  const durationArg = args.find(arg => arg.startsWith('--duration='));
  const defaultDuration = durationArg ? parseInt(durationArg.split('=')[1]) as any : 5;

  generateVideos({ count, saveLocal, aspectRatio, defaultDuration })
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { generateVideos };

