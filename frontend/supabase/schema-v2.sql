-- Sora Guesser Database Schema V2
-- Unified media table supporting both images and videos
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (tracked by wallet ID)
CREATE TABLE IF NOT EXISTS users (
  wallet_id TEXT PRIMARY KEY,
  total_guesses INTEGER DEFAULT 0,
  correct_guesses INTEGER DEFAULT 0,
  total_tokens_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Unified media challenges table (supports both images and videos)
CREATE TABLE IF NOT EXISTS media_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  media_url TEXT NOT NULL,                    -- URL to image or video
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  prompt TEXT NOT NULL,                       -- The actual prompt used to generate the media
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  metadata JSONB DEFAULT '{}'::jsonb,         -- Flexible storage for media-specific data
  -- metadata examples:
  -- For videos: {"duration": 30, "resolution": "1080p", "format": "mp4"}
  -- For images: {"width": 1024, "height": 1024, "format": "png"}
  is_active BOOLEAN DEFAULT true,             -- Can be used to hide/archive challenges
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Guesses table (updated to reference media_challenges)
CREATE TABLE IF NOT EXISTS guesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  media_id UUID NOT NULL REFERENCES media_challenges(id) ON DELETE CASCADE,
  wallet_id TEXT NOT NULL REFERENCES users(wallet_id) ON DELETE CASCADE,
  guess_text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT FALSE,
  similarity_score DECIMAL(5,2) DEFAULT 0.0, -- 0.00 to 100.00
  tokens_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_media_challenges_media_type ON media_challenges(media_type);
CREATE INDEX IF NOT EXISTS idx_media_challenges_is_active ON media_challenges(is_active);
CREATE INDEX IF NOT EXISTS idx_media_challenges_created_at ON media_challenges(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_guesses_wallet_id ON guesses(wallet_id);
CREATE INDEX IF NOT EXISTS idx_guesses_media_id ON guesses(media_id);
CREATE INDEX IF NOT EXISTS idx_guesses_created_at ON guesses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_wallet_id ON users(wallet_id);

-- Function to update user stats automatically
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update user stats
  INSERT INTO users (wallet_id, total_guesses, correct_guesses, total_tokens_earned)
  VALUES (
    NEW.wallet_id,
    1,
    CASE WHEN NEW.is_correct THEN 1 ELSE 0 END,
    NEW.tokens_earned
  )
  ON CONFLICT (wallet_id) 
  DO UPDATE SET
    total_guesses = users.total_guesses + 1,
    correct_guesses = users.correct_guesses + (CASE WHEN NEW.is_correct THEN 1 ELSE 0 END),
    total_tokens_earned = users.total_tokens_earned + NEW.tokens_earned,
    updated_at = TIMEZONE('utc'::text, NOW());
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update user stats when a guess is made
DROP TRIGGER IF EXISTS update_user_stats_trigger ON guesses;
CREATE TRIGGER update_user_stats_trigger
AFTER INSERT ON guesses
FOR EACH ROW
EXECUTE FUNCTION update_user_stats();

-- Function to get leaderboard
CREATE OR REPLACE FUNCTION get_leaderboard(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  wallet_id TEXT,
  total_guesses INTEGER,
  correct_guesses INTEGER,
  total_tokens_earned INTEGER,
  accuracy DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.wallet_id,
    u.total_guesses,
    u.correct_guesses,
    u.total_tokens_earned,
    CASE 
      WHEN u.total_guesses > 0 THEN (u.correct_guesses::DECIMAL / u.total_guesses::DECIMAL * 100)
      ELSE 0
    END as accuracy
  FROM users u
  WHERE u.total_guesses > 0
  ORDER BY u.total_tokens_earned DESC, u.correct_guesses DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get random media challenges by type
CREATE OR REPLACE FUNCTION get_random_challenges(
  media_type_filter TEXT DEFAULT NULL,
  limit_count INTEGER DEFAULT 10
)
RETURNS SETOF media_challenges AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM media_challenges
  WHERE is_active = true
    AND (media_type_filter IS NULL OR media_type = media_type_filter)
  ORDER BY RANDOM()
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Insert some sample challenges
INSERT INTO media_challenges (media_url, media_type, prompt, difficulty, metadata) VALUES
  ('https://picsum.photos/1024/1024?random=1', 'image', 'A futuristic city at sunset with flying cars', 'medium', '{"width": 1024, "height": 1024}'::jsonb),
  ('https://picsum.photos/1024/1024?random=2', 'image', 'A magical forest with glowing mushrooms', 'medium', '{"width": 1024, "height": 1024}'::jsonb),
  ('https://picsum.photos/1024/1024?random=3', 'image', 'An astronaut floating in colorful space', 'easy', '{"width": 1024, "height": 1024}'::jsonb)
ON CONFLICT DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE guesses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for media_challenges (everyone can read active challenges)
CREATE POLICY "Anyone can view active challenges"
  ON media_challenges FOR SELECT
  USING (is_active = true);

-- RLS Policies for guesses (users can insert their own, view all)
CREATE POLICY "Users can insert their own guesses"
  ON guesses FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view all guesses"
  ON guesses FOR SELECT
  USING (true);

-- RLS Policies for users (everyone can read leaderboard)
CREATE POLICY "Anyone can view user stats"
  ON users FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert/update user stats"
  ON users FOR ALL
  USING (true);

-- Comment on tables for documentation
COMMENT ON TABLE media_challenges IS 'Unified table storing both image and video challenges with their prompts';
COMMENT ON COLUMN media_challenges.media_url IS 'URL to the image or video file';
COMMENT ON COLUMN media_challenges.media_type IS 'Type of media: image or video';
COMMENT ON COLUMN media_challenges.prompt IS 'The actual AI prompt used to generate this media';
COMMENT ON COLUMN media_challenges.metadata IS 'JSON field for media-specific metadata (duration, resolution, etc)';


