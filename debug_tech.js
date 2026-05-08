const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
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
    take: 10
  });

  console.log("Total images found in Technology:", images.length);
  images.forEach(img => {
    console.log(`- ${img.title} (User: ${img.user.email})`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
