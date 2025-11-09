# ✅ Database Update Complete - Media Support Added!

Your database schema has been updated to support **both images AND videos**!

## 📦 What Was Created

### 1. New Database Schema (`frontend/supabase/schema-v2.sql`)
- ✅ `media_challenges` table - unified table for images and videos
- ✅ Supports `media_type`: 'image' or 'video'
- ✅ Flexible `metadata` JSONB field for media-specific data
- ✅ Helper functions for random challenge selection
- ✅ Proper indexes for performance

### 2. Migration Script (`frontend/supabase/migration-to-v2.sql`)
- ✅ Safely migrates existing `images` data to `media_challenges`
- ✅ Updates `guesses` table to reference new structure
- ✅ Verification queries to check migration success
- ✅ Preserves all existing data

### 3. Updated TypeScript Types (`frontend/types/supabase-v2.ts`)
- ✅ `MediaChallenge` type (replaces ImageChallenge)
- ✅ `MediaType` = 'image' | 'video'
- ✅ `ImageMetadata` and `VideoMetadata` interfaces
- ✅ Helper type guards for type safety
- ✅ Updated API request/response types

### 4. Migration Guide (`frontend/supabase/MIGRATION_GUIDE.md`)
- ✅ Step-by-step migration instructions
- ✅ Backup procedures
- ✅ Usage examples
- ✅ Rollback instructions if needed

## 🎯 Database Structure

### media_challenges Table

```sql
CREATE TABLE media_challenges (
  id UUID PRIMARY KEY,
  media_url TEXT NOT NULL,           -- Image or video URL
  media_type TEXT NOT NULL,          -- 'image' or 'video'
  prompt TEXT NOT NULL,              -- The AI prompt
  difficulty TEXT,                   -- 'easy', 'medium', 'hard'
  metadata JSONB DEFAULT '{}',       -- Flexible media data
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP
);
```

### Example Data

**Image:**
```json
{
  "media_url": "https://example.com/image.png",
  "media_type": "image",
  "prompt": "A futuristic city at sunset",
  "metadata": {
    "width": 1024,
    "height": 1024,
    "format": "png"
  }
}
```

**Video:**
```json
{
  "media_url": "https://example.com/video.mp4",
  "media_type": "video",
  "prompt": "A cat playing with yarn",
  "metadata": {
    "duration": 30,
    "resolution": "1080p",
    "format": "mp4"
  }
}
```

## 🚀 Next Steps

### 1. Run the Migration in Supabase

**Go to your Supabase project:**

1. Navigate to **SQL Editor**
2. Create a new query
3. Copy/paste `frontend/supabase/schema-v2.sql`
4. Run it
5. Then copy/paste `frontend/supabase/migration-to-v2.sql`
6. Run it
7. Check the verification results

### 2. Update Your Code

Replace imports in your files:

```typescript
// Before
import { Database, ImageChallenge } from '@/types/supabase';

// After  
import { Database, MediaChallenge, MediaType } from '@/types/supabase-v2';
```

### 3. Query Examples

**Get images only:**
```typescript
const { data: images } = await supabase
  .from('media_challenges')
  .select('*')
  .eq('media_type', 'image')
  .limit(10);
```

**Get videos only:**
```typescript
const { data: videos } = await supabase
  .from('media_challenges')
  .select('*')
  .eq('media_type', 'video')
  .limit(10);
```

**Get random mixed media:**
```typescript
const { data } = await supabase
  .rpc('get_random_challenges', { 
    media_type_filter: null,  // null = both types
    limit_count: 10 
  });
```

## ✨ Benefits

1. **Unified Structure**: One table for all media types
2. **Flexible**: JSONB metadata supports any media-specific data
3. **Type Safe**: TypeScript types differentiate images vs videos
4. **Performant**: Indexes on media_type and is_active
5. **Future Proof**: Easy to add new media types (3D, audio, etc.)

## 🎬 Ready for Veo!

Your database is now ready to store video challenges! Next we can:

1. ✅ Set up Veo video generation API
2. ✅ Create video generation scripts
3. ✅ Update frontend components to display videos
4. ✅ Wire up video challenges to your game

## 📋 Files Created

```
frontend/
├── supabase/
│   ├── schema-v2.sql              # New database schema
│   ├── migration-to-v2.sql        # Migration script
│   └── MIGRATION_GUIDE.md         # Detailed guide
└── types/
    └── supabase-v2.ts             # Updated TypeScript types
```

## ⚠️ Important Notes

1. **Backup First**: Always backup your database before migration
2. **Test Locally**: Test the migration on a dev/staging database first
3. **Verify Results**: Check the verification queries after migration
4. **Keep Old Files**: Don't delete old schema files until everything works
5. **Update Gradually**: You can update your code file-by-file

## 🎉 Summary

Your database now supports:
- ✅ Images (DALL-E, existing data)
- ✅ Videos (Veo - ready to add)
- ✅ Flexible metadata for each media type
- ✅ Type-safe TypeScript interfaces
- ✅ Easy queries for specific media types

**Ready to set up Veo video generation?** Let me know when you've run the migration! 🚀


