-- Migration script: images table -> media_challenges table
-- Run this AFTER creating the new schema-v2.sql
-- This will migrate existing data without losing anything

-- Step 1: Migrate existing images to media_challenges
INSERT INTO media_challenges (id, media_url, media_type, prompt, difficulty, metadata, created_at)
SELECT 
  id,
  image_url as media_url,
  'image' as media_type,
  prompt,
  difficulty,
  '{"width": 1024, "height": 1024, "source": "migrated_from_images_table"}'::jsonb as metadata,
  created_at
FROM images
ON CONFLICT (id) DO NOTHING;

-- Step 2: Update guesses table to reference media_challenges
-- First, add the new column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'guesses' AND column_name = 'media_id') THEN
    ALTER TABLE guesses ADD COLUMN media_id UUID;
  END IF;
END $$;

-- Copy image_id to media_id
UPDATE guesses 
SET media_id = image_id 
WHERE media_id IS NULL AND image_id IS NOT NULL;

-- Step 3: Add foreign key constraint to media_id
ALTER TABLE guesses 
DROP CONSTRAINT IF EXISTS guesses_image_id_fkey;

ALTER TABLE guesses 
ADD CONSTRAINT guesses_media_id_fkey 
FOREIGN KEY (media_id) REFERENCES media_challenges(id) ON DELETE CASCADE;

-- Step 4: Create index on media_id if not exists
CREATE INDEX IF NOT EXISTS idx_guesses_media_id ON guesses(media_id);

-- Step 5: Optional - Drop old image_id column after verifying migration
-- UNCOMMENT THESE LINES ONLY AFTER VERIFYING YOUR DATA IS CORRECT
-- ALTER TABLE guesses DROP COLUMN IF EXISTS image_id;
-- DROP TABLE IF EXISTS images CASCADE;

-- Step 6: Verify migration
SELECT 
  'Total media challenges' as description,
  COUNT(*) as count
FROM media_challenges
UNION ALL
SELECT 
  'Image challenges' as description,
  COUNT(*) as count
FROM media_challenges WHERE media_type = 'image'
UNION ALL
SELECT 
  'Video challenges' as description,
  COUNT(*) as count
FROM media_challenges WHERE media_type = 'video'
UNION ALL
SELECT 
  'Total guesses' as description,
  COUNT(*) as count
FROM guesses;

-- Show sample of migrated data
SELECT 
  media_type,
  prompt,
  difficulty,
  metadata,
  created_at
FROM media_challenges
ORDER BY created_at DESC
LIMIT 5;


