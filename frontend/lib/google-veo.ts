/**
 * Google Veo 3.1 Integration
 * Generates videos using Google's Veo AI model via Python SDK
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';

const execAsync = promisify(exec);

export interface VeoOptions {
  prompt: string;
  negativePrompt?: string;
  duration?: 5 | 8; // seconds
  aspectRatio?: '1:1' | '9:16' | '16:9';
  seed?: number;
  model?: string;
}

export interface VeoResponse {
  videos: Array<{
    bytesBase64Encoded: string;
    mimeType: string;
  }>;
  modelVersion: string;
}

export async function generateVideoWithVeo(
  options: VeoOptions
): Promise<VeoResponse> {
  const {
    prompt,
    model = 'veo-3.1-fast-generate-preview',
  } = options;

  console.log('🎬 Generating video with Veo 3.1...');
  console.log(`   Prompt: ${prompt}`);
  console.log(`   Model: ${model}`);
  console.log('   ⏳ This may take 1-2 minutes...');

  // Get Gemini API key from environment
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is required');
  }

  try {
    // Path to Python script
    const scriptPath = path.join(process.cwd(), 'scripts', 'generate-video-python.py');
    const venvPython = path.join(process.cwd(), '..', 'venv', 'bin', 'python');
    
    // Escape prompt for shell
    const escapedPrompt = prompt.replace(/"/g, '\\"');
    
    // Call Python script
    const command = `"${venvPython}" "${scriptPath}" "${escapedPrompt}" "${apiKey}" "${model}"`;
    
    const { stdout, stderr } = await execAsync(command, {
      maxBuffer: 50 * 1024 * 1024, // 50MB buffer for large videos
      timeout: 5 * 60 * 1000, // 5 minute timeout
    });
    
    // stderr contains progress logs
    if (stderr) {
      // Print progress logs line by line
      stderr.split('\n').forEach(line => {
        if (line.trim()) console.log(line);
      });
    }
    
    // Parse JSON response from stdout
    const result = JSON.parse(stdout.trim());
    
    if (!result.success) {
      throw new Error(result.error || 'Video generation failed');
    }
    
    console.log(`   📊 Video size: ${(result.size / (1024 * 1024)).toFixed(2)} MB`);
    
    return {
      videos: [{
        bytesBase64Encoded: result.video,
        mimeType: result.mimeType,
      }],
      modelVersion: result.model,
    };

  } catch (error: any) {
    console.error('Veo API Error:', error);
    throw new Error(`Veo API Error: ${error.message}`);
  }
}

/**
 * Convert base64 video to Blob
 */
export function base64ToBlob(base64: string, mimeType: string = 'video/mp4'): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

