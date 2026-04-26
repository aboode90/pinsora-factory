"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Heart, Bookmark, Download, Share2, Check, Trash2, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatNumber } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ImageActionsProps {
  imageId: string;
  imageUrl: string;
  imageTitle: string;
  initialLiked?: boolean;
  initialSaved?: boolean;
  likeCount?: number;
  ownerId?: string;
}

export function ImageActions({
  imageId,
  imageUrl,
  imageTitle,
  initialLiked = false,
  initialSaved = false,
  likeCount: initialLikeCount = 0,
  ownerId,
}: ImageActionsProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [copied, setCopied] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Report states
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState("SPAM");
  const [isReporting, setIsReporting] = useState(false);

  const isOwner = session?.user?.id === ownerId;
  const isAdmin = (session?.user as any)?.role === "ADMIN";
  const canDelete = isOwner || isAdmin;
  const canReport = !isOwner && session;

  const handleLike = async () => {
    if (!session) {
      window.location.href = "/auth/login";
      return;
    }
    const newLiked = !isLiked;
    setIsLiked(newLiked);
    setLikeCount((c) => (newLiked ? c + 1 : c - 1));

    try {
      const res = await fetch(`/api/images/${imageId}/like`, { method: "POST" });
      const data = await res.json();
      if (!data.success) {
        setIsLiked(!newLiked);
        setLikeCount((c) => (newLiked ? c - 1 : c + 1));
      }
    } catch {
      setIsLiked(!newLiked);
      setLikeCount((c) => (newLiked ? c - 1 : c + 1));
    }
  };

  const handleSave = async () => {
    if (!session) {
      window.location.href = "/auth/login";
      return;
    }
    const newSaved = !isSaved;
    setIsSaved(newSaved);

    try {
      const res = await fetch(`/api/images/${imageId}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!data.success) setIsSaved(!newSaved);
    } catch {
      setIsSaved(!newSaved);
    }
  };

  const handleDownload = async () => {
    try {
      const cleanName = imageTitle.replace(/[^a-z0-9]/gi, "-").toLowerCase();
      const downloadUrl = `/api/download?url=${encodeURIComponent(imageUrl)}&filename=${encodeURIComponent(cleanName)}`;
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${cleanName}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      window.open(imageUrl, "_blank");
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/images/${imageId}`;
    if (navigator.share) {
      await navigator.share({ title: imageTitle, url });
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/images/${imageId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/");
        router.refresh();
      } else {
        alert("Failed to delete image");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("An error occurred while deleting the image");
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleReport = async () => {
    setIsReporting(true);
    try {
      const res = await fetch(`/api/images/${imageId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reportReason }),
      });
      if (res.ok) {
        alert("Image reported successfully");
      } else {
        alert("Failed to report image");
      }
    } catch (error) {
      alert("An error occurred");
    } finally {
      setIsReporting(false);
      setIsReportDialogOpen(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        onClick={handleLike}
        variant={isLiked ? "default" : "outline"}
        className={cn(
          "gap-2",
          isLiked && "bg-rose-500 hover:bg-rose-600 border-rose-500"
        )}
      >
        <Heart className="h-4 w-4" fill={isLiked ? "currentColor" : "none"} />
        {likeCount > 0 ? formatNumber(likeCount) : "Like"}
      </Button>

      <Button
        onClick={handleSave}
        variant={isSaved ? "default" : "outline"}
        className={cn(
          "gap-2",
          isSaved && "bg-violet-500 hover:bg-violet-600 border-violet-500"
        )}
      >
        <Bookmark className="h-4 w-4" fill={isSaved ? "currentColor" : "none"} />
        {isSaved ? "Saved" : "Save"}
      </Button>

      <Button onClick={handleDownload} variant="outline" className="gap-2">
        <Download className="h-4 w-4" />
        Download
      </Button>

      <Button onClick={handleShare} variant="outline" className="gap-2">
        {copied ? (
          <>
            <Check className="h-4 w-4 text-green-500" />
            Copied!
          </>
        ) : (
          <>
            <Share2 className="h-4 w-4" />
            Share
          </>
        )}
      </Button>

      {canReport && (
        <>
          <Button
            onClick={() => setIsReportDialogOpen(true)}
            variant="outline"
            className="gap-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
          >
            <Flag className="h-4 w-4" />
            Report
          </Button>

          <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Report Image</DialogTitle>
                <DialogDescription>
                  Help us understand what&apos;s wrong with this image.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <label className="text-sm font-medium mb-2 block">Reason</label>
                <Select value={reportReason} onValueChange={setReportReason}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SPAM">Spam</SelectItem>
                    <SelectItem value="INAPPROPRIATE">Inappropriate Content</SelectItem>
                    <SelectItem value="COPYRIGHT">Copyright Violation</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setIsReportDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleReport} loading={isReporting}>
                  Send Report
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}

      {canDelete && (
        <>
          <Button
            onClick={() => setIsDeleteDialogOpen(true)}
            variant="outline"
            className="gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 border-neutral-200"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>

          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Image</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this image? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  variant="ghost"
                  onClick={() => setIsDeleteDialogOpen(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  loading={isDeleting}
                >
                  Delete Image
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
