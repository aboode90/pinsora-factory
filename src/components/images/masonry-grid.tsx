"use client";

import React from "react";
import Masonry from "react-masonry-css";
import { ImageCard } from "./image-card";
import type { ImageWithRelations } from "@/types";

interface MasonryGridProps {
  images: ImageWithRelations[];
  onLike?: (id: string, liked: boolean) => void;
  onSave?: (id: string, saved: boolean) => void;
}

const breakpointColumns = {
  default: 5,
  1536: 4,
  1280: 4,
  1024: 3,
  768: 2,
  640: 2,
  480: 1,
};

export function MasonryGrid({ images, onLike, onSave }: MasonryGridProps) {
  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="text-6xl mb-4">🖼️</div>
        <h3 className="text-lg font-semibold text-neutral-700 mb-2">No images found</h3>
        <p className="text-sm text-neutral-500">Try a different search or explore other categories.</p>
      </div>
    );
  }

  return (
    <Masonry
      breakpointCols={breakpointColumns}
      className="flex -ml-4 w-auto"
      columnClassName="pl-4 bg-clip-padding"
    >
      {images.map((image) => (
        <ImageCard
          key={image.id}
          image={image}
          onLike={onLike}
          onSave={onSave}
        />
      ))}
    </Masonry>
  );
}
