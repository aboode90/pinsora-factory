const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
require("dotenv").config();

async function main() {
  const connectionString = process.env.DATABASE_URL;
  // Disable TLS verification for this debug script if needed,
  // but better to try standard connection first or use PGSSLMODE
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

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
      include: { user: { select: { email: true, role: true } } },
      orderBy: { createdAt: "desc" }
    });

    console.log(`Technology images (${images.length}):`);
    images.forEach(img => {
      console.log(`- ${img.title} | ${img.user.email} | Role: ${img.user.role} | Published: ${img.isPublished}`);
    });

  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch(console.error);
