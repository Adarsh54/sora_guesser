import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database Types (V2 - Unified Media Schema)
export type MediaType = 'image' | 'video';

export interface MediaChallenge {
  id: string;
  media_url: string;
  media_type: MediaType;
  prompt: string;
  difficulty: 'easy' | 'medium' | 'hard';
  metadata?: {
    aspectRatio?: string;
    duration?: number;
    resolution?: string;
    format?: string;
    model?: string;
    source?: string;
    generatedAt?: string;
  };
  created_at: string;
}

export interface Guess {
  id: string;
  media_challenge_id: string; // Updated from image_id
  wallet_id: string;
  guess_text: string;
  is_correct: boolean;
  similarity_score: number;
  tokens_earned: number;
  created_at: string;
}

export interface User {
  wallet_id: string;
  total_guesses: number;
  correct_guesses: number;
  total_tokens_earned: number;
  created_at: string;
  updated_at: string;
}

// Legacy types for backwards compatibility (V1)
export interface Image {
  id: string;
  image_url: string;
  prompt: string;
  created_at: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}


