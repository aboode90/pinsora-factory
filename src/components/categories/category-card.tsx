import React from "react";
import Link from "next/link";
import Image from "next/image";
import { cn, formatNumber } from "@/lib/utils";

interface CategoryCardProps {
  category: {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    coverImage?: string | null;
    _count: { images: number };
  };
  compact?: boolean;
}

export function CategoryCard({ category, compact = false }: CategoryCardProps) {
  if (compact) {
    return (
      <Link
        href={`/categories/${category.slug}`}
        className="group flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-rose-50 transition-colors text-center"
      >
        <div className="relative h-14 w-14 rounded-2xl overflow-hidden bg-gradient-to-br from-rose-100 to-violet-100 shadow-sm group-hover:shadow-md transition-shadow">
          {category.coverImage ? (
            <Image
              src={category.coverImage}
              alt={category.name}
              fill
              className="object-cover"
              sizes="56px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl">
              {getCategoryEmoji(category.name)}
            </div>
          )}
        </div>
        <div>
          <p className="text-xs font-semibold text-neutral-800 group-hover:text-rose-600 transition-colors line-clamp-1">
            {category.name}
          </p>
          <p className="text-xs text-neutral-400">{formatNumber(category._count.images)}</p>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/categories/${category.slug}`}
      className="group relative overflow-hidden rounded-2xl bg-neutral-100 aspect-[4/3] block"
    >
      {category.coverImage ? (
        <Image
          src={category.coverImage}
          alt={category.name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-rose-100 to-violet-100 text-5xl">
          {getCategoryEmoji(category.name)}
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h3 className="text-white font-bold text-base mb-0.5">{category.name}</h3>
        <p className="text-white/70 text-xs">{formatNumber(category._count.images)} images</p>
      </div>
    </Link>
  );
}

function getCategoryEmoji(name: string): string {
  const map: Record<string, string> = {
    nature: "🌿",
    architecture: "🏛️",
    travel: "✈️",
    food: "🍜",
    fashion: "👗",
    technology: "💻",
    art: "🎨",
    animals: "🐾",
    sports: "⚽",
    music: "🎵",
    people: "👥",
    abstract: "🌀",
    vintage: "📷",
    minimal: "◻️",
    dark: "🌑",
    colorful: "🌈",
  };

  const lower = name.toLowerCase();
  for (const [key, emoji] of Object.entries(map)) {
    if (lower.includes(key)) return emoji;
  }
  return "🖼️";
}
