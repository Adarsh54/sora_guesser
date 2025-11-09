import { NextRequest, NextResponse } from 'next/server';
import { generateImageWithImagen, base64ToBlob } from '@/lib/google-imagen';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const { prompt, aspectRatio, difficulty } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    console.log('🎨 Generating image with Google Imagen...');

    // Generate image with Imagen
    const result = await generateImageWithImagen({
      prompt,
      aspectRatio: aspectRatio || '1:1',
      numberOfImages: 1,
    });

    if (!result.images || result.images.length === 0) {
      return NextResponse.json(
        { error: 'Failed to generate image' },
        { status: 500 }
      );
    }

    const imageData = result.images[0];
    
    // Convert base64 to Blob
    const imageBlob = base64ToBlob(
      imageData.bytesBase64Encoded,
      imageData.mimeType
    );

    // Generate unique filename
    const filename = `${uuidv4()}.png`;
    const filepath = `images/${filename}`;

    console.log('📤 Uploading to Supabase Storage...');

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('media')
      .upload(filepath, imageBlob, {
        contentType: imageData.mimeType,
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload image to storage' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('media')
      .getPublicUrl(uploadData.path);

    const permanentUrl = urlData.publicUrl;

    console.log('💾 Saving to database...');

    // Save to database
    const { data: challengeData, error: dbError } = await supabase
      .from('media_challenges')
      .insert({
        media_url: permanentUrl,
        media_type: 'image',
        prompt: prompt,
        difficulty: difficulty || 'medium',
        metadata: {
          aspectRatio,
          model: result.modelVersion,
          source: 'google-imagen',
        },
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to save to database' },
        { status: 500 }
      );
    }

    console.log('✅ Image generated and saved successfully!');

    return NextResponse.json({
      success: true,
      imageUrl: permanentUrl,
      prompt,
      challenge: challengeData,
    });

  } catch (error: any) {
    console.error('Error generating image:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate image' },
      { status: 500 }
    );
  }
}


