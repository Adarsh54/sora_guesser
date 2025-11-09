# 🔄 Database Migration Guide: V1 → V2

## Overview

This migration updates your database to support **both images and videos** in a unified `media_challenges` table.

### What Changed?

**Before (V1):**
- `images` table - only supported images
- `guesses.image_id` - referenced images table

**After (V2):**
- `media_challenges` table - supports both images AND videos
- `guesses.media_id` - references media_challenges table
- Added `media_type` column ('image' or 'video')
- Added `metadata` JSONB column for flexible media-specific data

## 🚀 Migration Steps

### Step 1: Backup Your Data (IMPORTANT!)

Before running any migration, backup your database:

```bash
# In Supabase Dashboard:
# Settings → Database → Backups → Create Backup
```

Or export your data:

```sql
-- Export existing images
COPY images TO '/tmp/images_backup.csv' CSV HEADER;

-- Export existing guesses
COPY guesses TO '/tmp/guesses_backup.csv' CSV HEADER;
```

### Step 2: Run the New Schema

1. Go to **Supabase SQL Editor**
2. Copy and paste contents of `schema-v2.sql`
3. Click **Run**

This will create:
- ✅ `media_challenges` table (new)
- ✅ Updated `guesses` table structure
- ✅ Helper functions for random challenges
- ✅ Indexes for performance

### Step 3: Migrate Existing Data

1. In **Supabase SQL Editor**
2. Copy and paste contents of `migration-to-v2.sql`
3. Click **Run**

This will:
- ✅ Copy all data from `images` → `media_challenges`
- ✅ Update `guesses` to use `media_id` instead of `image_id`
- ✅ Show verification results

### Step 4: Verify Migration

Check the results at the end of the migration script:

```sql
-- Should show:
-- Total media challenges: X
-- Image challenges: X
-- Video challenges: 0 (none yet)
-- Total guesses: X
```

All your existing images should now be in `media_challenges` with `media_type = 'image'`.

### Step 5: Update Your Application

Update your imports to use the new types:

```typescript
// Before
import { Database, ImageChallenge } from '@/types/supabase';

// After
import { Database, MediaChallenge, MediaType } from '@/types/supabase-v2';
```

### Step 6: (Optional) Clean Up Old Tables

**⚠️ ONLY DO THIS AFTER VERIFYING EVERYTHING WORKS!**

```sql
-- Drop old images table (already copied to media_challenges)
DROP TABLE IF EXISTS images CASCADE;

-- Remove old image_id column from guesses
ALTER TABLE guesses DROP COLUMN IF EXISTS image_id;
```

## 📊 New Database Structure

### media_challenges Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `media_url` | TEXT | URL to image or video |
| `media_type` | TEXT | 'image' or 'video' |
| `prompt` | TEXT | The AI prompt used |
| `difficulty` | TEXT | 'easy', 'medium', 'hard' |
| `metadata` | JSONB | Flexible media data |
| `is_active` | BOOLEAN | Show/hide challenges |
| `created_at` | TIMESTAMP | Creation time |

### Example Data

**Image Challenge:**
```json
{
  "media_url": "https://example.com/image.png",
  "media_type": "image",
  "prompt": "A futuristic city at sunset",
  "difficulty": "medium",
  "metadata": {
    "width": 1024,
    "height": 1024,
    "format": "png"
  }
}
```

**Video Challenge:**
```json
{
  "media_url": "https://example.com/video.mp4",
  "media_type": "video",
  "prompt": "A cat playing with yarn in slow motion",
  "difficulty": "hard",
  "metadata": {
    "duration": 30,
    "resolution": "1080p",
    "format": "mp4",
    "fps": 30
  }
}
```

## 🔧 Using the New Schema

### Query Images Only

```typescript
const { data: images } = await supabase
  .from('media_challenges')
  .select('*')
  .eq('media_type', 'image')
  .eq('is_active', true)
  .limit(10);
```

### Query Videos Only

```typescript
const { data: videos } = await supabase
  .from('media_challenges')
  .select('*')
  .eq('media_type', 'video')
  .eq('is_active', true)
  .limit(10);
```

### Query All Media (Mixed)

```typescript
const { data: allMedia } = await supabase
  .from('media_challenges')
  .select('*')
  .eq('is_active', true)
  .limit(10);
```

### Use Helper Function for Random Challenges

```typescript
// Get random images
const { data: randomImages } = await supabase
  .rpc('get_random_challenges', { 
    media_type_filter: 'image',
    limit_count: 5 
  });

// Get random videos
const { data: randomVideos } = await supabase
  .rpc('get_random_challenges', { 
    media_type_filter: 'video',
    limit_count: 5 
  });

// Get random mixed media
const { data: randomMixed } = await supabase
  .rpc('get_random_challenges', { 
    media_type_filter: null,
    limit_count: 10 
  });
```

### Insert New Challenges

**Image:**
```typescript
import { MediaChallengeInsert } from '@/types/supabase-v2';

const newImage: MediaChallengeInsert = {
  media_url: "https://example.com/generated-image.png",
  media_type: "image",
  prompt: "A magical forest with glowing mushrooms",
  difficulty: "medium",
  metadata: {
    width: 1024,
    height: 1024,
    format: "png"
  }
};

await supabase.from('media_challenges').insert(newImage);
```

**Video:**
```typescript
const newVideo: MediaChallengeInsert = {
  media_url: "https://example.com/generated-video.mp4",
  media_type: "video",
  prompt: "A time-lapse of flowers blooming",
  difficulty: "hard",
  metadata: {
    duration: 15,
    resolution: "1080p",
    format: "mp4",
    fps: 30
  }
};

await supabase.from('media_challenges').insert(newVideo);
```

## ✅ Benefits of V2

1. **Unified Table**: One table for all media types
2. **Flexible Metadata**: JSONB field supports any media-specific data
3. **Type Safety**: TypeScript types for images vs videos
4. **Future Proof**: Easy to add new media types later
5. **Better Queries**: Filter by media type, get random challenges
6. **Performance**: Proper indexes on media_type and is_active

## 🔄 Rollback (If Needed)

If something goes wrong, you can rollback:

```sql
-- Restore from backup
-- (Use Supabase Dashboard → Backups → Restore)

-- Or manually recreate old structure
CREATE TABLE images AS 
SELECT 
  id,
  media_url as image_url,
  prompt,
  difficulty,
  created_at
FROM media_challenges
WHERE media_type = 'image';
```

## 📞 Need Help?

If you encounter issues:
1. Check Supabase logs for errors
2. Verify your backup exists
3. Review the verification query results
4. Don't drop old tables until everything works!

## 🎉 You're Done!

Your database now supports both images and videos! Next steps:
- Add Veo video generation integration
- Update API routes to handle both media types
- Update frontend components to display videos


