const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
require("dotenv").config();

async function main() {
  const connectionString = process.env.DATABASE_URL;
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const targetTags = [
    "aesthetic", "wallpaper", "digital art", "drawing ideas",
    "bedroom ideas", "living room decor", "small room ideas",
    "outfit ideas", "street style", "summer outfits", "hijab fashion",
    "easy recipes", "desserts", "healthy food",
    "makeup looks", "skincare routine", "nail ideas",
    "DIY ideas", "crafts", "handmade",
    "cherry aesthetic", "castlecore", "maximalist decor"
  ];

  const targetCategories = [
    "Art & Illustration", "Aesthetic", "Home & Interior", "Fashion & Style",
    "Food & Drink", "Beauty & Makeup", "DIY & Crafts"
  ];

  try {
    const existingTags = await prisma.tag.findMany({
      where: {
        name: { in: targetTags.map(t => t.toLowerCase()) }
      },
      select: { name: true }
    });

    const existingCategories = await prisma.category.findMany({
      where: {
        name: { in: targetCategories }
      },
      select: { name: true }
    });

    console.log("Existing Tags:", existingTags.map(t => t.name));
    console.log("Existing Categories:", existingCategories.map(c => c.name));

    const missingTags = targetTags.filter(t => !existingTags.some(et => et.name === t.toLowerCase()));
    const missingCategories = targetCategories.filter(c => !existingCategories.some(ec => ec.name === c));

    console.log("\nMissing Tags:", missingTags);
    console.log("Missing Categories:", missingCategories);

  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch(console.error);
