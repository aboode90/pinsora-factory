import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as dotenv from "dotenv";

dotenv.config();

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const categories = [
  // ─── Art & Design ─────────────────────────────────────────────────────────
  {
    name: "Art & Illustration",
    slug: "art-illustration",
    description: "Digital art, paintings, drawings and creative illustrations",
    sortOrder: 1,
    children: [
      { name: "Digital Art", slug: "digital-art" },
      { name: "Watercolor", slug: "watercolor" },
      { name: "Oil Painting", slug: "oil-painting" },
      { name: "Sketch & Drawing", slug: "sketch-drawing" },
      { name: "Concept Art", slug: "concept-art" },
      { name: "Fan Art", slug: "fan-art" },
      { name: "Anime & Manga", slug: "anime-manga" },
      { name: "3D Art", slug: "3d-art" },
    ],
  },
  // ─── Photography ──────────────────────────────────────────────────────────
  {
    name: "Photography",
    slug: "photography",
    description: "Professional and artistic photography from around the world",
    sortOrder: 2,
    children: [
      { name: "Portrait", slug: "portrait" },
      { name: "Street Photography", slug: "street-photography" },
      { name: "Landscape Photography", slug: "landscape-photography" },
      { name: "Wildlife Photography", slug: "wildlife-photography" },
      { name: "Macro Photography", slug: "macro-photography" },
      { name: "Black & White", slug: "black-and-white" },
      { name: "Aerial Photography", slug: "aerial-photography" },
      { name: "Night Photography", slug: "night-photography" },
    ],
  },
  // ─── Nature ───────────────────────────────────────────────────────────────
  {
    name: "Nature",
    slug: "nature",
    description: "Beautiful landscapes, wildlife and natural wonders",
    sortOrder: 3,
    children: [
      { name: "Forests", slug: "forests" },
      { name: "Oceans & Beaches", slug: "oceans-beaches" },
      { name: "Mountains", slug: "mountains" },
      { name: "Flowers & Plants", slug: "flowers-plants" },
      { name: "Sunsets & Sunrises", slug: "sunsets-sunrises" },
      { name: "Waterfalls", slug: "waterfalls" },
      { name: "Deserts", slug: "deserts" },
      { name: "Snow & Ice", slug: "snow-ice" },
    ],
  },
  // ─── Architecture ─────────────────────────────────────────────────────────
  {
    name: "Architecture",
    slug: "architecture",
    description: "Buildings, structures and urban design",
    sortOrder: 4,
    children: [
      { name: "Modern Architecture", slug: "modern-architecture" },
      { name: "Historical Buildings", slug: "historical-buildings" },
      { name: "Interior Design", slug: "interior-design" },
      { name: "Urban & City", slug: "urban-city" },
      { name: "Bridges", slug: "bridges" },
      { name: "Churches & Temples", slug: "churches-temples" },
    ],
  },
  // ─── Travel ───────────────────────────────────────────────────────────────
  {
    name: "Travel",
    slug: "travel",
    description: "Destinations and adventures around the world",
    sortOrder: 5,
    children: [
      { name: "Europe", slug: "europe" },
      { name: "Asia", slug: "asia" },
      { name: "Americas", slug: "americas" },
      { name: "Africa", slug: "africa" },
      { name: "Middle East", slug: "middle-east" },
      { name: "Islands & Beaches", slug: "islands-beaches" },
      { name: "Adventure Travel", slug: "adventure-travel" },
    ],
  },
  // ─── Fashion ──────────────────────────────────────────────────────────────
  {
    name: "Fashion & Style",
    slug: "fashion-style",
    description: "Clothing, accessories and fashion photography",
    sortOrder: 6,
    children: [
      { name: "Street Style", slug: "street-style" },
      { name: "Luxury Fashion", slug: "luxury-fashion" },
      { name: "Casual Wear", slug: "casual-wear" },
      { name: "Accessories", slug: "accessories" },
      { name: "Shoes", slug: "shoes" },
      { name: "Vintage Fashion", slug: "vintage-fashion" },
    ],
  },
  // ─── Food ─────────────────────────────────────────────────────────────────
  {
    name: "Food & Drink",
    slug: "food-drink",
    description: "Culinary arts, recipes and food photography",
    sortOrder: 7,
    children: [
      { name: "Desserts & Sweets", slug: "desserts-sweets" },
      { name: "Healthy Food", slug: "healthy-food" },
      { name: "Coffee & Tea", slug: "coffee-tea" },
      { name: "Cocktails & Drinks", slug: "cocktails-drinks" },
      { name: "Street Food", slug: "street-food" },
      { name: "Baking", slug: "baking" },
    ],
  },
  // ─── Design ───────────────────────────────────────────────────────────────
  {
    name: "Graphic Design",
    slug: "graphic-design",
    description: "Typography, branding, logos and visual design",
    sortOrder: 8,
    children: [
      { name: "Typography", slug: "typography" },
      { name: "Logo Design", slug: "logo-design" },
      { name: "Branding", slug: "branding" },
      { name: "Poster Design", slug: "poster-design" },
      { name: "UI & UX Design", slug: "ui-ux-design" },
      { name: "Infographics", slug: "infographics" },
    ],
  },
  // ─── Animals ──────────────────────────────────────────────────────────────
  {
    name: "Animals & Pets",
    slug: "animals-pets",
    description: "Cute pets, wildlife and animal photography",
    sortOrder: 9,
    children: [
      { name: "Dogs", slug: "dogs" },
      { name: "Cats", slug: "cats" },
      { name: "Birds", slug: "birds" },
      { name: "Wild Animals", slug: "wild-animals" },
      { name: "Marine Life", slug: "marine-life" },
      { name: "Horses", slug: "horses" },
    ],
  },
  // ─── Technology ───────────────────────────────────────────────────────────
  {
    name: "Technology",
    slug: "technology",
    description: "Tech, gadgets, AI and digital innovation",
    sortOrder: 10,
    children: [
      { name: "Gadgets", slug: "gadgets" },
      { name: "Workspace Setup", slug: "workspace-setup" },
      { name: "AI & Future Tech", slug: "ai-future-tech" },
      { name: "Gaming", slug: "gaming" },
      { name: "Cyberpunk", slug: "cyberpunk" },
    ],
  },
  // ─── Minimal ──────────────────────────────────────────────────────────────
  {
    name: "Minimal & Abstract",
    slug: "minimal-abstract",
    description: "Clean minimal aesthetics and abstract art",
    sortOrder: 11,
    children: [
      { name: "Minimalism", slug: "minimalism" },
      { name: "Abstract Art", slug: "abstract-art" },
      { name: "Geometric", slug: "geometric" },
      { name: "Patterns", slug: "patterns" },
      { name: "Textures", slug: "textures" },
    ],
  },
  // ─── Dark & Moody ─────────────────────────────────────────────────────────
  {
    name: "Dark & Moody",
    slug: "dark-moody",
    description: "Dark themes, atmospheric and dramatic imagery",
    sortOrder: 12,
    children: [
      { name: "Dark Fantasy", slug: "dark-fantasy" },
      { name: "Gothic", slug: "gothic" },
      { name: "Horror", slug: "horror" },
      { name: "Noir", slug: "noir" },
    ],
  },
  // ─── Wallpapers ───────────────────────────────────────────────────────────
  {
    name: "Wallpapers",
    slug: "wallpapers",
    description: "High quality wallpapers for desktop and mobile",
    sortOrder: 13,
    children: [
      { name: "Desktop Wallpapers", slug: "desktop-wallpapers" },
      { name: "Mobile Wallpapers", slug: "mobile-wallpapers" },
      { name: "4K Wallpapers", slug: "4k-wallpapers" },
    ],
  },
  // ─── People ───────────────────────────────────────────────────────────────
  {
    name: "People & Lifestyle",
    slug: "people-lifestyle",
    description: "People, culture and everyday life",
    sortOrder: 14,
    children: [
      { name: "Fitness & Wellness", slug: "fitness-wellness" },
      { name: "Family & Kids", slug: "family-kids" },
      { name: "Culture & Traditions", slug: "culture-traditions" },
      { name: "Celebrations", slug: "celebrations" },
    ],
  },
  // ─── Space ────────────────────────────────────────────────────────────────
  {
    name: "Space & Science",
    slug: "space-science",
    description: "Universe, astronomy and scientific imagery",
    sortOrder: 15,
    children: [
      { name: "Galaxies & Nebulae", slug: "galaxies-nebulae" },
      { name: "Planets", slug: "planets" },
      { name: "Astronomy", slug: "astronomy" },
    ],
  },
  // ─── Logos ────────────────────────────────────────────────────────────────
  {
    name: "Logos",
    slug: "logos",
    description: "Professional logo designs and brand marks",
    sortOrder: 16,
    children: [
      { name: "Minimalist Logos", slug: "minimalist-logos" },
      { name: "Modern Logos", slug: "modern-logos" },
      { name: "Abstract Logos", slug: "abstract-logos" },
      { name: "Geometric Logos", slug: "geometric-logos" },
    ],
  },
  // ─── Invitations ──────────────────────────────────────────────────────────
  {
    name: "Events & Invitations",
    slug: "events-invitations",
    description: "Elegant invitation cards and event designs",
    sortOrder: 17,
    children: [
      { name: "Wedding Invitations", slug: "wedding-invitations" },
      { name: "Birthday Cards", slug: "birthday-cards" },
      { name: "Party Invites", slug: "party-invites" },
      { name: "Greeting Cards", slug: "greeting-cards" },
    ],
  },
];

const tags = [
  // Nature
  "landscape", "sunset", "sunrise", "nature", "forest", "ocean", "mountain",
  "beach", "waterfall", "flowers", "trees", "sky", "clouds", "rain", "snow",
  // Art
  "art", "illustration", "drawing", "painting", "digital-art", "anime",
  "abstract", "colorful", "black-and-white", "vintage", "retro",
  // Photography
  "photography", "portrait", "macro", "street", "aerial", "wildlife",
  // Design
  "design", "minimal", "typography", "logo", "branding", "ui", "ux",
  // Mood
  "dark", "moody", "aesthetic", "dreamy", "cinematic", "dramatic",
  "peaceful", "serene", "vibrant", "pastel", "neon",
  // Architecture
  "architecture", "building", "interior", "urban", "city", "modern",
  "historical", "bridge",
  // Travel
  "travel", "adventure", "explore", "wanderlust", "europe", "asia",
  "africa", "island",
  // Food
  "food", "coffee", "dessert", "healthy", "baking", "cocktail",
  // Fashion
  "fashion", "style", "outfit", "luxury", "streetwear", "accessories",
  // Animals
  "animals", "dog", "cat", "bird", "wildlife", "horse", "ocean-life",
  // Tech
  "technology", "gaming", "cyberpunk", "ai", "futuristic", "workspace",
  // Space
  "space", "galaxy", "stars", "universe", "astronomy",
  // General
  "inspiration", "creative", "beautiful", "stunning", "amazing",
  "wallpaper", "4k", "hd", "high-quality",
];

async function main() {
  console.log("🌱 Seeding categories and tags...\n");

  // ─── Categories ───────────────────────────────────────────────────────────
  for (const cat of categories) {
    const parent = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description, sortOrder: cat.sortOrder },
      create: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        sortOrder: cat.sortOrder,
      },
    });
    console.log(`✅ Category: ${cat.name}`);

    for (const child of cat.children) {
      await prisma.category.upsert({
        where: { slug: child.slug },
        update: { name: child.name, parentId: parent.id },
        create: {
          name: child.name,
          slug: child.slug,
          parentId: parent.id,
        },
      });
      console.log(`   └─ ${child.name}`);
    }
  }

  // ─── Tags ─────────────────────────────────────────────────────────────────
  console.log("\n🏷️  Seeding tags...");
  for (const tagName of tags) {
    await prisma.tag.upsert({
      where: { slug: tagName },
      update: {},
      create: { name: tagName, slug: tagName },
    });
  }
  console.log(`✅ ${tags.length} tags created`);

  console.log("\n🎉 Done! Categories and tags are ready.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
