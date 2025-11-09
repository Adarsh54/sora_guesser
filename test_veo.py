import time
import os
from google import genai
from google.genai import types

# Set API key from environment
api_key = os.getenv('GEMINI_API_KEY', 'AIzaSyAh0UtBil9lWH6pknky5J9FUk2vOeDfcyM')
client = genai.Client(api_key=api_key)

prompt = """A time-lapse of a city transitioning from day to night, with lights turning on across buildings"""

print("🎬 Generating video with Veo...")
print(f"   Prompt: {prompt}")
print("   ⏳ This may take 1-2 minutes...\n")

operation = client.models.generate_videos(
    model="veo-3.1-generate-preview",
    prompt=prompt,
)

# Poll the operation status until the video is ready.
while not operation.done:
    print("   Waiting for video generation to complete...")
    time.sleep(10)
    operation = client.operations.get(operation)

print("\n   ✅ Video generated!")

# Download the generated video.
generated_video = operation.response.generated_videos[0]
client.files.download(file=generated_video.video)
generated_video.video.save("test_video.mp4")

print(f"   💾 Saved to test_video.mp4")
print(f"   📊 File size: {os.path.getsize('test_video.mp4') / (1024*1024):.2f} MB")


