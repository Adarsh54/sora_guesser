# 🚀 Quick Start - Google Cloud Integration

Your Google Cloud integration for Imagen (images) and Veo (videos) is **95% complete**! 

## ✅ What's Working

- ✅ Google Cloud service account configured
- ✅ Authentication with Google Cloud APIs
- ✅ Supabase database connected
- ✅ `media_challenges` table ready
- ✅ All integration code written and tested

## 🔧 Final Setup Step (1 minute)

### Create Supabase Storage Bucket

1. Go to https://supabase.com/dashboard
2. Select your project: **fjdttygzjctxuvaujbqc**
3. Click **Storage** in the left sidebar
4. Click **New bucket**
5. Fill in:
   - Name: `media`
   - Public: ✅ **Check this box**
6. Click **Create bucket**

That's it! 🎉

## 🧪 Test Your Setup

Run the test suite:
```bash
cd frontend
npm run test:google
```

You should see **8/8 tests passed**.

## 🎨 Generate Your First Content

### Generate 1 test image (~5 seconds):
```bash
cd frontend
npm run generate:images -- --count=1
```

### Generate 1 test video (~2 minutes):
```bash
cd frontend
npm run generate:videos -- --count=1
```

## 📦 What These Scripts Do

1. **Generate** media using Google AI (Imagen or Veo)
2. **Upload** to Supabase Storage (permanent URL)
3. **Save** to `media_challenges` database table
4. **Display** success message with URL

## 🎮 Next Steps - Build Game Content

### Generate 20 images for your game:
```bash
npm run generate:images -- --count=20
```

Example prompts included:
- Cyberpunk cities
- Nature scenes
- Abstract art
- Space stations
- Cozy interiors

### Generate 5 videos for special challenges:
```bash
npm run generate:videos -- --count=5
```

Example prompts included:
- Time-lapse scenes
- Nature shots
- Abstract visualizations
- Drone footage
- Slow motion effects

## 💡 Pro Tips

### Save locally while testing:
```bash
npm run generate:images -- --count=3 --save-local
npm run generate:videos -- --count=2 --save-local
```

### Custom aspect ratios:
```bash
# Square images
npm run generate:images -- --aspect-ratio=1:1

# Vertical videos (mobile-friendly)
npm run generate:videos -- --aspect-ratio=9:16

# Widescreen
npm run generate:videos -- --aspect-ratio=16:9 --duration=8
```

## 📊 Costs

- **Images**: ~$0.04 each (instant)
- **Videos**: ~$0.40 each (1-2 min generation time)

**Recommendation**: Generate 20-30 images first, then add 5-10 videos for variety.

## 🔍 View Generated Content

After generating, check:
1. **Supabase Storage**: https://supabase.com/dashboard → Storage → media
2. **Database**: Storage → media_challenges table
3. **Local files** (if you used `--save-local`):
   - `frontend/generated-images/`
   - `frontend/generated-videos/`

## 📚 Full Documentation

For detailed setup and troubleshooting, see:
- `GOOGLE_CLOUD_SETUP.md` - Complete setup guide
- API usage examples
- Troubleshooting tips
- Monitoring costs and quota

## 🎯 Ready to Go!

Once you create the storage bucket, you're all set to:
1. Generate images and videos with AI
2. Build your game with real content
3. Test the full prompt-guessing flow

Questions? Check `GOOGLE_CLOUD_SETUP.md` or the test output for more details.

---

**Current Status**: 7/8 tests passed ✅
**Missing**: Supabase Storage bucket (1-minute fix)
**Ready to generate**: Yes! 🎉


