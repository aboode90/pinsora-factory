"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { UserAvatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MasonryGrid } from "@/components/images/masonry-grid";
import { formatDate } from "@/lib/utils";
import { Grid, Bookmark, Settings } from "lucide-react";
import type { ImageWithRelations } from "@/types";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"images" | "saved">("images");

  if (status === "unauthenticated") {
    router.push("/auth/login");
    return null;
  }

  const { data: images, isLoading } = useQuery({
    queryKey: ["profile-images", session?.user?.id, activeTab],
    queryFn: async () => {
      const url =
        activeTab === "images"
          ? `/api/images?userId=${session?.user?.id}`
          : `/api/images?saved=true`;
      const res = await fetch(url);
      const data = await res.json();
      return data.data as ImageWithRelations[];
    },
    enabled: !!session?.user?.id,
  });

  return (
    <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 py-8">
      {/* Profile header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-10 pb-8 border-b border-neutral-100">
        <UserAvatar
          name={session?.user?.name}
          image={session?.user?.image}
          size="lg"
          className="h-20 w-20 text-2xl"
        />
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-neutral-900">{session?.user?.name}</h1>
          <p className="text-neutral-500 text-sm mt-0.5">{session?.user?.email}</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => router.push("/settings")}>
          <Settings className="h-4 w-4" />
          Edit Profile
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 bg-neutral-100 rounded-full p-1 w-fit">
        <button
          onClick={() => setActiveTab("images")}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
            activeTab === "images"
              ? "bg-white text-neutral-900 shadow-sm"
              : "text-neutral-500 hover:text-neutral-700"
          }`}
        >
          <Grid className="h-4 w-4" />
          My Images
        </button>
        <button
          onClick={() => setActiveTab("saved")}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
            activeTab === "saved"
              ? "bg-white text-neutral-900 shadow-sm"
              : "text-neutral-500 hover:text-neutral-700"
          }`}
        >
          <Bookmark className="h-4 w-4" />
          Saved
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-neutral-100 aspect-[3/4] skeleton" />
          ))}
        </div>
      ) : (
        <MasonryGrid images={images ?? []} />
      )}
    </div>
  );
}
