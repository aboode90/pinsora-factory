"use client";

import React, { useEffect, useRef, useCallback, useState } from "react";
import { MasonryGrid } from "./masonry-grid";
import type { ImageWithRelations } from "@/types";

interface InfiniteScrollGridProps {
  initialImages: ImageWithRelations[];
  fetchUrl: string;
  pageSize?: number;
}

export function InfiniteScrollGrid({
  initialImages,
  fetchUrl,
  pageSize = 20,
}: InfiniteScrollGridProps) {
  const [images, setImages] = useState<ImageWithRelations[]>(initialImages);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);

    try {
      const nextPage = page + 1;
      const separator = fetchUrl.includes("?") ? "&" : "?";
      const url = `${fetchUrl}${separator}page=${nextPage}&pageSize=${pageSize}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.success && data.data.length > 0) {
        setImages((prev) => [...prev, ...data.data]);
        setPage(nextPage);
        setHasMore(data.hasMore);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error("Failed to load more images:", err);
    } finally {
      setLoading(false);
    }
  }, [fetchUrl, page, pageSize, loading, hasMore]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "400px" }
    );

    observerRef.current.observe(sentinel);
    return () => observerRef.current?.disconnect();
  }, [loadMore]);

  // Reset when initialImages change (e.g., filter change)
  useEffect(() => {
    setImages(initialImages);
    setPage(1);
    setHasMore(true);
  }, [initialImages]);

  return (
    <div>
      <MasonryGrid images={images} />

      {/* Sentinel for infinite scroll */}
      <div ref={sentinelRef} className="h-4" />

      {loading && (
        <div className="flex justify-center py-8">
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-2.5 w-2.5 rounded-full bg-rose-400 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      )}

      {!hasMore && images.length > 0 && (
        <p className="text-center text-sm text-neutral-400 py-8">
          You&apos;ve seen all the images ✨
        </p>
      )}
    </div>
  );
}
