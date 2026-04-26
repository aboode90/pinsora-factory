"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { Plus, Lock, Globe, Trash2, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";

interface Board {
  id: string;
  name: string;
  description: string | null;
  isPrivate: boolean;
  createdAt: string;
  _count: { boardImages: number };
  boardImages: Array<{
    image: { id: string; imageUrl: string; thumbnailUrl: string | null; title: string };
  }>;
}

export default function BoardsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [newBoardDesc, setNewBoardDesc] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);

  if (status === "unauthenticated") {
    router.push("/auth/login?callbackUrl=/boards");
    return null;
  }

  const { data, isLoading } = useQuery({
    queryKey: ["boards"],
    queryFn: async () => {
      const res = await fetch("/api/boards");
      const data = await res.json();
      return data.data as Board[];
    },
    enabled: !!session,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newBoardName, description: newBoardDesc, isPrivate }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boards"] });
      setCreateOpen(false);
      setNewBoardName("");
      setNewBoardDesc("");
      setIsPrivate(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (boardId: string) => {
      await fetch(`/api/boards/${boardId}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boards"] });
    },
  });

  return (
    <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">My Boards</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Organize your saved images into collections
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Board
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-neutral-100 aspect-[4/3] skeleton" />
          ))}
        </div>
      ) : data?.length === 0 ? (
        <div className="text-center py-24">
          <div className="text-5xl mb-4">📌</div>
          <h3 className="text-lg font-semibold text-neutral-700 mb-2">No boards yet</h3>
          <p className="text-sm text-neutral-500 mb-6">
            Create your first board to start saving images.
          </p>
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Board
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {data?.map((board) => (
            <div key={board.id} className="group relative rounded-2xl overflow-hidden border border-neutral-100 hover:shadow-md transition-shadow">
              <Link href={`/boards/${board.id}`}>
                {/* Cover images grid */}
                <div className="grid grid-cols-2 gap-0.5 aspect-[4/3] bg-neutral-100">
                  {board.boardImages.slice(0, 4).map((bi, i) => (
                    <div key={i} className="relative overflow-hidden bg-neutral-200">
                      <Image
                        src={bi.image.thumbnailUrl ?? bi.image.imageUrl}
                        alt={bi.image.title}
                        fill
                        className="object-cover"
                        sizes="200px"
                      />
                    </div>
                  ))}
                  {board.boardImages.length === 0 && (
                    <div className="col-span-2 flex items-center justify-center text-neutral-300">
                      <span className="text-4xl">📌</span>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-neutral-900 line-clamp-1">{board.name}</h3>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {board._count.boardImages} images · {formatDate(board.createdAt)}
                      </p>
                    </div>
                    {board.isPrivate ? (
                      <Lock className="h-4 w-4 text-neutral-400 shrink-0 mt-0.5" />
                    ) : (
                      <Globe className="h-4 w-4 text-neutral-400 shrink-0 mt-0.5" />
                    )}
                  </div>
                </div>
              </Link>

              {/* Delete button */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  if (confirm("Delete this board?")) {
                    deleteMutation.mutate(board.id);
                  }
                }}
                className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/90 text-neutral-500 hover:text-red-500 hover:bg-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                aria-label="Delete board"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Create Board Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Board</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <Input
              label="Board Name"
              placeholder="e.g., Inspiration, Travel, Architecture..."
              value={newBoardName}
              onChange={(e) => setNewBoardName(e.target.value)}
            />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                Description <span className="text-neutral-400 font-normal">(optional)</span>
              </label>
              <textarea
                placeholder="What's this board about?"
                rows={3}
                value={newBoardDesc}
                onChange={(e) => setNewBoardDesc(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none"
              />
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="h-4 w-4 rounded border-neutral-300 text-rose-500 focus:ring-rose-500"
              />
              <div>
                <p className="text-sm font-medium text-neutral-700">Private board</p>
                <p className="text-xs text-neutral-500">Only you can see this board</p>
              </div>
            </label>
            <div className="flex gap-2 pt-2">
              <Button
                onClick={() => createMutation.mutate()}
                loading={createMutation.isPending}
                disabled={!newBoardName.trim()}
                className="flex-1"
              >
                Create Board
              </Button>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
