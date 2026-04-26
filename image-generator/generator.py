"""
Pinsora Auto Image Generator
=============================
- Connects to Supabase PostgreSQL
- Fetches all categories
- Generates 1 image per minute using Leonardo.ai FLUX Schnell
- Target: 5 images per category
- Saves image URL directly to database
"""

import os
import sys
import time
import json
import random
import requests
import psycopg2
import boto3
import argparse
from botocore.config import Config

# ─── Config ──────────────────────────────────────────────────────────────────

# Fetch from environment (GitHub Secrets) or use hardcoded fallback
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres.bfifpivnhtdswzdqgpbf:Ali%40313%40Ali@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres?sslmode=require")
LEONARDO_API_KEY = os.getenv("LEONARDO_API_KEY", "febe17a1-ed86-40ac-99bc-a5f8a4d9f61f")
FLUX_SCHNELL_MODEL_ID = "1dd50843-d653-4516-a8e3-f0238ee453ff"

# Cloudflare R2
R2_ACCOUNT_ID = os.getenv("R2_ACCOUNT_ID", "4c3a678caafd0d440953401f0dfeb90b")
R2_ACCESS_KEY_ID = os.getenv("R2_ACCESS_KEY_ID", "b9f3d619c73950e91a4cbb0adb9098b4")
R2_SECRET_ACCESS_KEY = os.getenv("R2_SECRET_ACCESS_KEY", "bd07c85a2d10b55bcc73a1eca2d684a183e7470c3e696aad349a73057447e6fb")
R2_BUCKET_NAME = os.getenv("R2_BUCKET_NAME", "pinsora")
R2_PUBLIC_URL = os.getenv("R2_PUBLIC_URL", "https://pub-20e27c6bae2741a69bbcef7e9fbdf6ce.r2.dev")

TARGET_IMAGES_PER_CATEGORY = 5
INTERVAL_SECONDS = 60  # 1 minute between generations (faster growth)
ADMIN_USER_EMAIL = "curator@pinsora.com"
BOT_EMAIL_PREFIX = "bot_"  # Matches our seed bot emails

# ─── Prompts per category ─────────────────────────────────────────────────────

CATEGORY_PROMPTS = {
    "art-illustration": [
        "stunning digital artwork with vibrant colors and intricate details, professional illustration",
        "beautiful watercolor painting with soft colors and artistic brushstrokes",
        "detailed concept art with dramatic lighting and rich textures",
        "creative digital illustration with surreal elements and vivid colors",
        "professional artwork with elegant composition and stunning visual impact",
    ],
    "photography": [
        "professional portrait photography with perfect lighting and bokeh background",
        "stunning street photography capturing authentic human moments",
        "breathtaking landscape photography with golden hour lighting",
        "dramatic black and white photography with strong contrast",
        "award-winning wildlife photography in natural habitat",
    ],
    "nature": [
        "breathtaking forest landscape with morning mist and sunlight rays",
        "stunning ocean sunset with dramatic clouds and golden reflections",
        "majestic mountain peaks covered in snow with clear blue sky",
        "beautiful waterfall surrounded by lush tropical vegetation",
        "colorful wildflower meadow with butterflies in soft sunlight",
    ],
    "architecture": [
        "stunning modern architecture with glass and steel, dramatic sky",
        "beautiful historical building with intricate stone carvings",
        "elegant interior design with natural light and minimalist aesthetic",
        "dramatic urban cityscape at night with glowing lights",
        "iconic bridge architecture with perfect symmetry and reflection",
    ],
    "travel": [
        "stunning travel destination with iconic landmarks and blue sky",
        "beautiful European cobblestone street with colorful buildings",
        "exotic Asian temple surrounded by lush tropical gardens",
        "breathtaking aerial view of tropical island paradise",
        "vibrant Middle Eastern market with colorful spices and textiles",
    ],
    "fashion-style": [
        "high fashion editorial photography with elegant model and designer outfit",
        "stylish street fashion photography in urban setting",
        "luxury fashion accessories with perfect studio lighting",
        "vintage fashion photography with retro aesthetic and warm tones",
        "modern minimalist fashion with clean lines and neutral colors",
    ],
    "food-drink": [
        "beautiful food photography of gourmet dessert with perfect plating",
        "stunning coffee art in ceramic cup with warm bokeh background",
        "colorful healthy food bowl with fresh ingredients and vibrant colors",
        "elegant cocktail photography with dramatic lighting and garnish",
        "artisan bread and pastries with rustic wooden background",
    ],
    "graphic-design": [
        "stunning typographic poster design with bold colors and creative layout",
        "professional logo design with clean lines and modern aesthetic",
        "creative branding identity with cohesive color palette",
        "beautiful infographic design with clear visual hierarchy",
        "modern UI design mockup with clean interface and vibrant colors",
    ],
    "animals-pets": [
        "adorable golden retriever puppy with soft fur and happy expression",
        "majestic lion in natural habitat with dramatic golden light",
        "cute cat with striking eyes in cozy indoor setting",
        "beautiful bird with colorful plumage in tropical forest",
        "elegant horse running freely in open field at sunset",
    ],
    "technology": [
        "futuristic technology workspace with multiple screens and glowing lights",
        "sleek modern gadgets and devices with clean minimalist background",
        "cyberpunk cityscape with neon lights and futuristic architecture",
        "AI and technology concept with digital neural network visualization",
        "professional gaming setup with RGB lighting and high-end equipment",
    ],
    "minimal-abstract": [
        "minimalist composition with clean lines and perfect negative space",
        "abstract art with flowing colors and geometric shapes",
        "beautiful geometric pattern with precise symmetry and bold colors",
        "elegant texture photography with subtle details and soft tones",
        "minimalist still life with single object and perfect lighting",
    ],
    "dark-moody": [
        "dramatic dark fantasy scene with mysterious atmosphere and fog",
        "gothic architecture with dramatic storm clouds and lightning",
        "moody noir photography with dramatic shadows and contrast",
        "dark atmospheric forest with mysterious light rays",
        "cinematic dark scene with dramatic lighting and emotional depth",
    ],
    "wallpapers": [
        "stunning 4K wallpaper with breathtaking landscape and vivid colors",
        "beautiful abstract wallpaper with flowing colors and patterns",
        "epic space wallpaper with galaxy and nebula in stunning detail",
        "minimalist desktop wallpaper with clean design and soft gradient",
        "dramatic nature wallpaper with perfect composition and lighting",
    ],
    "people-lifestyle": [
        "authentic lifestyle photography of happy people in natural setting",
        "fitness and wellness photography with energetic and healthy vibe",
        "beautiful family moment captured with warm natural lighting",
        "cultural celebration photography with vibrant colors and joy",
        "candid street portrait with authentic emotion and character",
    ],
    "space-science": [
        "stunning galaxy photograph with colorful nebula and thousands of stars",
        "dramatic planet surface with alien landscape and space backdrop",
        "beautiful aurora borealis over snowy landscape at night",
        "detailed moon surface photography with dramatic craters",
        "epic space exploration concept with rocket and distant planets",
    ],
    # ─── New Categories ───────────────────────────────────────────────────────
    "aesthetic": [
        "soft dreamy aesthetic photography with pastel colors and gentle light",
        "dark moody aesthetic with vintage tones and artistic composition",
        "cottagecore aesthetic with flowers, nature and cozy rural vibes",
        "y2k aesthetic with retro 2000s style and nostalgic colors",
        "soft girl aesthetic with pink tones, plush toys and dreamy atmosphere",
    ],
    "quotes-typography": [
        "beautiful inspirational quote with elegant typography on minimal background",
        "motivational words with bold modern font design and vibrant colors",
        "love quote with romantic calligraphy and soft floral background",
        "life wisdom quote with artistic handwriting and aesthetic design",
        "daily affirmation with clean typography and pastel gradient background",
    ],
    "home-interior": [
        "cozy minimalist living room with natural light and neutral tones",
        "beautiful bedroom decor with soft lighting and aesthetic details",
        "modern kitchen design with clean lines and premium finishes",
        "boho chic interior with plants, rattan and warm earthy tones",
        "scandinavian home design with white walls and natural wood elements",
    ],
    "fitness-health": [
        "athletic person doing intense workout in modern gym with dramatic lighting",
        "peaceful yoga pose at sunrise on mountain top with scenic view",
        "runner in motion on scenic trail with beautiful nature background",
        "healthy colorful meal prep with fresh vegetables and nutritious food",
        "meditation in serene natural setting with soft morning light",
    ],
    "beauty-makeup": [
        "stunning glamour makeup look with bold eyeshadow and perfect skin",
        "natural glowing skincare routine with fresh clean aesthetic",
        "creative nail art design with intricate patterns and vibrant colors",
        "elegant hairstyle with perfect waves and professional styling",
        "minimalist natural makeup look with dewy skin and soft tones",
    ],
    "cars-vehicles": [
        "stunning supercar on empty road at golden hour with dramatic lighting",
        "luxury sports car in urban setting with city lights reflection",
        "classic vintage car in perfect condition with retro aesthetic",
        "powerful motorcycle on scenic mountain road at sunset",
        "sleek modern electric car with futuristic design and clean lines",
    ],
    "fantasy-sci-fi": [
        "epic fantasy dragon soaring over magical castle in dramatic sky",
        "futuristic sci-fi cityscape with neon lights and flying vehicles",
        "powerful wizard casting spell with magical energy and mystical atmosphere",
        "ancient mythology scene with gods and legendary creatures",
        "steampunk world with mechanical gears, airships and Victorian aesthetic",
    ],
    "wedding-romance": [
        "beautiful bride in elegant wedding dress with soft natural lighting",
        "romantic couple portrait at golden hour with dreamy bokeh background",
        "stunning wedding ceremony decoration with flowers and fairy lights",
        "intimate engagement moment with genuine emotion and beautiful setting",
        "elegant wedding reception with candles, flowers and romantic atmosphere",
    ],
    "street-art-graffiti": [
        "stunning large-scale mural on urban wall with vibrant colors and detail",
        "creative graffiti art with bold colors and expressive street style",
        "beautiful street art installation transforming urban space",
        "colorful wall mural with intricate patterns and artistic vision",
        "urban street art photography capturing culture and creativity",
    ],
    "sunset-sky": [
        "breathtaking golden hour sunset with dramatic clouds and warm colors",
        "stunning sunrise over mountains with pink and orange sky",
        "milky way galaxy visible in clear night sky over dark landscape",
        "dramatic storm clouds with lightning over open landscape",
        "beautiful rainbow after rain with vivid colors against dark sky",
    ],
    # ─── High Demand ──────────────────────────────────────────────────────────
    "nails-nail-art": [
        "stunning acrylic nail art with intricate floral designs and pastel colors",
        "elegant gel nails with ombre effect and glitter accents",
        "creative nail designs with geometric patterns and bold colors",
        "classic french manicure with modern twist and clean finish",
        "short nails with cute minimalist nail art and soft tones",
    ],
    "outfits-style": [
        "stylish old money aesthetic outfit with neutral tones and luxury details",
        "cute coquette fashion look with bows, lace and feminine details",
        "dark academia outfit with layered clothing and vintage aesthetic",
        "casual chic everyday outfit with clean lines and neutral palette",
        "trendy y2k inspired outfit with bold colors and nostalgic style",
    ],
    "vision-board": [
        "luxury vision board with goals, dreams and aspirational lifestyle images",
        "aesthetic manifestation board with positive affirmations and beautiful imagery",
        "2025 goals vision board with travel, fitness and success themes",
        "feminine vision board with soft colors, flowers and dream life aesthetic",
        "minimalist vision board with clean design and powerful intentions",
    ],
    "tattoo-ideas": [
        "delicate small flower tattoo with fine line detail on wrist",
        "minimalist geometric tattoo with clean lines and simple design",
        "beautiful butterfly tattoo with watercolor effect and soft colors",
        "elegant quote tattoo with fine calligraphy script",
        "detailed fine line tattoo with intricate botanical illustration",
    ],
    "drawing-sketching": [
        "beautiful anime character drawing with expressive eyes and detailed hair",
        "realistic portrait sketch with dramatic shading and fine detail",
        "cute easy drawing with simple lines and charming character design",
        "digital procreate artwork with vibrant colors and creative composition",
        "original character design with unique style and artistic vision",
    ],
    "logos": [
        "minimalist professional logo design, vector art, clean lines, white background, no text, no words, typography-free",
        "modern abstract logo mark, geometric shapes, vibrant gradient, sleek design, no text, no words, typography-free",
        "professional branding icon, minimalist aesthetic, vector style, symbol only, no text, no words, typography-free",
        "creative geometric logo design, symmetrical, clean vector, corporate identity, no text, no words, typography-free",
        "elegant luxury logo symbol, minimal lines, premium aesthetic, vector art, no text, no words, typography-free",
    ],
    "logo-design": [
        "modern professional logo, vector symbol, minimalist design, no text, no words, typography-free",
        "creative brand mark, geometric icon, clean vector art, no text, no words, typography-free",
        "abstract logo design, minimalist aesthetic, professional branding, no text, no words, typography-free",
    ],
    "events-invitations": [
        "elegant wedding invitation card template, floral border, luxury aesthetic, clean layout, no text, no words, placeholder for text",
        "modern birthday greeting card design, colorful confetti, minimal style, no text, no words, blank center",
        "professional event invitation background, sophisticated patterns, gold foil details, no text, no words",
        "minimalist save the date card, aesthetic composition, soft colors, no text, no words",
        "creative party invite template, vibrant design elements, clean space for text, no text, no words",
    ],
}

# Default prompts for subcategories
DEFAULT_PROMPTS = [
    "stunning high quality photograph with perfect composition and lighting",
    "beautiful artistic image with vibrant colors and creative vision",
    "professional photography with dramatic lighting and rich details",
    "breathtaking visual with stunning colors and perfect framing",
    "award-winning image with exceptional quality and artistic merit",
]

# ─── R2 Storage ───────────────────────────────────────────────────────────────

def get_r2_client():
    """Create Cloudflare R2 client"""
    return boto3.client(
        "s3",
        endpoint_url=f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
        aws_access_key_id=R2_ACCESS_KEY_ID,
        aws_secret_access_key=R2_SECRET_ACCESS_KEY,
        config=Config(signature_version="s3v4"),
        region_name="auto",
    )


def upload_image_to_r2(image_url, category_slug):
    """Download image from Leonardo and upload to R2"""
    try:
        # Download image
        print(f"   📥 Downloading image...")
        response = requests.get(image_url, timeout=30)
        if not response.ok:
            print(f"   ❌ Failed to download image")
            return None

        image_data = response.content
        content_type = response.headers.get("Content-Type", "image/jpeg")

        # Generate unique key
        timestamp = int(time.time())
        ext = "jpg" if "jpeg" in content_type else "png"
        key = f"images/pinsora-team/{category_slug}-{timestamp}.{ext}"

        # Upload to R2
        print(f"   ☁️  Uploading to R2...")
        r2 = get_r2_client()
        r2.put_object(
            Bucket=R2_BUCKET_NAME,
            Key=key,
            Body=image_data,
            ContentType=content_type,
        )

        public_url = f"{R2_PUBLIC_URL}/{key}"
        print(f"   ✅ Uploaded to R2: {key}")
        return public_url

    except Exception as e:
        print(f"   ❌ R2 upload error: {e}")
        return None


# ─── Database ─────────────────────────────────────────────────────────────────

def get_db_connection():
    """Parse DATABASE_URL and connect to PostgreSQL"""
    url = DATABASE_URL.replace("%40", "@")
    parsed = urlparse(url)
    
    # Re-encode the password
    password = parsed.password
    
    conn = psycopg2.connect(
        host=parsed.hostname,
        port=parsed.port or 5432,
        database=parsed.path.lstrip("/"),
        user=parsed.username,
        password=password,
        sslmode="require",
    )
    return conn


def get_or_create_admin_user(conn):
    """Get or create the admin user for generated images"""
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute('SELECT id FROM users WHERE email = %s', (ADMIN_USER_EMAIL,))
        user = cur.fetchone()
        
        if not user:
            # Create admin user
            cur.execute("""
                INSERT INTO users (id, name, email, username, role, "createdAt", "updatedAt")
                VALUES (gen_random_uuid()::text, 'Pinsora Team', %s, 'pinsora_team', 'ADMIN', NOW(), NOW())
                RETURNING id
            """, (ADMIN_USER_EMAIL,))
            user = cur.fetchone()
            conn.commit()
            print(f"✅ Created AI user: {ADMIN_USER_EMAIL}")
        
        return user["id"]


def get_categories(conn):
    """Get all categories from database"""
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            SELECT id, name, slug, "parentId"
            FROM categories
            ORDER BY "sortOrder" ASC, name ASC
        """)
        return cur.fetchall()


def get_image_count_per_category(conn):
    """Get current image count for each category"""
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            SELECT "categoryId", COUNT(*) as count
            FROM images
            WHERE "isPublished" = true
            GROUP BY "categoryId"
        """)
        rows = cur.fetchall()
        return {row["categoryId"]: row["count"] for row in rows}


def save_image_to_db(conn, user_id, category_id, title, description, image_url, tags):
    """Save generated image to database"""
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        # Insert image
        cur.execute("""
            INSERT INTO images (
                id, title, description, "imageUrl", "thumbnailUrl",
                "categoryId", "userId", "isPublished", "isFeatured",
                "viewCount", "likeCount", "saveCount", "downloadCount",
                "createdAt", "updatedAt"
            )
            VALUES (
                gen_random_uuid()::text, %s, %s, %s, %s,
                %s, %s, true, false,
                0, 0, 0, 0,
                NOW(), NOW()
            )
            RETURNING id
        """, (title, description, image_url, image_url, category_id, user_id))
        
        image = cur.fetchone()
        image_id = image["id"]
        
        # Add tags
        for tag_name in tags:
            tag_slug = tag_name.lower().replace(" ", "-")
            
            # Upsert tag
            cur.execute("""
                INSERT INTO tags (id, name, slug, "createdAt")
                VALUES (gen_random_uuid()::text, %s, %s, NOW())
                ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
                RETURNING id
            """, (tag_name, tag_slug))
            tag = cur.fetchone()
            
            # Link image to tag
            cur.execute("""
                INSERT INTO image_tags ("imageId", "tagId")
                VALUES (%s, %s)
                ON CONFLICT DO NOTHING
            """, (image_id, tag["id"]))
        
        conn.commit()
        return image_id

# ─── Leonardo.ai ──────────────────────────────────────────────────────────────

def generate_image_leonardo(prompt, category_slug="", image_index=0):
    """Generate image using Leonardo.ai FLUX Schnell with varied sizes"""
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {LEONARDO_API_KEY}",
    }

    # All available sizes
    SIZES = [
        {"width": 736,  "height": 1104},  # 0 - portrait 2:3
        {"width": 768,  "height": 1344},  # 1 - portrait 9:16
        {"width": 832,  "height": 1216},  # 2 - portrait 2:3
        {"width": 1024, "height": 768},   # 3 - landscape 4:3
        {"width": 1216, "height": 832},   # 4 - landscape 3:2
        {"width": 1344, "height": 768},   # 5 - landscape 16:9
        {"width": 1024, "height": 1024},  # 6 - square 1:1
        {"width": 832,  "height": 832},   # 7 - square 1:1
        {"width": 768,  "height": 1024},  # 8 - portrait 3:4
        {"width": 640,  "height": 1536},  # 9 - tall portrait 1:2
    ]

    # Preferred sizes per category
    CATEGORY_SIZES = {
        "fashion-style":    [0, 1, 2, 9],
        "people-lifestyle": [0, 1, 2, 9],
        "photography":      [0, 2, 6, 8],
        "art-illustration": [0, 6, 7, 9],
        "nature":           [3, 4, 5, 0],
        "travel":           [3, 4, 5, 0],
        "architecture":     [3, 4, 0, 2],
        "food-drink":       [6, 7, 0, 2],
        "animals-pets":     [0, 2, 6, 3],
        "technology":       [3, 4, 6, 7],
        "minimal-abstract": [6, 7, 3, 0],
        "dark-moody":       [0, 1, 9, 2],
        "wallpapers":       [5, 4, 3, 6],
        "space-science":    [5, 4, 3, 6],
        "graphic-design":   [6, 7, 0, 3],
        # New categories
        "aesthetic":        [0, 1, 2, 9],   # tall portrait
        "quotes-typography":[6, 7, 3, 0],   # square + landscape
        "home-interior":    [3, 4, 0, 6],   # landscape + portrait
        "fitness-health":   [0, 2, 6, 3],   # portrait + square
        "beauty-makeup":    [0, 1, 2, 8],   # tall portrait
        "cars-vehicles":    [3, 4, 5, 6],   # landscape
        "fantasy-sci-fi":   [3, 4, 0, 9],   # landscape + portrait
        "wedding-romance":  [0, 2, 8, 6],   # portrait
        "street-art-graffiti":[3, 4, 6, 0], # landscape + square
        "sunset-sky":       [3, 4, 5, 6],   # landscape
        # High demand
        "nails-nail-art":   [6, 7, 0, 8],   # square + portrait
        "outfits-style":    [0, 1, 2, 8],   # tall portrait
        "vision-board":     [6, 7, 3, 0],   # square + landscape
        "tattoo-ideas":     [0, 8, 6, 2],   # portrait + square
        "drawing-sketching":[6, 0, 7, 2],   # square + portrait
        "events-invitations":[0, 2, 8, 3],  # portrait + card sizes
    }

    preferred = CATEGORY_SIZES.get(category_slug, [0, 3, 6, 2])
    size_index = preferred[image_index % len(preferred)]
    size = SIZES[size_index]

    print(f"   📐 Size: {size['width']}x{size['height']}")

    # Stricter negative prompt for logos
    negative_prompt = "blurry, low quality, distorted, ugly, watermark, text"
    if "logo" in category_slug:
        negative_prompt += ", words, letters, alphabet, typography, font, signature"

    payload = {
        "prompt": prompt,
        "negative_prompt": negative_prompt,
        "modelId": FLUX_SCHNELL_MODEL_ID,
        "width": size["width"],
        "height": size["height"],
        "num_images": 1,
        "public": False,
    }

    print(f"   🎨 Sending request to Leonardo.ai...")
    response = requests.post(
        "https://cloud.leonardo.ai/api/rest/v1/generations",
        headers=headers,
        json=payload,
        timeout=30,
    )

    if not response.ok:
        print(f"   ❌ Leonardo API error: {response.status_code} - {response.text}")
        return None

    data = response.json()
    generation_id = data.get("sdGenerationJob", {}).get("generationId")

    if not generation_id:
        print(f"   ❌ No generation ID returned")
        return None

    print(f"   ⏳ Generation ID: {generation_id} — polling for result...")

    # Step 2: Poll for result
    for attempt in range(20):
        time.sleep(3)

        poll_response = requests.get(
            f"https://cloud.leonardo.ai/api/rest/v1/generations/{generation_id}",
            headers=headers,
            timeout=15,
        )

        if not poll_response.ok:
            continue

        poll_data = poll_response.json()
        generation = poll_data.get("generations_by_pk", {})
        status = generation.get("status")

        if status == "COMPLETE":
            images = generation.get("generated_images", [])
            if images:
                image_url = images[0].get("url")
                print(f"   ✅ Image generated: {image_url[:60]}...")
                return image_url
            return None

        elif status == "FAILED":
            print(f"   ❌ Generation failed")
            return None

        print(f"   ⏳ Status: {status} (attempt {attempt + 1}/20)")

    print(f"   ❌ Generation timed out")
    return None

# ─── Main Loop ────────────────────────────────────────────────────────────────

def get_tags_for_category(category_slug, category_name):
    """Generate relevant tags for a category"""
    base_tags = [category_slug.replace("-", " "), category_name.lower()]
    
    tag_map = {
        "art-illustration": ["art", "illustration", "digital-art", "creative", "design"],
        "photography": ["photography", "photo", "camera", "professional", "artistic"],
        "nature": ["nature", "landscape", "outdoor", "beautiful", "scenic"],
        "architecture": ["architecture", "building", "design", "urban", "structure"],
        "travel": ["travel", "adventure", "explore", "destination", "wanderlust"],
        "fashion-style": ["fashion", "style", "outfit", "clothing", "aesthetic"],
        "food-drink": ["food", "culinary", "delicious", "gourmet", "photography"],
        "graphic-design": ["design", "graphic", "creative", "branding", "visual"],
        "animals-pets": ["animals", "wildlife", "cute", "nature", "photography"],
        "technology": ["technology", "tech", "digital", "modern", "innovation"],
        "minimal-abstract": ["minimal", "abstract", "clean", "aesthetic", "art"],
        "dark-moody": ["dark", "moody", "dramatic", "atmospheric", "cinematic"],
        "wallpapers": ["wallpaper", "4k", "hd", "background", "desktop"],
        "people-lifestyle": ["lifestyle", "people", "authentic", "life", "culture"],
        "space-science": ["space", "galaxy", "universe", "astronomy", "cosmos"],
    }
    
    extra_tags = tag_map.get(category_slug, ["beautiful", "stunning", "high-quality"])
    return list(set(base_tags + extra_tags))[:8]


def generate_natural_title(category_name, category_slug, index):
    """Generate a natural-sounding title with no AI references"""
    titles = {
        "art-illustration": ["Vibrant Digital Artwork", "Creative Illustration", "Colorful Abstract Art", "Expressive Digital Painting", "Modern Art Composition"],
        "photography": ["Portrait in Natural Light", "Candid Street Moment", "Golden Hour Shot", "Dramatic Black & White", "Wildlife in Motion"],
        "nature": ["Morning Mist in the Forest", "Ocean at Sunset", "Mountain Serenity", "Wildflower Meadow", "Cascading Waterfall"],
        "architecture": ["Modern Glass Tower", "Historic Stone Facade", "Minimalist Interior", "City at Night", "Iconic Bridge"],
        "travel": ["Hidden European Alley", "Ancient Asian Temple", "Tropical Island Paradise", "Desert Dunes at Dusk", "Mountain Village"],
        "fashion-style": ["Editorial Fashion Look", "Street Style Moment", "Luxury Accessories", "Vintage Inspired Outfit", "Minimalist Wardrobe"],
        "food-drink": ["Artisan Dessert Creation", "Perfect Morning Coffee", "Fresh & Colorful Bowl", "Handcrafted Cocktail", "Rustic Baked Goods"],
        "graphic-design": ["Bold Typography Poster", "Clean Logo Design", "Brand Identity System", "Creative Poster Art", "Modern UI Concept"],
        "animals-pets": ["Golden Retriever Portrait", "Majestic Lion at Dusk", "Curious Cat Close-Up", "Tropical Bird in Flight", "Wild Horse at Sunset"],
        "technology": ["Modern Workspace Setup", "Sleek Tech Devices", "Neon City Lights", "Digital Innovation", "Gaming Setup"],
        "minimal-abstract": ["Clean Lines Composition", "Abstract Color Flow", "Geometric Harmony", "Subtle Pattern Study", "Texture Detail"],
        "dark-moody": ["Mysterious Forest Path", "Gothic Architecture", "Noir City Scene", "Dramatic Storm Sky", "Cinematic Atmosphere"],
        "wallpapers": ["Breathtaking 4K Landscape", "Abstract Desktop Art", "Epic Space View", "Minimal Clean Background", "Dramatic Nature Scene"],
        "people-lifestyle": ["Authentic Life Moment", "Fitness & Energy", "Family Warmth", "Cultural Celebration", "Urban Portrait"],
        "space-science": ["Distant Galaxy View", "Planet Surface Detail", "Aurora Borealis Night", "Moon Crater Close-Up", "Deep Space Exploration"],
        # New
        "aesthetic":          ["Soft Dreamy Aesthetic", "Dark Moody Vibes", "Cottagecore Moment", "Y2K Nostalgia", "Pastel Aesthetic"],
        "quotes-typography":  ["Words of Wisdom", "Daily Inspiration", "Love in Words", "Motivational Quote", "Beautiful Typography"],
        "home-interior":      ["Cozy Living Space", "Dream Bedroom", "Modern Kitchen", "Boho Home Vibes", "Minimalist Interior"],
        "fitness-health":     ["Gym Motivation", "Yoga at Sunrise", "Trail Running", "Healthy Meal Prep", "Mindful Meditation"],
        "beauty-makeup":      ["Glam Makeup Look", "Natural Glow", "Creative Nail Art", "Perfect Hairstyle", "Minimalist Beauty"],
        "cars-vehicles":      ["Supercar at Sunset", "Luxury on the Road", "Classic Vintage Car", "Mountain Motorcycle", "Electric Future"],
        "fantasy-sci-fi":     ["Dragon Over Castle", "Neon Sci-Fi City", "Wizard's Magic", "Ancient Mythology", "Steampunk World"],
        "wedding-romance":    ["Beautiful Bride", "Golden Hour Romance", "Wedding Ceremony", "Engagement Moment", "Romantic Reception"],
        "street-art-graffiti":["Urban Mural Art", "Graffiti Expression", "Street Art Installation", "Colorful Wall", "Urban Creativity"],
        "sunset-sky":          ["Golden Hour Magic", "Mountain Sunrise", "Milky Way Night", "Storm Drama", "Rainbow After Rain"],
        "nails-nail-art":      ["Floral Nail Art", "Ombre Gel Nails", "Geometric Nail Design", "French Manicure", "Minimalist Nails"],
        "outfits-style":       ["Old Money Look", "Coquette Outfit", "Dark Academia Style", "Casual Chic", "Y2K Fashion"],
        "vision-board":        ["Luxury Vision Board", "Manifestation Board", "2025 Goals", "Dream Life Board", "Minimalist Goals"],
        "tattoo-ideas":        ["Delicate Flower Tattoo", "Minimalist Geometric", "Butterfly Watercolor", "Script Quote Tattoo", "Fine Line Botanical"],
        "drawing-sketching":   ["Anime Character Art", "Realistic Portrait", "Cute Easy Drawing", "Procreate Digital Art", "Character Design"],
        "logos":               ["Minimalist Logo Design", "Abstract Brand Mark", "Modern Business Icon", "Geometric Symbol", "Professional Identity"],
        "events-invitations":  ["Elegant Wedding Card", "Birthday Greeting Design", "Modern Party Invite", "Minimalist Event Card", "Luxury Invitation Template"],
    }
    options = titles.get(category_slug, [
        f"Beautiful {category_name}", f"Stunning {category_name}",
        f"{category_name} Photography", f"Creative {category_name}", f"Inspiring {category_name}"
    ])
    return options[index % len(options)]


def generate_natural_description(category_name, category_slug):
    """Generate a natural description with no AI references"""
    descriptions = {
        "art-illustration": "A stunning piece of digital artwork showcasing vibrant colors, intricate details, and exceptional creative vision.",
        "photography": "A beautifully composed photograph capturing a perfect moment with professional lighting and artistic framing.",
        "nature": "A breathtaking view of the natural world, captured with stunning clarity and an eye for beauty.",
        "architecture": "An impressive architectural image showcasing design excellence, structural beauty, and visual impact.",
        "travel": "A captivating travel image that transports you to an incredible destination with vivid detail.",
        "fashion-style": "A stylish fashion image featuring elegant composition, beautiful styling, and creative direction.",
        "food-drink": "A mouthwatering culinary image with perfect plating, beautiful lighting, and rich visual appeal.",
        "graphic-design": "A professionally crafted design piece with strong visual hierarchy, creative typography, and bold aesthetics.",
        "animals-pets": "A wonderful animal photograph capturing personality, beauty, and the essence of wildlife.",
        "technology": "A sleek technology image showcasing modern innovation, clean design, and digital aesthetics.",
        "minimal-abstract": "A beautifully minimal composition with clean lines, perfect balance, and subtle elegance.",
        "dark-moody": "A dramatic and atmospheric image with deep shadows, rich tones, and cinematic mood.",
        "wallpapers": "A stunning high-resolution image perfect for desktop or mobile wallpaper with exceptional visual quality.",
        "people-lifestyle": "An authentic lifestyle photograph capturing real moments, genuine emotions, and human connection.",
        "space-science": "A magnificent view of the cosmos showcasing the incredible beauty and scale of our universe.",
        # New
        "aesthetic": "A beautifully curated aesthetic image with perfect mood, tones and visual harmony.",
        "quotes-typography": "An inspiring typographic design with beautiful words and elegant visual presentation.",
        "home-interior": "A stunning interior space with thoughtful design, beautiful lighting and cozy atmosphere.",
        "fitness-health": "An energetic and inspiring fitness image capturing strength, wellness and healthy lifestyle.",
        "beauty-makeup": "A stunning beauty image showcasing flawless makeup artistry and natural elegance.",
        "cars-vehicles": "A breathtaking automotive photograph capturing speed, luxury and mechanical beauty.",
        "fantasy-sci-fi": "An epic fantasy or sci-fi scene with incredible world-building and artistic imagination.",
        "wedding-romance": "A beautiful romantic image capturing love, elegance and unforgettable moments.",
        "street-art-graffiti": "A vibrant urban art image showcasing creativity, color and cultural expression.",
        "sunset-sky": "A breathtaking sky photograph capturing nature's most dramatic and colorful moments.",
        "nails-nail-art": "A stunning nail art design with beautiful details, perfect finish and creative inspiration.",
        "outfits-style": "A stylish outfit inspiration with perfect styling, beautiful composition and fashion-forward aesthetic.",
        "vision-board": "A beautifully curated vision board with aspirational imagery, goals and dream life aesthetic.",
        "tattoo-ideas": "A beautiful tattoo design with intricate detail, artistic vision and timeless elegance.",
        "drawing-sketching": "A stunning artwork showcasing exceptional drawing skill, creative vision and artistic expression.",
        "logos": "A professional and clean logo design featuring modern aesthetics, perfect balance, and a strong visual identity.",
        "events-invitations": "An elegant and beautifully designed invitation card perfect for special events and celebrations.",
    }
    return descriptions.get(
        category_slug,
        f"A stunning {category_name.lower()} image with exceptional quality and beautiful composition."
    )


def get_all_bot_users(conn):
    """Fetch all bot user IDs from database"""
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT id FROM users WHERE email LIKE 'bot_%@pinsora.com'")
        rows = cur.fetchall()
        return [row["id"] for row in rows]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--once", action="store_true", help="Generate only one image and exit")
    args = parser.parse_args()

    global TARGET_IMAGES_PER_CATEGORY
    print("=" * 60)
    print("🚀 Pinsora Auto Image Generator")
    print("=" * 60)
    print(f"📋 Target: {TARGET_IMAGES_PER_CATEGORY} images per category")
    print(f"⏱️  Interval: {INTERVAL_SECONDS} seconds between generations")
    print(f"🤖 Model: FLUX Schnell (Leonardo.ai)")
    print("=" * 60)
    
    # Connect to database
    print("\n📡 Connecting to database...")
    conn = get_db_connection()
    print("✅ Connected to Supabase!")
    
    # Get or create bot users
    bot_user_ids = get_all_bot_users(conn)
    if not bot_user_ids:
        print("⚠️  No bot users found! Run seed.ts first.")
        user_id = get_or_create_admin_user(conn)
        bot_user_ids = [user_id]
    else:
        print(f"👥 Found {len(bot_user_ids)} bot accounts ready to post")
    
    # Get all categories
    categories = get_categories(conn)
    print(f"\n📂 Found {len(categories)} categories")
    
    # Process all categories (parents and children)
    active_categories = categories
    print(f"📂 Processing {len(active_categories)} total categories")
    
    total_generated = 0
    cycle = 0
    
    while True:
        cycle += 1
        print(f"\n{'=' * 60}")
        print(f"🔄 Cycle {cycle} — {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"{'=' * 60}")
        
        # Get current counts
        counts = get_image_count_per_category(conn)
        
        # Find categories that still need images
        pending = [
            cat for cat in active_categories
            if counts.get(cat["id"], 0) < TARGET_IMAGES_PER_CATEGORY
        ]
        
        if not pending:
            print("\n🎉 All categories reached target! Increasing target to keep generating...")
            TARGET_IMAGES_PER_CATEGORY += 5
            continue
        
        print(f"📊 Categories still needing images: {len(pending)}")
        
        # Pick next category (rotate through them)
        category = pending[cycle % len(pending)]
        current_count = counts.get(category["id"], 0)
        needed = TARGET_IMAGES_PER_CATEGORY - current_count
        
        print(f"\n🎯 Category: {category['name']}")
        print(f"   Current: {current_count}/{TARGET_IMAGES_PER_CATEGORY} images")
        print(f"   Needed: {needed} more")
        
        # Get prompt for this category
        prompts = CATEGORY_PROMPTS.get(category["slug"])
        if prompts:
            prompt_index = current_count % len(prompts)
            prompt = prompts[prompt_index]
        else:
            # Generate a dynamic smart prompt based on category name
            cat_name = category["name"]
            style = "photograph"
            if any(kw in category["slug"] for kw in ["art", "draw", "sketch", "illustration", "fantasy", "logo"]):
                style = "artwork"

            prompt = f"stunning high quality {cat_name} {style} with perfect composition and lighting, professional visual, highly detailed"

            # Special handling for logos in dynamic prompts
            if "logo" in category["slug"]:
                prompt = f"minimalist professional {cat_name}, vector art, clean lines, white background, no text, no words"

        print(f"   Prompt: {prompt[:80]}...")

        # Pick a random bot user for this post
        current_bot_id = random.choice(bot_user_ids)

        # Generate image with category-specific size
        image_url = generate_image_leonardo(prompt, category["slug"], current_count)
        
        if image_url:
            # Upload to R2 for permanent storage
            permanent_url = upload_image_to_r2(image_url, category["slug"])
            final_url = permanent_url if permanent_url else image_url

            # Prepare metadata — no AI references
            title = generate_natural_title(category["name"], category["slug"], current_count)
            description = generate_natural_description(category["name"], category["slug"])
            tags = get_tags_for_category(category["slug"], category["name"])
            
            # Save to database using the chosen bot
            image_id = save_image_to_db(
                conn, current_bot_id, category["id"],
                title, description, final_url, tags
            )
            
            total_generated += 1
            print(f"   💾 Saved to DB: {image_id}")
            print(f"   📈 Total generated this session: {total_generated}")

            if args.once:
                print("\n✅ Run completed (--once mode). Exiting.")
                conn.close()
                return
        else:
            print(f"   ⚠️  Skipping — will retry next cycle")
        
        # Wait before next generation
        if image_url:
            print(f"\n⏳ Waiting {INTERVAL_SECONDS} seconds before next generation...")
            time.sleep(INTERVAL_SECONDS)
    
    conn.close()
    print("\n✅ Generator finished!")


if __name__ == "__main__":
    main()
