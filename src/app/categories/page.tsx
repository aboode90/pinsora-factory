import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import { formatNumber } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Browse Categories",
  description: "Explore images across hundreds of categories — art, nature, architecture, travel, and more.",
};

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  // Get parent categories with their first image as cover
  const categories = await prisma.category.findMany({
    where: { parentId: null },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      _count: { select: { images: true } },
      images: {
        where: { isPublished: true },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { imageUrl: true, thumbnailUrl: true, title: true },
      },
      children: {
        include: {
          _count: { select: { images: true } },
          images: {
            where: { isPublished: true },
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { imageUrl: true, thumbnailUrl: true, title: true },
          },
        },
        orderBy: { name: "asc" },
      },
    },
  }).catch(() => []);

  return (
    <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900 mb-1">Browse Categories</h1>
        <p className="text-sm text-neutral-500">
          {categories.length} categories to explore
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {categories.map((category) => {
          const coverImage = category.images[0];
          return (
            <Link
              key={category.id}
              href={`/categories/${category.slug}`}
              className="group relative overflow-hidden rounded-2xl bg-neutral-100 aspect-[3/4] block"
            >
              {/* Cover Image */}
              {coverImage ? (
                <Image
                  src={coverImage.thumbnailUrl ?? coverImage.imageUrl}
                  alt={category.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-rose-100 to-violet-100 flex items-center justify-center">
                  <span className="text-4xl">{getCategoryEmoji(category.name)}</span>
                </div>
              )}

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              {/* Text */}
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <h3 className="text-white font-bold text-sm leading-tight mb-0.5">
                  {category.name}
                </h3>
                <p className="text-white/60 text-xs">
                  {formatNumber(category._count.images)} images
                </p>
              </div>

              {/* Hover effect */}
              <div className="absolute inset-0 ring-2 ring-rose-500 ring-offset-0 opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity" />
            </Link>
          );
        })}
      </div>

      {categories.length === 0 && (
        <div className="text-center py-24">
          <p className="text-neutral-500">No categories yet.</p>
        </div>
      )}
    </div>
  );
}

function getCategoryEmoji(name: string): string {
  const map: Record<string, string> = {
    nature: "🌿", architecture: "🏛️", travel: "✈️", food: "🍜",
    fashion: "👗", technology: "💻", art: "🎨", animals: "🐾",
    sports: "⚽", music: "🎵", people: "👥", abstract: "🌀",
    vintage: "📷", minimal: "◻️", dark: "🌑", colorful: "🌈",
    aesthetic: "✨", quotes: "💬", home: "🏠", fitness: "💪",
    beauty: "💄", cars: "🚗", fantasy: "🐉", wedding: "💍",
    street: "🎨", sunset: "🌅", nails: "💅", outfits: "👗",
    vision: "🎯", tattoo: "🖊️", drawing: "✏️",
  };
  const lower = name.toLowerCase();
  for (const [key, emoji] of Object.entries(map)) {
    if (lower.includes(key)) return emoji;
  }
  return "🖼️";
}
