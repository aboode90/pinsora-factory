import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { InfiniteScrollGrid } from "@/components/images/infinite-scroll";
import Link from "next/link";
import { TrendingUp, Clock, Eye, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageProps {
  searchParams: Promise<{ sort?: string; category?: string }>;
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Explore Images",
  description: "Discover trending and new images across all categories on Pinsora.",
};

const sortOptions = [
  { value: "new", label: "New", icon: Clock },
  { value: "popular", label: "Popular", icon: TrendingUp },
  { value: "views", label: "Most Viewed", icon: Eye },
  { value: "featured", label: "Featured", icon: Flame },
];

export default async function ExplorePage({ searchParams }: PageProps) {
  const { sort = "new", category } = await searchParams;

  const orderBy =
    sort === "popular"
      ? { likeCount: "desc" as const }
      : sort === "views"
      ? { viewCount: "desc" as const }
      : { createdAt: "desc" as const };

  const where: Record<string, unknown> = { isPublished: true };
  if (sort === "featured") where.isFeatured = true;
  if (category) where.category = { slug: category };

  const images = await prisma.image.findMany({
    where,
    orderBy,
    take: 20,
    include: {
      category: { select: { id: true, name: true, slug: true } },
      user: { select: { id: true, name: true, username: true, image: true } },
      tags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
      _count: { select: { likes: true, saves: true, comments: true } },
    },
  });

  const fetchUrl = `/api/images?sortBy=${sort}${category ? `&category=${category}` : ""}`;

  return (
    <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Explore</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Discover stunning images from creators worldwide</p>
        </div>

        {/* Sort tabs */}
        <div className="flex gap-1 bg-neutral-100 rounded-full p-1">
          {sortOptions.map(({ value, label, icon: Icon }) => (
            <Link
              key={value}
              href={`/explore?sort=${value}${category ? `&category=${category}` : ""}`}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                sort === value
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-700"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </Link>
          ))}
        </div>
      </div>

      <InfiniteScrollGrid
        initialImages={images as Parameters<typeof InfiniteScrollGrid>[0]["initialImages"]}
        fetchUrl={fetchUrl}
      />
    </div>
  );
}
