import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log("🚀 Starting Trending Content Sync...");

  try {
    // 1. Ensure DIY & Crafts Category exists
    const diyCategory = await prisma.category.upsert({
      where: { slug: "diy-crafts" },
      update: { name: "DIY & Crafts", description: "Educational and fun DIY ideas, crafts, and handmade items" },
      create: {
        name: "DIY & Crafts",
        slug: "diy-crafts",
        description: "Educational and fun DIY ideas, crafts, and handmade items",
        sortOrder: 15,
      },
    });
    console.log("✅ Category DIY & Crafts ensured.");

    // 2. Add Missing Subcategories for better organization
    const subcategories = [
      { name: "Hijab Fashion", slug: "hijab-fashion", parentSlug: "fashion-style" },
      { name: "Bedroom Ideas", slug: "bedroom-ideas", parentSlug: "home-interior" },
      { name: "Living Room Decor", slug: "living-room-decor", parentSlug: "home-interior" },
      { name: "Drawing Ideas", slug: "drawing-ideas", parentSlug: "art-illustration" },
      { name: "Skincare Routine", slug: "skincare-routine", parentSlug: "beauty-makeup" },
      { name: "Nail Ideas", slug: "nail-ideas", parentSlug: "beauty-makeup" },
      { name: "DIY Ideas", slug: "diy-ideas", parentSlug: "diy-crafts" },
    ];

    for (const sub of subcategories) {
      const parent = await prisma.category.findUnique({ where: { slug: sub.parentSlug } });
      if (parent) {
        await prisma.category.upsert({
          where: { slug: sub.slug },
          update: { parentId: parent.id },
          create: { name: sub.name, slug: sub.slug, parentId: parent.id },
        });
      }
    }
    console.log("✅ Trending Subcategories added.");

    // 3. Add all Trending Tags
    const trendingTags = [
      "aesthetic", "wallpaper", "digital art", "drawing ideas",
      "bedroom ideas", "living room decor", "small room ideas",
      "outfit ideas", "street style", "summer outfits", "hijab fashion",
      "easy recipes", "desserts", "healthy food",
      "makeup looks", "skincare routine", "nail ideas",
      "DIY ideas", "crafts", "handmade",
      "cherry aesthetic", "castlecore", "maximalist decor"
    ];

    for (const tagName of trendingTags) {
      const slug = tagName.toLowerCase().replace(/\s+/g, "-");
      await prisma.tag.upsert({
        where: { slug },
        update: {},
        create: { name: tagName.toLowerCase(), slug },
      });
    }
    console.log(`✅ ${trendingTags.length} Trending Tags synced.`);

    console.log("\n🎉 Content Enrichment Complete!");

  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch(console.error);
