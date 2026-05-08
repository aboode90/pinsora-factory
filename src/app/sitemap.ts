import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { getImagePath } from "@/lib/utils";

const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://pinsora.com").replace(/\/$/, "");
const locales = ["en", "ar"] as const;

export const revalidate = 3600; // تحديث كل ساعة

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // الصفحات الثابتة - نسختان (en + ar)
  const staticPaths = [
    { path: "", priority: 1.0, freq: "daily" as const },
    { path: "/explore", priority: 0.9, freq: "hourly" as const },
    { path: "/categories", priority: 0.8, freq: "weekly" as const },
    { path: "/search", priority: 0.7, freq: "daily" as const },
    { path: "/about", priority: 0.5, freq: "monthly" as const },
    { path: "/privacy", priority: 0.3, freq: "monthly" as const },
    { path: "/terms", priority: 0.3, freq: "monthly" as const },
  ];

  const staticRoutes: MetadataRoute.Sitemap = locales.flatMap((locale) =>
    staticPaths.map(({ path, priority, freq }) => ({
      url: `${baseUrl}/${locale}${path}`,
      lastModified: new Date(),
      changeFrequency: freq,
      priority,
    }))
  );

  try {
    const [categories, images, users] = await Promise.all([
      prisma.category.findMany({
        select: { slug: true, updatedAt: true },
      }),
      prisma.image.findMany({
        where: { isPublished: true },
        orderBy: { createdAt: "desc" },
        take: 5000,
        select: { id: true, title: true, updatedAt: true },
      }),
      prisma.user.findMany({
        where: {
          username: { not: null },
          images: { some: { isPublished: true } },
        },
        select: { username: true, updatedAt: true },
        take: 1000,
      }),
    ]);

    // صفحات الفئات - نسختان
    const categoryRoutes: MetadataRoute.Sitemap = locales.flatMap((locale) =>
      categories.map((cat) => ({
        url: `${baseUrl}/${locale}/categories/${cat.slug}`,
        lastModified: cat.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }))
    );

    // صفحات الصور - canonical بدون locale + نسختان
    const imageRoutes: MetadataRoute.Sitemap = [
      // Canonical URLs (بدون locale) - مهم لـ Google Images
      ...images.map((img) => ({
        url: `${baseUrl}${getImagePath(img)}`,
        lastModified: img.updatedAt,
        changeFrequency: "monthly" as const,
        priority: 0.9,
      })),
      // نسخ مترجمة
      ...locales.flatMap((locale) =>
        images.map((img) => ({
          url: `${baseUrl}/${locale}${getImagePath(img)}`,
          lastModified: img.updatedAt,
          changeFrequency: "monthly" as const,
          priority: 0.6,
        }))
      ),
    ];

    // صفحات المستخدمين - نسختان
    const userRoutes: MetadataRoute.Sitemap = locales.flatMap((locale) =>
      users
        .filter((u) => u.username)
        .map((user) => ({
          url: `${baseUrl}/${locale}/profile/${user.username}`,
          lastModified: user.updatedAt,
          changeFrequency: "weekly" as const,
          priority: 0.6,
        }))
    );

    return [...staticRoutes, ...categoryRoutes, ...imageRoutes, ...userRoutes];
  } catch {
    // في حالة فشل قاعدة البيانات، نعيد الصفحات الثابتة فقط
    return staticRoutes;
  }
}
