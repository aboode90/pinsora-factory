"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { UserAvatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { MessageSquare, Send } from "lucide-react";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
}

interface ImageCommentsProps {
  imageId: string;
  initialComments: any[];
}

export function ImageComments({ imageId, initialComments }: ImageCommentsProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      window.location.href = "/auth/login";
      return;
    }
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/images/${imageId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (data.success) {
        setComments([data.data, ...comments]);
        setContent("");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-10 border-t border-neutral-100 pt-10">
      <h2 className="text-xl font-bold text-neutral-900 mb-6 flex items-center gap-2">
        <MessageSquare className="h-5 w-5" />
        Comments ({comments.length})
      </h2>

      {/* Add Comment */}
      <div className="flex gap-4 mb-8">
        <UserAvatar name={session?.user?.name} image={session?.user?.image} />
        <form onSubmit={handleSubmit} className="flex-1">
          <textarea
            placeholder="Add a comment..."
            className="w-full rounded-2xl border border-neutral-200 p-4 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 transition-all min-h-[100px] resize-none"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <div className="flex justify-end mt-2">
            <Button
              type="submit"
              disabled={!content.trim()}
              loading={isSubmitting}
              className="px-6"
            >
              Post Comment
            </Button>
          </div>
        </form>
      </div>

      {/* Comments List */}
      <div className="space-y-6">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-4">
            <UserAvatar name={comment.user.name} image={comment.user.image} />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-sm text-neutral-900">
                  {comment.user.name || "Anonymous"}
                </span>
                <span className="text-[10px] text-neutral-400 uppercase font-bold">
                  {formatDate(comment.createdAt)}
                </span>
              </div>
              <p className="text-sm text-neutral-700 leading-relaxed bg-neutral-50 p-4 rounded-2xl border border-neutral-100">
                {comment.content}
              </p>
            </div>
          </div>
        ))}

        {comments.length === 0 && (
          <div className="text-center py-10 text-neutral-400">
            <p className="text-sm italic">No comments yet. Be the first to say something!</p>
          </div>
        )}
      </div>
    </div>
  );
}
