import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const tech = await prisma.category.findUnique({
    where: { slug: "technology" },
    include: {
      children: true,
      _count: { select: { images: true } }
    }
  });
  if (!tech) {
    console.log("Category not found");
    return;
  }
  const childIds = tech.children.map(c => c.id);
  const allCategoryIds = [tech.id, ...childIds];

  const imageCount = await prisma.image.count({
    where: { categoryId: { in: allCategoryIds } }
  });

  const botImageCount = await prisma.image.count({
    where: {
      categoryId: { in: allCategoryIds },
      user: { email: { startsWith: "bot_" } }
    }
  });

  const latestImages = await prisma.image.findMany({
    where: { categoryId: { in: allCategoryIds } },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { user: { select: { email: true } } }
  });

  console.log(JSON.stringify({
    category: tech.name,
    totalImages: imageCount,
    botImages: botImageCount,
    latestImages: latestImages.map(img => ({
      title: img.title,
      email: img.user.email,
      isBot: img.user.email.startsWith("bot_")
    }))
  }, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
