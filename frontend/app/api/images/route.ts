import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const difficulty = searchParams.get('difficulty');
    const mediaType = searchParams.get('type'); // 'image' or 'video'

    // Build query for media_challenges table (v2 schema)
    let query = supabase
      .from('media_challenges')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    // Filter by media type if specified
    if (mediaType && ['image', 'video'].includes(mediaType)) {
      query = query.eq('media_type', mediaType);
    }

    // Filter by difficulty if specified
    if (difficulty && ['easy', 'medium', 'hard'].includes(difficulty)) {
      query = query.eq('difficulty', difficulty);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching media:', error);
      return NextResponse.json(
        { error: 'Failed to fetch media' },
        { status: 500 }
      );
    }

    // Transform to match old API format (for backwards compatibility)
    const images = (data || []).map(item => ({
      id: item.id,
      image_url: item.media_url, // Map media_url to image_url
      prompt: item.prompt,
      difficulty: item.difficulty,
      media_type: item.media_type,
      metadata: item.metadata,
    }));

    return NextResponse.json({ images });
  } catch (error: any) {
    console.error('Error fetching media:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch media' },
      { status: 500 }
    );
  }
}

// POST endpoint to add new media (admin/script use)
export async function POST(request: NextRequest) {
  try {
    const { imageUrl, mediaUrl, prompt, difficulty, mediaType, metadata } = await request.json();

    // Support both old (imageUrl) and new (mediaUrl) parameter names
    const url = mediaUrl || imageUrl;

    if (!url || !prompt) {
      return NextResponse.json(
        { error: 'Media URL and prompt are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('media_challenges')
      .insert({
        media_url: url,
        media_type: mediaType || 'image',
        prompt,
        difficulty: difficulty || 'medium',
        metadata: metadata || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting media:', error);
      return NextResponse.json(
        { error: 'Failed to insert media' },
        { status: 500 }
      );
    }

    return NextResponse.json({ image: data });
  } catch (error: any) {
    console.error('Error adding media:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add media' },
      { status: 500 }
    );
  }
}


