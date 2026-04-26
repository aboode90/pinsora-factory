import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as dotenv from "dotenv";

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// ─── Trending Tags (Millions of searches monthly) ────────────────────────────

const trendingTags = [
  // 🔥 Top Pinterest searches
  "nails", "hairstyles", "outfit-ideas", "wallpaper", "aesthetic-wallpaper",
  "iphone-wallpaper", "anime", "drawing-ideas", "tattoo-ideas", "makeup",
  "bedroom-ideas", "quotes", "vision-board", "flowers", "memes",

  // 💅 Beauty & Nails
  "nail-ideas", "nail-art", "acrylic-nails", "gel-nails", "nail-designs",
  "short-nails", "long-nails", "french-nails", "ombre-nails", "nail-inspo",
  "hair-inspo", "haircut", "hair-color", "blonde-hair", "curly-hair",
  "braids", "hair-ideas", "balayage", "highlights", "hair-transformation",
  "makeup-look", "eye-makeup", "lip-color", "glam-makeup", "no-makeup",
  "skincare-routine", "glow-up", "beauty-tips", "self-care",

  // 👗 Fashion & Outfits
  "ootd", "outfit", "style-inspo", "fashion-inspo", "streetwear",
  "old-money-outfit", "coquette", "dark-academia", "light-academia",
  "preppy-style", "y2k-fashion", "90s-fashion", "boho-style", "chic",
  "casual-outfit", "summer-outfit", "winter-outfit", "fall-outfit",
  "spring-outfit", "party-outfit", "date-night-outfit", "work-outfit",

  // 🏠 Home & Decor
  "bedroom-decor", "aesthetic-room", "room-ideas", "home-decor-ideas",
  "living-room-ideas", "kitchen-ideas", "bathroom-decor", "cozy-room",
  "pink-room", "white-room", "dark-room-aesthetic", "boho-room",
  "minimalist-room", "luxury-room", "dorm-room", "apartment-ideas",
  "homedecorloading", "interior-inspo", "home-inspiration",

  // 🍔 Food & Recipes
  "recipes", "dinner-ideas", "lunch-ideas", "breakfast-ideas", "food-inspo",
  "healthy-recipes", "easy-recipes", "dessert-recipes", "baking-recipes",
  "meal-prep", "aesthetic-food", "food-photography", "coffee-aesthetic",
  "smoothie", "salad-recipes", "pasta-recipes", "cake-ideas",

  // ✏️ Art & Drawing
  "drawing-ideas", "art-inspo", "sketch", "procreate", "digital-drawing",
  "anime-art", "character-design", "illustration", "art-tutorial",
  "drawing-tutorial", "cute-drawings", "easy-drawings", "realistic-drawing",
  "portrait-drawing", "manga", "chibi",

  // 🌿 Lifestyle & Wellness
  "self-care-routine", "glow-up-tips", "vision-board-ideas", "manifestation",
  "journal-ideas", "bullet-journal", "study-inspo", "study-aesthetic",
  "productivity", "morning-routine", "night-routine", "mental-health",
  "positive-vibes", "mindset", "affirmations",

  // 🎨 Aesthetic Trends (Gen Z)
  "pink-aesthetic", "blue-aesthetic", "purple-aesthetic", "green-aesthetic",
  "black-aesthetic", "white-aesthetic", "beige-aesthetic", "red-aesthetic",
  "coquette-aesthetic", "pinterest-girl", "that-girl", "clean-girl",
  "soft-life", "mob-wife", "quiet-luxury", "old-money", "coastal-grandmother",
  "dark-feminine", "light-feminine", "angel-aesthetic",

  // 📱 Wallpapers
  "cute-wallpapers", "aesthetic-wallpapers", "iphone-wallpapers",
  "android-wallpaper", "lock-screen", "home-screen", "wallpaper-4k",
  "nature-wallpaper", "anime-wallpaper", "dark-wallpaper", "pink-wallpaper",
  "minimalist-wallpaper", "flower-wallpaper", "sky-wallpaper",

  // 💍 Tattoos & Body Art
  "tattoo-ideas", "small-tattoo", "minimalist-tattoo", "flower-tattoo",
  "butterfly-tattoo", "moon-tattoo", "sun-tattoo", "quote-tattoo",
  "fine-line-tattoo", "watercolor-tattoo", "sleeve-tattoo",

  // 🌸 Nature & Flowers
  "flower-aesthetic", "rose", "sunflower", "cherry-blossom", "lavender",
  "garden", "botanical", "plant-mom", "floral", "wildflowers",
];

// ─── New High-Demand Categories ───────────────────────────────────────────────

const newCategories = [
  {
    name: "Nails & Nail Art",
    slug: "nails-nail-art",
    description: "Nail designs, nail art ideas and manicure inspiration",
    sortOrder: 26,
    children: [
      { name: "Acrylic Nails", slug: "acrylic-nails" },
      { name: "Gel Nails", slug: "gel-nails" },
      { name: "Nail Designs", slug: "nail-designs" },
      { name: "French Nails", slug: "french-nails" },
      { name: "Short Nails", slug: "short-nails" },
    ],
  },
  {
    name: "Outfits & Style",
    slug: "outfits-style",
    description: "Daily outfit ideas, OOTD and fashion inspiration",
    sortOrder: 27,
    children: [
      { name: "OOTD", slug: "ootd" },
      { name: "Old Money Style", slug: "old-money-style" },
      { name: "Coquette Fashion", slug: "coquette-fashion" },
      { name: "Dark Academia", slug: "dark-academia" },
      { name: "Casual Outfits", slug: "casual-outfits" },
    ],
  },
  {
    name: "Vision Board",
    slug: "vision-board",
    description: "Vision board ideas, manifestation and goal setting",
    sortOrder: 28,
    children: [
      { name: "2025 Vision Board", slug: "2025-vision-board" },
      { name: "Manifestation", slug: "manifestation" },
      { name: "Goals & Dreams", slug: "goals-dreams" },
      { name: "Luxury Vision Board", slug: "luxury-vision-board" },
    ],
  },
  {
    name: "Tattoo Ideas",
    slug: "tattoo-ideas",
    description: "Tattoo designs, small tattoos and body art inspiration",
    sortOrder: 29,
    children: [
      { name: "Small Tattoos", slug: "small-tattoos" },
      { name: "Minimalist Tattoos", slug: "minimalist-tattoos" },
      { name: "Flower Tattoos", slug: "flower-tattoos" },
      { name: "Fine Line Tattoos", slug: "fine-line-tattoos" },
    ],
  },
  {
    name: "Drawing & Sketching",
    slug: "drawing-sketching",
    description: "Drawing ideas, sketches, tutorials and art inspiration",
    sortOrder: 30,
    children: [
      { name: "Anime Drawing", slug: "anime-drawing" },
      { name: "Portrait Drawing", slug: "portrait-drawing" },
      { name: "Easy Drawings", slug: "easy-drawings" },
      { name: "Procreate Art", slug: "procreate-art" },
      { name: "Character Design", slug: "character-design" },
    ],
  },
];

async function main() {
  console.log("🚀 Adding trending tags and high-demand categories...\n");

  // Add trending tags
  console.log(`🏷️  Adding ${trendingTags.length} trending tags...`);
  let added = 0;
  for (const tagName of trendingTags) {
    await prisma.tag.upsert({
      where: { slug: tagName },
      update: {},
      create: { name: tagName, slug: tagName },
    });
    added++;
    if (added % 20 === 0) console.log(`   ✅ ${added}/${trendingTags.length} tags added...`);
  }
  console.log(`✅ All ${trendingTags.length} trending tags added!\n`);

  // Add new categories
  console.log("📂 Adding new high-demand categories...");
  for (const cat of newCategories) {
    const parent = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description, sortOrder: cat.sortOrder },
      create: { name: cat.name, slug: cat.slug, description: cat.description, sortOrder: cat.sortOrder },
    });
    console.log(`✅ Category: ${cat.name}`);

    for (const child of cat.children) {
      await prisma.category.upsert({
        where: { slug: child.slug },
        update: { name: child.name, parentId: parent.id },
        create: { name: child.name, slug: child.slug, parentId: parent.id },
      });
      console.log(`   └─ ${child.name}`);
    }
  }

  console.log("\n🎉 Done!");
  console.log(`✅ ${trendingTags.length} trending tags`);
  console.log(`✅ ${newCategories.length} new categories`);
  console.log(`✅ ${newCategories.reduce((a, c) => a + c.children.length, 0)} subcategories`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
