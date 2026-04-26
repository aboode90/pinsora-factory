import React from "react";
import { prisma } from "@/lib/prisma";
import { MasonryGrid } from "./masonry-grid";

interface RelatedImagesProps {
  categoryId: string;
  excludeId: string;
}

export async function RelatedImages({ categoryId, excludeId }: RelatedImagesProps) {
  const images = await prisma.image.findMany({
    where: { categoryId, isPublished: true, id: { not: excludeId } },
    take: 12,
    orderBy: { viewCount: "desc" },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      user: { select: { id: true, name: true, username: true, image: true } },
      tags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
      _count: { select: { likes: true, saves: true, comments: true } },
    },
  });

  if (images.length === 0) {
    return (
      <p className="text-sm text-neutral-500 text-center py-8">
        No related images found in this category yet.
      </p>
    );
  }

  return (
    <MasonryGrid
      images={images as Parameters<typeof MasonryGrid>[0]["images"]}
    />
  );
}
