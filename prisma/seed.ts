import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import * as dotenv from "dotenv";

dotenv.config();

// Bypass SSL certificate validation for seeding
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  const categories = [
    { name: "Art & Illustration", slug: "art-illustration", sortOrder: 1, children: [
      { name: "Digital Art", slug: "digital-art" },
      { name: "Watercolor", slug: "watercolor" },
      { name: "Oil Painting", slug: "oil-painting" },
      { name: "Sketch & Drawing", slug: "sketch-drawing" },
      { name: "Concept Art", slug: "concept-art" },
      { name: "Anime & Manga", slug: "anime-manga" },
      { name: "3D Art", slug: "3d-art" },
    ]},
    { name: "Photography", slug: "photography", sortOrder: 2, children: [
      { name: "Portrait", slug: "portrait" },
      { name: "Street Photography", slug: "street-photography" },
      { name: "Landscape Photography", slug: "landscape-photography" },
      { name: "Wildlife Photography", slug: "wildlife-photography" },
      { name: "Macro Photography", slug: "macro-photography" },
      { name: "Black & White", slug: "black-and-white" },
    ]},
    { name: "Nature", slug: "nature", sortOrder: 3, children: [
      { name: "Forests", slug: "forests" },
      { name: "Oceans & Beaches", slug: "oceans-beaches" },
      { name: "Mountains", slug: "mountains" },
      { name: "Flowers & Plants", slug: "flowers-plants" },
    ]},
    { name: "Logos", slug: "logos", sortOrder: 16, children: [
      { name: "Minimalist Logos", slug: "minimalist-logos" },
      { name: "Modern Logos", slug: "modern-logos" },
      { name: "Abstract Logos", slug: "abstract-logos" },
      { name: "Geometric Logos", slug: "geometric-logos" },
    ]},
    { name: "Events & Invitations", slug: "events-invitations", sortOrder: 17, children: [
      { name: "Wedding Invitations", slug: "wedding-invitations" },
      { name: "Birthday Cards", slug: "birthday-cards" },
      { name: "Party Invites", slug: "party-invites" },
      { name: "Greeting Cards", slug: "greeting-cards" },
    ]},
    { name: "Nails & Nail Art", slug: "nails-nail-art", sortOrder: 18, children: [] },
    { name: "Outfits & Style", slug: "outfits-style", sortOrder: 19, children: [] },
    { name: "Vision Board", slug: "vision-board", sortOrder: 20, children: [] },
    { name: "Tattoo Ideas", slug: "tattoo-ideas", sortOrder: 21, children: [] },
    { name: "Drawing & Sketching", slug: "drawing-sketching", sortOrder: 22, children: [] },
  ];

  for (const cat of categories) {
    const parent = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, sortOrder: cat.sortOrder },
      create: { name: cat.name, slug: cat.slug, sortOrder: cat.sortOrder },
    });
    console.log(`✅ Category: ${cat.name}`);

    for (const child of cat.children || []) {
      await prisma.category.upsert({
        where: { slug: child.slug },
        update: { name: child.name, parentId: parent.id },
        create: { name: child.name, slug: child.slug, parentId: parent.id },
      });
      console.log(`   └─ ${child.name}`);
    }
  }

  console.log("👥 Creating bot accounts...");
  const botNames = [
    "Aria Design", "Liam Photo", "Sophia Art", "Noah Visuals", "Emma Creative",
    "Oliver Studio", "Ava Gallery", "James Lens", "Isabella Sketch", "William Craft",
    "Mia Digital", "Benjamin Frame", "Charlotte Aesthetic", "Lucas Motion", "Amelia Pixel",
    "Henry Vector", "Harper Palette", "Theodore Muse", "Evelyn Brush", "Jack Capture",
    "Abigail Vivid", "Levi Portrait", "Emily Glow", "Alexander Sharp", "Elizabeth Fine",
    "Jackson Prime", "Mila Hue", "Mateo Mode", "Ella Style", "Daniel Draft"
  ];

  for (let i = 0; i < botNames.length; i++) {
    const name = botNames[i];
    const username = name.toLowerCase().replace(/\s+/g, "_") + "_" + (i + 1);
    const email = `bot_${i + 1}@pinsora.com`;

    await prisma.user.upsert({
      where: { email },
      update: { name, username },
      create: {
        name,
        username,
        email,
        role: "USER",
      },
    });
  }
  console.log(`✅ ${botNames.length} bot accounts ready!`);

  console.log("\n🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
