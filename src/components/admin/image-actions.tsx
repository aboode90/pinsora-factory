"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Star, StarOff, Trash2 } from "lucide-react";

interface AdminImageActionsProps {
  imageId: string;
  isPublished: boolean;
  isFeatured: boolean;
}

export function AdminImageActions({ imageId, isPublished, isFeatured }: AdminImageActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const update = async (data: Record<string, unknown>) => {
    setLoading(true);
    try {
      await fetch(`/api/images/${imageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this image? This cannot be undone.")) return;
    setLoading(true);
    try {
      await fetch(`/api/images/${imageId}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => update({ isPublished: !isPublished })}
        disabled={loading}
        className="h-7 w-7 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors disabled:opacity-50"
        title={isPublished ? "Unpublish" : "Publish"}
      >
        {isPublished ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
      </button>

      <button
        onClick={() => update({ isFeatured: !isFeatured })}
        disabled={loading}
        className="h-7 w-7 rounded-lg flex items-center justify-center text-neutral-400 hover:text-amber-500 hover:bg-amber-50 transition-colors disabled:opacity-50"
        title={isFeatured ? "Remove from featured" : "Feature"}
      >
        {isFeatured ? (
          <Star className="h-3.5 w-3.5 text-amber-500" fill="currentColor" />
        ) : (
          <Star className="h-3.5 w-3.5" />
        )}
      </button>

      <button
        onClick={handleDelete}
        disabled={loading}
        className="h-7 w-7 rounded-lg flex items-center justify-center text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
        title="Delete"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
