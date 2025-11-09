import { NextRequest, NextResponse } from 'next/server';
import { generateVideoWithVeo, base64ToBlob } from '@/lib/google-veo';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const { prompt, duration, aspectRatio, difficulty } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    console.log('🎬 Generating video with Google Veo...');
    console.log('⏳ This will take 1-2 minutes...');

    // Generate video with Veo
    const result = await generateVideoWithVeo({
      prompt,
      duration: duration || 5,
      aspectRatio: aspectRatio || '16:9',
    });

    if (!result.videos || result.videos.length === 0) {
      return NextResponse.json(
        { error: 'Failed to generate video' },
        { status: 500 }
      );
    }

    const videoData = result.videos[0];
    
    // Convert base64 to Blob
    const videoBlob = base64ToBlob(
      videoData.bytesBase64Encoded,
      videoData.mimeType
    );

    // Generate unique filename
    const filename = `${uuidv4()}.mp4`;
    const filepath = `videos/${filename}`;

    console.log('📤 Uploading to Supabase Storage...');

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('media')
      .upload(filepath, videoBlob, {
        contentType: videoData.mimeType,
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload video to storage' },
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
        media_type: 'video',
        prompt: prompt,
        difficulty: difficulty || 'medium',
        metadata: {
          duration: duration || 5,
          aspectRatio,
          resolution: '1080p',
          format: 'mp4',
          model: result.modelVersion,
          source: 'google-veo',
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

    console.log('✅ Video generated and saved successfully!');

    return NextResponse.json({
      success: true,
      videoUrl: permanentUrl,
      prompt,
      challenge: challengeData,
      duration: duration || 5,
    });

  } catch (error: any) {
    console.error('Error generating video:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate video' },
      { status: 500 }
    );
  }
}


