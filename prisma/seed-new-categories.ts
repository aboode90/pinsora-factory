import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as dotenv from "dotenv";

dotenv.config();

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

// ─── 10 Most Trending Categories ─────────────────────────────────────────────

const newCategories = [
  {
    name: "Aesthetic",
    slug: "aesthetic",
    description: "Soft, dreamy, and visually pleasing aesthetic images",
    sortOrder: 16,
    tags: ["aesthetic", "soft-aesthetic", "dreamy", "pastel", "vintage-aesthetic", "dark-aesthetic", "grunge-aesthetic", "cottagecore", "fairycore", "y2k", "90s-aesthetic", "tumblr", "vsco", "pinterest-aesthetic", "soft-girl"],
    children: [
      { name: "Soft Aesthetic", slug: "soft-aesthetic" },
      { name: "Dark Aesthetic", slug: "dark-aesthetic" },
      { name: "Vintage Aesthetic", slug: "vintage-aesthetic" },
      { name: "Cottagecore", slug: "cottagecore" },
      { name: "Y2K Aesthetic", slug: "y2k-aesthetic" },
    ],
  },
  {
    name: "Quotes & Typography",
    slug: "quotes-typography",
    description: "Inspirational quotes, motivational text and beautiful typography",
    sortOrder: 17,
    tags: ["quotes", "inspirational-quotes", "motivational", "typography", "words", "life-quotes", "love-quotes", "aesthetic-quotes", "text-art", "calligraphy", "handwriting", "font-design", "quote-wallpaper", "daily-quotes", "wisdom"],
    children: [
      { name: "Motivational Quotes", slug: "motivational-quotes" },
      { name: "Love Quotes", slug: "love-quotes" },
      { name: "Life Quotes", slug: "life-quotes" },
      { name: "Calligraphy", slug: "calligraphy" },
    ],
  },
  {
    name: "Home & Interior",
    slug: "home-interior",
    description: "Home decor, interior design ideas and cozy living spaces",
    sortOrder: 18,
    tags: ["home-decor", "interior-design", "cozy", "living-room", "bedroom", "kitchen", "bathroom", "boho-decor", "minimalist-home", "scandinavian", "modern-home", "rustic", "aesthetic-room", "room-decor", "home-inspiration"],
    children: [
      { name: "Living Room", slug: "living-room" },
      { name: "Bedroom Decor", slug: "bedroom-decor" },
      { name: "Kitchen Design", slug: "kitchen-design" },
      { name: "Boho Decor", slug: "boho-decor" },
      { name: "Minimalist Home", slug: "minimalist-home" },
    ],
  },
  {
    name: "Fitness & Health",
    slug: "fitness-health",
    description: "Workout inspiration, healthy lifestyle and wellness",
    sortOrder: 19,
    tags: ["fitness", "workout", "gym", "yoga", "healthy-lifestyle", "motivation", "bodybuilding", "running", "pilates", "wellness", "nutrition", "healthy-food", "mindfulness", "meditation", "sport"],
    children: [
      { name: "Gym & Workout", slug: "gym-workout" },
      { name: "Yoga & Meditation", slug: "yoga-meditation" },
      { name: "Running", slug: "running" },
      { name: "Healthy Eating", slug: "healthy-eating" },
    ],
  },
  {
    name: "Beauty & Makeup",
    slug: "beauty-makeup",
    description: "Makeup looks, skincare, beauty tips and cosmetics",
    sortOrder: 20,
    tags: ["makeup", "beauty", "skincare", "cosmetics", "eyeshadow", "lipstick", "nail-art", "glam", "natural-makeup", "bold-makeup", "beauty-tips", "glow", "aesthetic-makeup", "hair", "hairstyle"],
    children: [
      { name: "Makeup Looks", slug: "makeup-looks" },
      { name: "Skincare", slug: "skincare" },
      { name: "Nail Art", slug: "nail-art" },
      { name: "Hairstyles", slug: "hairstyles" },
    ],
  },
  {
    name: "Cars & Vehicles",
    slug: "cars-vehicles",
    description: "Luxury cars, supercars, motorcycles and automotive photography",
    sortOrder: 21,
    tags: ["cars", "supercar", "luxury-car", "sports-car", "motorcycle", "automotive", "car-photography", "lamborghini", "ferrari", "bmw", "mercedes", "porsche", "vintage-car", "muscle-car", "car-wallpaper"],
    children: [
      { name: "Supercars", slug: "supercars" },
      { name: "Luxury Cars", slug: "luxury-cars" },
      { name: "Motorcycles", slug: "motorcycles" },
      { name: "Vintage Cars", slug: "vintage-cars" },
    ],
  },
  {
    name: "Fantasy & Sci-Fi",
    slug: "fantasy-sci-fi",
    description: "Fantasy worlds, science fiction, dragons and magical realms",
    sortOrder: 22,
    tags: ["fantasy", "sci-fi", "dragon", "magic", "wizard", "elf", "sword", "armor", "space-opera", "cyberpunk", "steampunk", "mythology", "epic-fantasy", "digital-painting", "concept-art"],
    children: [
      { name: "Fantasy Art", slug: "fantasy-art" },
      { name: "Sci-Fi Art", slug: "sci-fi-art" },
      { name: "Dragons", slug: "dragons" },
      { name: "Mythology", slug: "mythology" },
    ],
  },
  {
    name: "Wedding & Romance",
    slug: "wedding-romance",
    description: "Wedding photography, romantic moments and love stories",
    sortOrder: 23,
    tags: ["wedding", "bride", "romance", "love", "engagement", "wedding-dress", "wedding-decor", "couple", "wedding-photography", "flowers-wedding", "wedding-cake", "honeymoon", "proposal", "anniversary", "romantic"],
    children: [
      { name: "Wedding Photography", slug: "wedding-photography" },
      { name: "Bridal", slug: "bridal" },
      { name: "Wedding Decor", slug: "wedding-decor" },
      { name: "Couple Photography", slug: "couple-photography" },
    ],
  },
  {
    name: "Street Art & Graffiti",
    slug: "street-art-graffiti",
    description: "Urban street art, murals, graffiti and public art",
    sortOrder: 24,
    tags: ["street-art", "graffiti", "mural", "urban-art", "banksy", "spray-paint", "wall-art", "public-art", "street-photography", "urban", "colorful-wall", "art-installation", "stencil", "tag", "urban-culture"],
    children: [
      { name: "Murals", slug: "murals" },
      { name: "Graffiti Art", slug: "graffiti-art" },
      { name: "Urban Murals", slug: "urban-murals" },
    ],
  },
  {
    name: "Sunset & Sky",
    slug: "sunset-sky",
    description: "Breathtaking sunsets, sunrises, clouds and sky photography",
    sortOrder: 25,
    tags: ["sunset", "sunrise", "sky", "clouds", "golden-hour", "blue-hour", "twilight", "dusk", "dawn", "sky-photography", "colorful-sky", "storm-clouds", "rainbow", "milky-way", "night-sky"],
    children: [
      { name: "Golden Hour", slug: "golden-hour" },
      { name: "Sunrise", slug: "sunrise" },
      { name: "Night Sky", slug: "night-sky" },
      { name: "Storm & Clouds", slug: "storm-clouds" },
    ],
  },
];

// ─── Additional Tags ──────────────────────────────────────────────────────────

const additionalTags = [
  // Aesthetic
  "aesthetic", "soft-aesthetic", "dark-aesthetic", "cottagecore", "y2k", "vsco", "pastel",
  "dreamy", "vintage-aesthetic", "grunge", "fairycore", "tumblr", "soft-girl", "pinterest",
  // Quotes
  "quotes", "inspirational", "motivational", "calligraphy", "typography", "handwriting",
  "wisdom", "daily-quotes", "love-quotes", "life-quotes",
  // Home
  "home-decor", "interior", "cozy", "living-room", "bedroom", "boho", "scandinavian",
  "rustic", "room-decor", "minimalist-home",
  // Fitness
  "fitness", "workout", "gym", "yoga", "running", "wellness", "meditation", "pilates",
  "bodybuilding", "healthy-lifestyle",
  // Beauty
  "makeup", "beauty", "skincare", "nail-art", "hairstyle", "glam", "cosmetics", "glow",
  // Cars
  "supercar", "luxury-car", "sports-car", "motorcycle", "automotive", "car-wallpaper",
  "lamborghini", "ferrari", "vintage-car",
  // Fantasy
  "fantasy", "dragon", "magic", "sci-fi", "cyberpunk", "steampunk", "mythology",
  "epic-fantasy", "wizard",
  // Wedding
  "wedding", "bride", "romance", "engagement", "couple", "romantic", "proposal",
  // Street Art
  "street-art", "graffiti", "mural", "urban-art", "wall-art",
  // Sky
  "sunset", "sunrise", "golden-hour", "night-sky", "milky-way", "rainbow", "storm",
];

async function main() {
  console.log("🌱 Adding 10 new trending categories...\n");

  for (const cat of newCategories) {
    // Create parent category
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

    // Create subcategories
    for (const child of cat.children) {
      await prisma.category.upsert({
        where: { slug: child.slug },
        update: { name: child.name, parentId: parent.id },
        create: { name: child.name, slug: child.slug, parentId: parent.id },
      });
      console.log(`   └─ ${child.name}`);
    }

    // Add category-specific tags
    for (const tagName of cat.tags) {
      await prisma.tag.upsert({
        where: { slug: tagName },
        update: {},
        create: { name: tagName, slug: tagName },
      });
    }
    console.log(`   🏷️  ${cat.tags.length} tags added`);
  }

  // Add additional global tags
  console.log("\n🏷️  Adding additional trending tags...");
  for (const tagName of additionalTags) {
    await prisma.tag.upsert({
      where: { slug: tagName },
      update: {},
      create: { name: tagName, slug: tagName },
    });
  }
  console.log(`✅ ${additionalTags.length} additional tags added`);

  console.log("\n🎉 Done! 10 new categories added successfully.");
  console.log("\nNew categories:");
  newCategories.forEach(c => console.log(`  • ${c.name}`));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
