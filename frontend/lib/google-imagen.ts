/**
 * Google Imagen 3 Integration
 * Generates images using Google's Imagen AI model
 */

import { getAuthToken, getGoogleAuth } from './google-auth';

export interface ImagenOptions {
  prompt: string;
  negativePrompt?: string;
  aspectRatio?: '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
  numberOfImages?: number;
  guidance?: number; // 1-20, higher = more prompt adherence
  seed?: number;
}

export interface ImagenResponse {
  images: Array<{
    bytesBase64Encoded: string;
    mimeType: string;
  }>;
  modelVersion: string;
}

export async function generateImageWithImagen(
  options: ImagenOptions
): Promise<ImagenResponse> {
  const { projectId, location } = getGoogleAuth();
  const token = await getAuthToken();

  const {
    prompt,
    negativePrompt,
    aspectRatio = '1:1',
    numberOfImages = 1,
    guidance = 12,
    seed,
  } = options;

  const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/imagen-3.0-generate-001:predict`;

  const requestBody = {
    instances: [
      {
        prompt,
      },
    ],
    parameters: {
      sampleCount: numberOfImages,
      aspectRatio,
      safetySetting: 'block_some',
      personGeneration: 'allow_adult',
      ...(negativePrompt && { negativePrompt }),
      ...(guidance && { guidanceScale: guidance }),
      ...(seed && { seed }),
    },
  };

  console.log('🎨 Generating image with Imagen 3...');
  console.log(`   Prompt: ${prompt}`);
  console.log(`   Aspect Ratio: ${aspectRatio}`);

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Imagen API Error:', error);
    throw new Error(`Imagen API Error: ${response.status} - ${error}`);
  }

  const data = await response.json();

  if (!data.predictions || data.predictions.length === 0) {
    throw new Error('No images generated');
  }

  return {
    images: data.predictions.map((pred: any) => ({
      bytesBase64Encoded: pred.bytesBase64Encoded,
      mimeType: pred.mimeType || 'image/png',
    })),
    modelVersion: 'imagen-3.0',
  };
}

/**
 * Convert base64 image to Blob
 */
export function base64ToBlob(base64: string, mimeType: string = 'image/png'): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}


