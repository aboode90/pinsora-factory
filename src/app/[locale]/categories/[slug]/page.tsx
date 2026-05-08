import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { InfiniteScrollGrid } from "@/components/images/infinite-scroll";
import { CategoryCard } from "@/components/categories/category-card";
import { LayoutGrid } from "lucide-react";

export const dynamic = "force-dynamic";

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://pinsora.com").replace(/\/$/, "");

interface PageProps {
  params: Promise<{ slug: string; locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, locale } = await params;
  const category = await prisma.category.findUnique({
    where: { slug },
    select: { name: true, description: true, _count: { select: { images: true } } },
  });

  if (!category) return { title: "Category Not Found — Pinsora", robots: { index: false } };

  const title = `${category.name} Images — Pinsora`;
  const description =
    category.description ??
    `Browse ${category._count.images.toLocaleString()} ${category.name} images on Pinsora. Discover stunning creative content.`;

  return {
    title,
    description,
    keywords: [category.name, "images", "creative", "pinsora", "gallery"],
    alternates: {
      canonical: `${siteUrl}/${locale}/categories/${slug}`,
      languages: {
        en: `${siteUrl}/en/categories/${slug}`,
        ar: `${siteUrl}/ar/categories/${slug}`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${siteUrl}/${locale}/categories/${slug}`,
    },
    robots: { index: true, follow: true },
  };
}

export default async function CategorySlugPage({ params }: PageProps) {
  const { slug } = await params;

  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      _count: { select: { images: true } },
      children: {
        include: {
          _count: { select: { images: true } },
          images: {
            where: { isPublished: true },
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { thumbnailUrl: true, imageUrl: true },
          },
        },
        orderBy: { name: "asc" },
      },
      parent: { select: { id: true, name: true, slug: true } },
    },
  });

  if (!category) notFound();

  // العدد الكلي = صور الفئة + صور كل الفئات الفرعية
  const totalImages =
    category._count.images +
    category.children.reduce((sum, child) => sum + child._count.images, 0);

  // Merge coverImage with latest image for subcategories
  const childrenWithCover = category.children.map((child) => ({
    ...child,
    coverImage: child.coverImage ?? child.images[0]?.thumbnailUrl ?? child.images[0]?.imageUrl ?? null,
  }));

  // Fetch images for this category and its children
  const categoryIds = [category.id, ...category.children.map((c) => c.id)];

  const images = await prisma.image.findMany({
    where: { categoryId: { in: categoryIds }, isPublished: true },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      category: { select: { id: true, name: true, slug: true } },
      user: { select: { id: true, name: true, username: true, image: true } },
      tags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
      _count: { select: { likes: true, saves: true, comments: true } },
    },
  });

  return (
    <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl bg-rose-50 flex items-center justify-center">
          <LayoutGrid className="h-5 w-5 text-rose-500" />
        </div>
        <div>
          <div className="flex items-center gap-2 text-sm text-neutral-400 mb-0.5">
            {category.parent && (
              <>
                <a href={`/categories/${category.parent.slug}`} className="hover:text-rose-500 transition-colors">
                  {category.parent.name}
                </a>
                <span>/</span>
              </>
            )}
            <span className="text-neutral-600 font-medium">{category.name}</span>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900">{category.name}</h1>
          <p className="text-sm text-neutral-500">{totalImages.toLocaleString()} images</p>
        </div>
      </div>

      {/* Subcategories */}
      {category.children.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-3">
            Subcategories
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {childrenWithCover.map((child) => (
              <CategoryCard key={child.id} category={child} compact />
            ))}
          </div>
        </div>
      )}

      {/* Images */}
      {images.length === 0 ? (
        <div className="text-center py-24">
          <div className="text-5xl mb-4">🖼️</div>
          <p className="text-neutral-500">No images in this category yet.</p>
        </div>
      ) : (
        <InfiniteScrollGrid
          initialImages={images as Parameters<typeof InfiniteScrollGrid>[0]["initialImages"]}
          fetchUrl={`/api/images?category=${encodeURIComponent(slug)}`}
        />
      )}
    </div>
  );
}
