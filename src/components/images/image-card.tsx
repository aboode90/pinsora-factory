"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Heart, Bookmark, Share2, MoreHorizontal } from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";
import { UserAvatar } from "@/components/ui/avatar";
import type { ImageWithRelations } from "@/types";

interface ImageCardProps {
  image: ImageWithRelations;
  onLike?: (id: string, liked: boolean) => void;
  onSave?: (id: string, saved: boolean) => void;
}

export function ImageCard({ image, onLike, onSave }: ImageCardProps) {
  const { data: session } = useSession();
  const [isLiked, setIsLiked] = useState(image.isLiked ?? false);
  const [isSaved, setIsSaved] = useState(image.isSaved ?? false);
  const [likeCount, setLikeCount] = useState(image.likeCount);
  const [isHovered, setIsHovered] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!session) {
      window.location.href = "/auth/login";
      return;
    }
    if (isLiking) return;

    setIsLiking(true);
    const newLiked = !isLiked;
    setIsLiked(newLiked);
    setLikeCount((c) => (newLiked ? c + 1 : c - 1));

    try {
      const res = await fetch(`/api/images/${image.id}/like`, { method: "POST" });
      const data = await res.json();
      if (!data.success) {
        setIsLiked(!newLiked);
        setLikeCount((c) => (newLiked ? c - 1 : c + 1));
      } else {
        onLike?.(image.id, data.liked);
      }
    } catch {
      setIsLiked(!newLiked);
      setLikeCount((c) => (newLiked ? c - 1 : c + 1));
    } finally {
      setIsLiking(false);
    }
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!session) {
      window.location.href = "/auth/login";
      return;
    }
    if (isSaving) return;

    setIsSaving(true);
    const newSaved = !isSaved;
    setIsSaved(newSaved);

    try {
      const res = await fetch(`/api/images/${image.id}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!data.success) {
        setIsSaved(!newSaved);
      } else {
        onSave?.(image.id, data.saved);
      }
    } catch {
      setIsSaved(!newSaved);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const cleanName = image.title.replace(/[^a-z0-9]/gi, "-").toLowerCase();
      const downloadUrl = `/api/download?url=${encodeURIComponent(image.imageUrl)}&filename=${encodeURIComponent(cleanName)}`;
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${cleanName}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      window.open(image.imageUrl, "_blank");
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/images/${image.id}`;
    if (navigator.share) {
      await navigator.share({ title: image.title, url });
    } else {
      await navigator.clipboard.writeText(url);
    }
  };

  return (
    <div
      className="group relative break-inside-avoid mb-4 rounded-2xl overflow-hidden bg-neutral-100 cursor-pointer active:scale-[0.98] transition-transform duration-100"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/images/${image.id}`} aria-label={image.title}>
        <div className="relative w-full">
          <Image
            src={image.thumbnailUrl ?? image.imageUrl}
            alt={image.title}
            width={image.width ?? 400}
            height={image.height ?? 300}
            className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            placeholder={image.blurHash ? "blur" : "empty"}
            blurDataURL={image.blurHash ?? undefined}
          />

          {/* Overlay on hover */}
          <div
            className={cn(
              "absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 transition-opacity duration-200",
              isHovered ? "opacity-100" : "opacity-0"
            )}
          />

          {/* Top actions */}
          <div
            className={cn(
              "absolute top-3 right-3 flex gap-1.5 transition-all duration-200",
              isHovered ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
            )}
          >
            <button
              onClick={handleSave}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full shadow-md transition-all",
                isSaved
                  ? "bg-rose-500 text-white"
                  : "bg-white text-neutral-700 hover:bg-rose-500 hover:text-white"
              )}
              aria-label={isSaved ? "Unsave" : "Save"}
            >
              <Bookmark className="h-4 w-4" fill={isSaved ? "currentColor" : "none"} />
            </button>
          </div>

          {/* Bottom info */}
          <div
            className={cn(
              "absolute bottom-0 left-0 right-0 p-3 transition-all duration-200",
              isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
            )}
          >
            <p className="text-white text-sm font-semibold line-clamp-2 mb-2">{image.title}</p>

            <div className="flex items-center justify-between">
              {/* Author */}
              <Link
                href={`/profile/${image.user.username ?? image.user.id}`}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1.5 group/author"
              >
                <UserAvatar name={image.user.name} image={image.user.image} size="sm" />
                <span className="text-white text-xs font-medium group-hover/author:underline truncate max-w-[80px]">
                  {image.user.name ?? "Unknown"}
                </span>
              </Link>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <button
                  onClick={handleLike}
                  className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs transition-colors"
                  aria-label={isLiked ? "Unlike" : "Like"}
                >
                  <Heart
                    className="h-3.5 w-3.5"
                    fill={isLiked ? "currentColor" : "none"}
                    color={isLiked ? "#f43f5e" : "white"}
                  />
                  <span>{formatNumber(likeCount)}</span>
                </button>

                <button
                  onClick={handleShare}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                  aria-label="Share"
                >
                  <Share2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </Link>

      {/* Category badge */}
      <Link
        href={`/categories/${image.category.slug}`}
        className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-white/90 text-xs font-medium text-neutral-700 hover:bg-white transition-colors opacity-0 group-hover:opacity-100"
        onClick={(e) => e.stopPropagation()}
      >
        {image.category.name}
      </Link>
    </div>
  );
}
