import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Simple string similarity function (Levenshtein-based)
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  // Exact match
  if (s1 === s2) return 100;
  
  // Check if one string contains the other
  if (s1.includes(s2) || s2.includes(s1)) return 80;
  
  // Calculate Levenshtein distance
  const matrix: number[][] = [];
  
  for (let i = 0; i <= s2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= s1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= s2.length; i++) {
    for (let j = 1; j <= s1.length; j++) {
      if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  const distance = matrix[s2.length][s1.length];
  const maxLength = Math.max(s1.length, s2.length);
  const similarity = ((maxLength - distance) / maxLength) * 100;
  
  return Math.round(similarity * 100) / 100;
}

export async function POST(request: NextRequest) {
  try {
    const { imageId, walletId, guessText, actualPrompt } = await request.json();

    // Validate input
    if (!imageId || !walletId || !guessText || !actualPrompt) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Ensure user exists in the database first (create if doesn't exist)
    const { error: userUpsertError } = await supabase
      .from('users')
      .upsert(
        { 
          wallet_id: walletId,
          total_guesses: 0,
          correct_guesses: 0,
          total_tokens_earned: 0,
        },
        { 
          onConflict: 'wallet_id',
          ignoreDuplicates: true, // Don't overwrite if exists
        }
      );

    if (userUpsertError) {
      console.error('Error ensuring user exists:', userUpsertError);
      return NextResponse.json(
        { error: 'Failed to create user record' },
        { status: 500 }
      );
    }

    // Calculate similarity
    const similarityScore = calculateSimilarity(guessText, actualPrompt);
    
    // Determine if correct (>= 70% similarity)
    const isCorrect = similarityScore >= 70;
    
    // Calculate tokens earned (base 100 tokens for correct guess)
    const tokensEarned = isCorrect ? 100 : 0;

    // Insert guess into database (v2 schema uses media_id)
    const { data: guessData, error: guessError } = await supabase
      .from('guesses')
      .insert({
        media_id: imageId,  // v2 schema uses media_id
        wallet_id: walletId,
        guess_text: guessText,
        is_correct: isCorrect,
        similarity_score: similarityScore,
        tokens_earned: tokensEarned,
      })
      .select()
      .single();

    if (guessError) {
      console.error('Error inserting guess:', guessError);
      console.error('Error details:', JSON.stringify(guessError, null, 2));
      return NextResponse.json(
        { error: 'Failed to save guess', details: guessError.message },
        { status: 500 }
      );
    }

    // If correct, mint actual SPL tokens to the user's wallet
    let mintingResult = null;
    if (isCorrect && tokensEarned > 0) {
      try {
        console.log(`🪙 Minting ${tokensEarned} DGEN tokens to ${walletId}`);
        const mintResponse = await fetch(`${request.nextUrl.origin}/api/mint-tokens`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            recipientWallet: walletId,
            amount: tokensEarned,
          }),
        });

        if (mintResponse.ok) {
          mintingResult = await mintResponse.json();
          console.log('✅ Tokens minted successfully:', mintingResult.signature);
        } else {
          const error = await mintResponse.json();
          console.error('❌ Token minting failed:', error);
          // Don't fail the whole request if minting fails
          mintingResult = { error: error.details || 'Minting failed' };
        }
      } catch (mintError) {
        console.error('❌ Error calling mint-tokens API:', mintError);
        mintingResult = { error: 'Failed to call minting service' };
      }
    }

    // Fetch updated user stats
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_id', walletId)
      .single();

    if (userError && userError.code !== 'PGRST116') { // PGRST116 = not found (expected for new users)
      console.error('Error fetching user stats:', userError);
    }

    return NextResponse.json({
      success: true,
      isCorrect,
      similarityScore,
      tokensEarned,
      guess: guessData,
      userStats: userData || null,
      minting: mintingResult,
    });
  } catch (error: any) {
    console.error('Error processing guess:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process guess' },
      { status: 500 }
    );
  }
}

