/**
 * Script to generate images using Google Imagen
 * Usage: npm run generate:images
 */

import { config } from 'dotenv';
import { generateImageWithImagen, base64ToBlob } from '../lib/google-imagen';
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
    prompt: "A cyberpunk city at night with neon lights reflecting on wet streets",
    difficulty: "medium",
  },
  {
    prompt: "A serene mountain lake at sunrise with mist rising from the water",
    difficulty: "easy",
  },
  {
    prompt: "An abstract painting of emotions, swirling colors representing joy and sadness",
    difficulty: "hard",
  },
  {
    prompt: "A futuristic space station orbiting a distant planet with rings",
    difficulty: "medium",
  },
  {
    prompt: "A cozy coffee shop interior with warm lighting and vintage furniture",
    difficulty: "easy",
  },
];

interface GenerateOptions {
  prompts?: Array<{ prompt: string; difficulty?: string }>;
  count?: number;
  aspectRatio?: '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
  saveLocal?: boolean;
}

async function generateImages(options: GenerateOptions = {}) {
  const {
    prompts = EXAMPLE_PROMPTS,
    count = prompts.length,
    aspectRatio = '1:1',
    saveLocal = false,
  } = options;

  console.log('🎨 Starting Google Imagen batch generation...');
  console.log(`   Generating ${count} images`);
  console.log(`   Aspect Ratio: ${aspectRatio}\n`);

  const results = [];
  const promptsToGenerate = prompts.slice(0, count);

  for (let i = 0; i < promptsToGenerate.length; i++) {
    const { prompt, difficulty = 'medium' } = promptsToGenerate[i];
    
    console.log(`\n[${i + 1}/${promptsToGenerate.length}] Generating:`);
    console.log(`   Prompt: ${prompt}`);

    try {
      // Generate image
      const result = await generateImageWithImagen({
        prompt,
        aspectRatio,
        numberOfImages: 1,
      });

      if (!result.images || result.images.length === 0) {
        console.error('   ❌ No images generated');
        continue;
      }

      const imageData = result.images[0];
      
      // Convert to Blob
      const imageBlob = base64ToBlob(
        imageData.bytesBase64Encoded,
        imageData.mimeType
      );

      // Generate filename
      const filename = `${uuidv4()}.png`;
      const filepath = `images/${filename}`;

      // Save locally if requested
      if (saveLocal) {
        const localDir = path.join(process.cwd(), 'generated-images');
        if (!fs.existsSync(localDir)) {
          fs.mkdirSync(localDir, { recursive: true });
        }
        const localPath = path.join(localDir, filename);
        fs.writeFileSync(localPath, Buffer.from(await imageBlob.arrayBuffer()));
        console.log(`   💾 Saved locally: ${localPath}`);
      }

      // Upload to Supabase
      console.log('   📤 Uploading to Supabase...');
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('media')
        .upload(filepath, imageBlob, {
          contentType: imageData.mimeType,
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
          media_type: 'image',
          prompt: prompt,
          difficulty: difficulty,
          metadata: {
            aspectRatio,
            model: result.modelVersion,
            source: 'google-imagen',
            generatedAt: new Date().toISOString(),
          },
        })
        .select()
        .single();

      if (dbError) {
        console.error('   ❌ Database save failed:', dbError);
        continue;
      }

      console.log('   ✅ Success!');
      console.log(`   🔗 URL: ${permanentUrl}`);

      results.push({
        prompt,
        url: permanentUrl,
        id: challengeData.id,
      });

    } catch (error) {
      console.error(`   ❌ Error:`, error);
    }

    // Add delay between requests to avoid rate limits
    if (i < promptsToGenerate.length - 1) {
      console.log('   ⏳ Waiting 2 seconds before next generation...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\n✅ Generation complete!`);
  console.log(`   Total: ${results.length}/${promptsToGenerate.length} images generated\n`);

  if (results.length > 0) {
    console.log('Generated images:');
    results.forEach((r, i) => {
      console.log(`   ${i + 1}. ${r.prompt.substring(0, 50)}...`);
      console.log(`      ${r.url}\n`);
    });
  }
}

// Run if called directly
if (require.main === module) {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const countArg = args.find(arg => arg.startsWith('--count='));
  const count = countArg ? parseInt(countArg.split('=')[1]) : 5;
  const saveLocal = args.includes('--save-local');
  const aspectRatioArg = args.find(arg => arg.startsWith('--aspect-ratio='));
  const aspectRatio = aspectRatioArg?.split('=')[1] as any || '1:1';

  generateImages({ count, saveLocal, aspectRatio })
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { generateImages };

