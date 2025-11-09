# Google Cloud Integration Setup Guide

This guide will help you complete the setup for Google Imagen (images) and Veo (videos) integration.

## ✅ What's Already Done

- ✅ Google Cloud service account created (`media-generator-bot@dgenerate.iam.gserviceaccount.com`)
- ✅ Service account key file saved to `.google-credentials/service-account.json`
- ✅ Environment variables configured in `frontend/.env.local`
- ✅ All integration code written:
  - `lib/google-auth.ts` - Authentication helper
  - `lib/google-imagen.ts` - Image generation with Imagen 3
  - `lib/google-veo.ts` - Video generation with Veo 2
  - `app/api/generate-image-google/route.ts` - Image generation API
  - `app/api/generate-video-veo/route.ts` - Video generation API
  - `scripts/generate-google-images.ts` - Batch image generation
  - `scripts/generate-veo-videos.ts` - Batch video generation

## 📋 Required Setup Steps

### Step 1: Enable Vertex AI API

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project: **dgenerate**
3. Navigate to **APIs & Services** > **Library**
4. Search for **Vertex AI API**
5. Click **Enable**

**OR use command line:**
```bash
gcloud services enable aiplatform.googleapis.com --project=dgenerate
```

### Step 2: Grant Service Account Permissions

Your service account needs permission to use Vertex AI:

1. Go to [IAM & Admin](https://console.cloud.google.com/iam-admin/iam)
2. Find `media-generator-bot@dgenerate.iam.gserviceaccount.com`
3. Click **Edit** (pencil icon)
4. Add these roles:
   - **Vertex AI User**
   - **Storage Object Creator** (for any temporary GCS operations)
5. Click **Save**

**OR use command line:**
```bash
gcloud projects add-iam-policy-binding dgenerate \
  --member="serviceAccount:media-generator-bot@dgenerate.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"
```

### Step 3: Create Supabase Storage Bucket

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Storage** in the left sidebar
4. Click **New bucket**
5. Create a public bucket named **media**
6. Configure bucket settings:
   - Name: `media`
   - Public: ✅ (checked)
   - File size limit: 50 MB
   - Allowed MIME types: `image/png, image/jpeg, video/mp4`

**Bucket policies (add these in Storage > Policies):**

For public read access:
```sql
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'media');
```

For authenticated uploads:
```sql
CREATE POLICY "Authenticated uploads" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'media');
```

### Step 4: Verify Environment Variables

Check that `frontend/.env.local` has:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://fjdttygzjctxuvaujbqc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google Cloud Configuration
GOOGLE_PROJECT_ID=dgenerate
GOOGLE_APPLICATION_CREDENTIALS=../.google-credentials/service-account.json
GOOGLE_LOCATION=us-central1
```

## 🧪 Testing the Integration

### Test 1: Authentication
```bash
cd frontend
node -e "require('dotenv').config({ path: '.env.local' }); const { getGoogleAuth } = require('./lib/google-auth.ts'); console.log(getGoogleAuth());"
```

### Test 2: Generate a Single Image
```bash
cd frontend
npm run generate:images -- --count=1
```

This will:
1. Generate 1 image using Google Imagen
2. Upload it to Supabase Storage
3. Save the record to the `media_challenges` table

### Test 3: Generate a Single Video (takes ~2 minutes)
```bash
cd frontend
npm run generate:videos -- --count=1
```

## 🎨 Using the Generation Scripts

### Generate Images

**Generate 5 images (default):**
```bash
npm run generate:images -- --count=5
```

**Generate with custom aspect ratio:**
```bash
npm run generate:images -- --count=3 --aspect-ratio=16:9
```

**Save locally AND upload:**
```bash
npm run generate:images -- --count=5 --save-local
```
(Saves to `frontend/generated-images/`)

### Generate Videos

**Generate 3 videos (default, takes ~6 minutes):**
```bash
npm run generate:videos -- --count=3
```

**Generate with custom settings:**
```bash
npm run generate:videos -- --count=2 --duration=8 --aspect-ratio=9:16
```

**Save locally AND upload:**
```bash
npm run generate:videos -- --count=2 --save-local
```
(Saves to `frontend/generated-videos/`)

## 📝 Using the API Routes

### Generate Image via API
```bash
curl -X POST http://localhost:3000/api/generate-image-google \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A cyberpunk city at night",
    "aspectRatio": "16:9",
    "difficulty": "medium"
  }'
```

### Generate Video via API
```bash
curl -X POST http://localhost:3000/api/generate-video-veo \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Ocean waves at sunset",
    "duration": 5,
    "aspectRatio": "16:9",
    "difficulty": "easy"
  }'
```

## 💰 Pricing Estimates

### Google Imagen 3
- ~$0.04 per image
- 1024x1024 resolution
- Instant generation

### Google Veo 2
- ~$0.30-0.50 per video
- 1080p resolution
- 5-8 seconds duration
- 1-2 minutes to generate

### Recommended Strategy
1. Generate **images** for quick/cheap content testing
2. Generate **videos** for special challenges or premium content
3. Use the scripts to batch-generate during off-peak hours

## 🔧 Troubleshooting

### Error: "Vertex AI API has not been used"
→ Enable the Vertex AI API (Step 1 above)

### Error: "Permission denied"
→ Grant service account the "Vertex AI User" role (Step 2 above)

### Error: "Bucket does not exist"
→ Create the 'media' bucket in Supabase (Step 3 above)

### Error: "GOOGLE_APPLICATION_CREDENTIALS not found"
→ Check that `.google-credentials/service-account.json` exists
→ Verify the path in `.env.local`

### Generation fails silently
→ Check Node.js console for error messages
→ Verify your service account has quota remaining
→ Check Google Cloud Console > Vertex AI for usage/quota

## 📊 Monitoring Usage

**View quota and usage:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **Vertex AI** > **Online prediction**
3. Check **Quotas** tab for:
   - Imagen requests per minute
   - Veo requests per minute

**View costs:**
1. Go to **Billing** > **Reports**
2. Filter by **Vertex AI API**
3. See breakdown by model (Imagen vs Veo)

## 🎯 Next Steps

After completing setup:

1. **Test the integration** with 1 image and 1 video
2. **Generate initial content** for your game:
   - 20-30 images (easy/medium/hard difficulties)
   - 5-10 videos (for special challenges)
3. **Integrate with frontend** components:
   - Update `ImageChallenge.tsx` to use `media_challenges` table
   - Update `VideoChallenge.tsx` to display video challenges
4. **Test the full game flow** with real generated content

## 📚 Documentation Links

- [Vertex AI Imagen API](https://cloud.google.com/vertex-ai/docs/generative-ai/image/overview)
- [Vertex AI Veo API](https://cloud.google.com/vertex-ai/docs/generative-ai/video/overview)
- [Supabase Storage](https://supabase.com/docs/guides/storage)
- [Service Account Keys](https://cloud.google.com/iam/docs/creating-managing-service-account-keys)

---

🎉 You're all set! Run the test commands to verify everything works.


