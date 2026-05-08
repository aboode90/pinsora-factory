"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { MasonryGrid } from "@/components/images/masonry-grid";
import { UserAvatar } from "@/components/ui/avatar";
import { Lock, LayoutGrid, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { ImageWithRelations } from "@/types";

interface BoardData {
  id: string;
  name: string;
  description: string | null;
  isPrivate: boolean;
  user: { id: string; name: string | null; username: string | null; image: string | null };
  _count: { boardImages: number };
  boardImages: Array<{ image: ImageWithRelations; addedAt: string }>;
}

interface Props {
  params: Promise<{ id: string; locale: string }>;
}

export default function BoardDetailClient({ params: _params }: Props) {
  const params = useParams<{ id: string }>();

  const { data: board, isLoading, error } = useQuery<BoardData>({
    queryKey: ["board", params.id],
    queryFn: async () => {
      const res = await fetch(`/api/boards/${params.id}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? "Board not found");
      return data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-300" />
      </div>
    );
  }

  if (error || !board) {
    return (
      <div className="text-center py-24">
        <div className="text-5xl mb-4">📌</div>
        <h3 className="text-lg font-semibold text-neutral-700 mb-2">Board not found</h3>
        <Link href="/boards" className="text-rose-600 hover:underline text-sm">
          Back to Boards
        </Link>
      </div>
    );
  }

  const images = board.boardImages.map((bi) => bi.image);
  const profileHref = board.user.username
    ? `/profile/${board.user.username}`
    : `/profile/${board.user.id}`;

  return (
    <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/boards"
          className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700 mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          All Boards
        </Link>

        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-2xl bg-rose-50 flex items-center justify-center shrink-0">
            <LayoutGrid className="h-6 w-6 text-rose-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {board.isPrivate && <Lock className="h-4 w-4 text-neutral-400" />}
              <h1 className="text-2xl font-extrabold text-neutral-900 truncate">{board.name}</h1>
            </div>
            {board.description && (
              <p className="text-sm text-neutral-500 mb-2">{board.description}</p>
            )}
            <div className="flex items-center gap-3">
              <Link href={profileHref} className="flex items-center gap-2 group">
                <UserAvatar name={board.user.name} image={board.user.image} size="sm" />
                <span className="text-sm font-medium text-neutral-700 group-hover:text-rose-600 transition-colors">
                  {board.user.name ?? "Anonymous"}
                </span>
              </Link>
              <span className="text-neutral-300">·</span>
              <span className="text-sm text-neutral-400">{board._count.boardImages} images</span>
            </div>
          </div>
        </div>
      </div>

      {/* Images */}
      {images.length === 0 ? (
        <div className="text-center py-24">
          <div className="text-5xl mb-4">🖼️</div>
          <p className="text-neutral-500">No images in this board yet.</p>
        </div>
      ) : (
        <MasonryGrid images={images} />
      )}
    </div>
  );
}
