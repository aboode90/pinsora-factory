"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Move, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Category {
  id: string;
  name: string;
}

interface AdminImageToolsProps {
  imageId: string;
  currentCategoryId: string;
  categories: Category[];
}

export function AdminImageTools({
  imageId,
  currentCategoryId,
  categories,
}: AdminImageToolsProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState(currentCategoryId);
  const [isUpdating, setIsUpdating] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  if (session?.user?.role !== "ADMIN") return null;

  const handleMove = async () => {
    if (selectedCategory === currentCategoryId) return;

    setIsUpdating(true);
    setStatus("idle");

    try {
      const res = await fetch(`/api/images/${imageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId: selectedCategory }),
      });

      if (res.ok) {
        setStatus("success");
        router.refresh();
      } else {
        setStatus("error");
      }
    } catch (error) {
      setStatus("error");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="rounded-2xl border border-rose-100 bg-rose-50/30 p-4 space-y-3">
      <div className="flex items-center gap-2 text-rose-600">
        <Move className="h-4 w-4" />
        <h2 className="text-sm font-bold">Admin: Move Category</h2>
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="h-9 bg-white border-rose-200">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          size="sm"
          onClick={handleMove}
          disabled={isUpdating || selectedCategory === currentCategoryId}
          className="bg-rose-600 hover:bg-rose-700 text-white"
        >
          {isUpdating ? "..." : "Move"}
        </Button>
      </div>

      {status === "success" && (
        <p className="text-[10px] text-green-600 flex items-center gap-1 font-medium">
          <Check className="h-3 w-3" /> Updated successfully
        </p>
      )}
      {status === "error" && (
        <p className="text-[10px] text-red-600 flex items-center gap-1 font-medium">
          <AlertCircle className="h-3 w-3" /> Failed to update
        </p>
      )}
    </div>
  );
}
