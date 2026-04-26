"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Tag, Search, Trash2, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminTagsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [tags, setTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (session?.user?.role !== "ADMIN") {
      router.push("/");
      return;
    }
    fetchTags();
  }, [session, router]);

  const fetchTags = async () => {
    try {
      const res = await fetch("/api/admin/tags");
      const data = await res.json();
      if (data.success) {
        setTags(data.data);
      }
    } catch (error) {
      console.error("Fetch tags error:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTags = tags.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="p-10 text-center text-neutral-500">Loading tags...</div>;

  return (
    <div className="mx-auto max-w-screen-xl px-4 sm:px-6 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <Tag className="h-6 w-6 text-rose-500" />
            Tags Management
          </h1>
          <p className="text-sm text-neutral-500">{tags.length} total tags found.</p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search tags..."
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-neutral-100 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-6">
          {filteredTags.map((tag) => (
            <div key={tag.id} className="flex items-center justify-between p-4 rounded-xl border border-neutral-100 bg-neutral-50/50 hover:border-rose-200 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center border border-neutral-100">
                  <Hash className="h-4 w-4 text-neutral-400" />
                </div>
                <div>
                  <p className="font-bold text-neutral-900">#{tag.name}</p>
                  <p className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">
                    {tag._count?.images || 0} Images
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredTags.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-neutral-500 italic">No tags found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
