const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
require("dotenv").config();

async function main() {
  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const tech = await prisma.category.findUnique({
      where: { slug: "technology" },
      include: { children: true }
    });

    if (!tech) {
      console.log("Technology category not found");
      return;
    }

    const categoryIds = [tech.id, ...tech.children.map(c => c.id)];

    const images = await prisma.image.findMany({
      where: { categoryId: { in: categoryIds } },
      include: { user: { select: { email: true } } },
      take: 20
    });

    console.log(`Summary for Technology (${tech.id}):`);
    console.log(`- Children: ${tech.children.length}`);
    console.log(`- Total images found: ${images.length}`);

    const botImages = images.filter(img => img.user.email.startsWith("bot_"));
    console.log(`- Bot images found: ${botImages.length}`);

    if (images.length > 0) {
      console.log("\nSample Images:");
      images.forEach(img => {
        console.log(`  * ${img.title} | User: ${img.user.email} | Published: ${img.isPublished}`);
      });
    }

  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch(console.error);
