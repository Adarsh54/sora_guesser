// Supabase Database Types V2 - Unified Media Challenges
// Supports both images and videos

export type MediaType = 'image' | 'video';
export type Difficulty = 'easy' | 'medium' | 'hard';

// Media-specific metadata types
export interface ImageMetadata {
  width?: number;
  height?: number;
  format?: string;
  source?: string;
}

export interface VideoMetadata {
  duration?: number;       // in seconds
  resolution?: string;     // e.g., "1080p", "4K"
  format?: string;         // e.g., "mp4", "webm"
  fps?: number;
  source?: string;
}

export type MediaMetadata = ImageMetadata | VideoMetadata;

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          wallet_id: string;
          total_guesses: number;
          correct_guesses: number;
          total_tokens_earned: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          wallet_id: string;
          total_guesses?: number;
          correct_guesses?: number;
          total_tokens_earned?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          wallet_id?: string;
          total_guesses?: number;
          correct_guesses?: number;
          total_tokens_earned?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      media_challenges: {
        Row: {
          id: string;
          media_url: string;
          media_type: MediaType;
          prompt: string;
          difficulty: Difficulty | null;
          metadata: MediaMetadata;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          media_url: string;
          media_type: MediaType;
          prompt: string;
          difficulty?: Difficulty | null;
          metadata?: MediaMetadata;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          media_url?: string;
          media_type?: MediaType;
          prompt?: string;
          difficulty?: Difficulty | null;
          metadata?: MediaMetadata;
          is_active?: boolean;
          created_at?: string;
        };
      };
      guesses: {
        Row: {
          id: string;
          media_id: string;
          wallet_id: string;
          guess_text: string;
          is_correct: boolean;
          similarity_score: number;
          tokens_earned: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          media_id: string;
          wallet_id: string;
          guess_text: string;
          is_correct?: boolean;
          similarity_score?: number;
          tokens_earned?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          media_id?: string;
          wallet_id?: string;
          guess_text?: string;
          is_correct?: boolean;
          similarity_score?: number;
          tokens_earned?: number;
          created_at?: string;
        };
      };
    };
    Functions: {
      get_leaderboard: {
        Args: {
          limit_count?: number;
        };
        Returns: {
          wallet_id: string;
          total_guesses: number;
          correct_guesses: number;
          total_tokens_earned: number;
          accuracy: number;
        }[];
      };
      get_random_challenges: {
        Args: {
          media_type_filter?: MediaType | null;
          limit_count?: number;
        };
        Returns: Database['public']['Tables']['media_challenges']['Row'][];
      };
    };
  };
}

// Type aliases for easier use
export type User = Database['public']['Tables']['users']['Row'];
export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type UserUpdate = Database['public']['Tables']['users']['Update'];

export type MediaChallenge = Database['public']['Tables']['media_challenges']['Row'];
export type MediaChallengeInsert = Database['public']['Tables']['media_challenges']['Insert'];
export type MediaChallengeUpdate = Database['public']['Tables']['media_challenges']['Update'];

export type Guess = Database['public']['Tables']['guesses']['Row'];
export type GuessInsert = Database['public']['Tables']['guesses']['Insert'];
export type GuessUpdate = Database['public']['Tables']['guesses']['Update'];

// API Request/Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface CreateMediaChallengeRequest {
  mediaUrl: string;
  mediaType: MediaType;
  prompt: string;
  difficulty?: Difficulty;
  metadata?: MediaMetadata;
}

export interface SubmitGuessRequest {
  mediaId: string;
  walletId: string;
  guessText: string;
  actualPrompt: string;
}

export interface SubmitGuessResponse {
  success: boolean;
  isCorrect: boolean;
  similarityScore: number;
  tokensEarned: number;
  guess: Guess;
  userStats: User | null;
  txSignature?: string; // Solana transaction signature if tokens were minted
}

export interface LeaderboardEntry {
  wallet_id: string;
  total_guesses: number;
  correct_guesses: number;
  total_tokens_earned: number;
  accuracy: number;
}

export interface UserStatsResponse {
  wallet_id: string;
  total_guesses: number;
  correct_guesses: number;
  total_tokens_earned: number;
  accuracy: number;
}

// Helper type guards
export function isImageChallenge(challenge: MediaChallenge): challenge is MediaChallenge & { media_type: 'image' } {
  return challenge.media_type === 'image';
}

export function isVideoChallenge(challenge: MediaChallenge): challenge is MediaChallenge & { media_type: 'video' } {
  return challenge.media_type === 'video';
}

export function isImageMetadata(metadata: MediaMetadata): metadata is ImageMetadata {
  return 'width' in metadata || 'height' in metadata;
}

export function isVideoMetadata(metadata: MediaMetadata): metadata is VideoMetadata {
  return 'duration' in metadata || 'resolution' in metadata;
}


