import os
import time
import json
import random
import requests
import psycopg2
import boto3
import argparse
from botocore.config import Config
from psycopg2.extras import RealDictCursor

# ─── Config ──────────────────────────────────────────────────────────────────
DATABASE_URL = os.getenv("DATABASE_URL")
LEONARDO_API_KEY = os.getenv("LEONARDO_API_KEY")
MODEL_ID = "1dd50843-d653-4516-a8e3-f0238ee453ff" # FLUX Schnell

# Cloudflare R2
R2_ACCOUNT_ID = os.getenv("R2_ACCOUNT_ID")
R2_ACCESS_KEY_ID = os.getenv("R2_ACCESS_KEY_ID")
R2_SECRET_ACCESS_KEY = os.getenv("R2_SECRET_ACCESS_KEY")
R2_BUCKET_NAME = os.getenv("R2_BUCKET_NAME")
R2_PUBLIC_URL = os.getenv("R2_PUBLIC_URL")

def get_db_connection():
    return psycopg2.connect(DATABASE_URL, sslmode="require")

def upload_to_r2(image_url, key):
    response = requests.get(image_url, timeout=30)
    if not response.ok: return None

    s3 = boto3.client("s3",
        endpoint_url=f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
        aws_access_key_id=R2_ACCESS_KEY_ID,
        aws_secret_access_key=R2_SECRET_ACCESS_KEY,
        config=Config(signature_version="s3v4"),
        region_name="auto"
    )
    s3.put_object(Bucket=R2_BUCKET_NAME, Key=key, Body=response.content, ContentType="image/jpeg")
    return f"{R2_PUBLIC_URL}/{key}"

def generate_one_image(conn, bot_ids):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        # Pick category
        cur.execute("SELECT id, name, slug FROM categories ORDER BY random() LIMIT 1")
        cat = cur.fetchone()
        
        bot_id = random.choice(bot_ids)
        style = "artistic digital artwork" if any(x in cat["slug"] for x in ["art", "draw", "logo", "fantasy"]) else "professional high-end photograph"

        # Enhanced Smart Prompt
        prompt = (
            f"A masterpiece {cat['name']} {style}, "
            f"exceptional composition, cinematic lighting, ultra-detailed, 8k resolution, "
            f"sharp focus, professional visual, anatomically correct humans, perfect hands with 5 fingers, "
            f"photorealistic textures, vibrant colors, stunning aesthetics"
        )

        if "logo" in cat["slug"]:
            prompt = f"minimalist professional {cat['name']} logo design, vector art, clean white background, symmetrical, high contrast, no text, no words"

        # Negative Prompt elements to ensure quality
        negative_prompt = "deformed, extra fingers, mutated hands, bad anatomy, blurry, low quality, distorted face, extra limbs, watermark, text, signature"

        print(f"🎨 Generating for: {cat['name']}...")
        
        # Call Leonardo with enhanced parameters
        res = requests.post("https://cloud.leonardo.ai/api/rest/v1/generations",
            headers={"Authorization": f"Bearer {LEONARDO_API_KEY}", "Content-Type": "application/json"},
            json={
                "prompt": prompt,
                "negative_prompt": negative_prompt,
                "modelId": MODEL_ID,
                "width": 736,
                "height": 1104,
                "num_images": 1,
                "alchemy": True, # High quality mode if available
                "photoReal": True if style == "photograph" else False
            }
        )
        gen_id = res.json().get("sdGenerationJob", {}).get("generationId")
        if not gen_id: return False

        # Wait & Poll
        for _ in range(10):
            time.sleep(10)
            status = requests.get(f"https://cloud.leonardo.ai/api/rest/v1/generations/{gen_id}",
                headers={"Authorization": f"Bearer {LEONARDO_API_KEY}"}).json()
            img_url = status.get("generations_by_pk", {}).get("generated_images", [{}])[0].get("url")
            if img_url:
                # Upload and Save
                filename = f"ai/{cat['slug']}-{int(time.time())}.jpg"
                public_url = upload_to_r2(img_url, filename)
                cur.execute("""
                    INSERT INTO images (id, title, description, "imageUrl", "categoryId", "userId", "isPublished", "createdAt", "updatedAt")
                    VALUES (gen_random_uuid()::text, %s, %s, %s, %s, %s, true, NOW(), NOW())
                    RETURNING id
                """, (f"{cat['name']} Design", f"Beautiful {cat['name']} inspiration.", public_url, cat["id"], bot_id))
                conn.commit()
                print(f"✅ Saved image to {cat['name']}")
                return True
    return False

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--batch", type=int, default=1, help="Number of images to generate")
    args = parser.parse_args()

    conn = get_db_connection()
    with conn.cursor() as cur:
        cur.execute("SELECT id FROM users WHERE email LIKE 'bot_%'")
        bot_ids = [row[0] for row in cur.fetchall()]

    print(f"🚀 Starting Batch: {args.batch} images")
    success_count = 0
    for i in range(args.batch):
        print(f"\n🔄 Image {i+1}/{args.batch}")
        if generate_one_image(conn, bot_ids):
            success_count += 1
    
    conn.close()
    print(f"\n✨ Done! Generated {success_count} images successfully.")

if __name__ == "__main__":
    main()
