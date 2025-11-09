#!/usr/bin/env python3
"""
Python script to generate videos using Google Veo
Called by Node.js/TypeScript scripts
"""

import sys
import time
import os
import json
import base64
from google import genai

def generate_video(prompt, api_key, model="veo-3.1-fast-generate-preview"):
    """Generate a video using Google Veo and return base64 encoded data"""
    
    try:
        client = genai.Client(api_key=api_key)
        
        print(f"🎬 Generating video with Veo...", file=sys.stderr)
        print(f"   Prompt: {prompt}", file=sys.stderr)
        print(f"   Model: {model}", file=sys.stderr)
        print(f"   ⏳ This may take 1-2 minutes...", file=sys.stderr)
        
        # Start video generation
        operation = client.models.generate_videos(
            model=model,
            prompt=prompt,
        )
        
        # Poll until complete
        poll_count = 0
        while not operation.done:
            poll_count += 1
            if poll_count % 3 == 0:  # Log every 30 seconds
                print(f"   Still generating... ({poll_count * 10}s elapsed)", file=sys.stderr)
            time.sleep(10)
            operation = client.operations.get(operation)
        
        print(f"   ✅ Video generated! (took ~{poll_count * 10}s)", file=sys.stderr)
        
        # Get the generated video
        generated_video = operation.response.generated_videos[0]
        
        # Save to temporary file first (same as working example)
        temp_path = "/tmp/temp_veo_video.mp4"
        client.files.download(file=generated_video.video)
        generated_video.video.save(temp_path)
        
        # Read the video data from file
        with open(temp_path, 'rb') as f:
            video_data = f.read()
        
        # Convert to base64
        video_base64 = base64.b64encode(video_data).decode('utf-8')
        
        # Return JSON response
        result = {
            "success": True,
            "video": video_base64,
            "mimeType": "video/mp4",
            "size": len(video_data),
            "model": model
        }
        
        print(json.dumps(result))
        return 0
        
    except Exception as e:
        error_result = {
            "success": False,
            "error": str(e)
        }
        print(json.dumps(error_result))
        return 1

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({
            "success": False,
            "error": "Usage: python generate-video-python.py <prompt> <api_key> [model]"
        }))
        sys.exit(1)
    
    prompt = sys.argv[1]
    api_key = sys.argv[2]
    model = sys.argv[3] if len(sys.argv) > 3 else "veo-3.1-fast-generate-preview"
    
    sys.exit(generate_video(prompt, api_key, model))

