import { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { InfiniteScrollGrid } from "@/components/images/infinite-scroll";
import { Search, Hash, TrendingUp } from "lucide-react";

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { q } = await searchParams;
  return {
    title: q ? `"${q}" — Pinsora` : "Search — Pinsora",
    description: q ? `Search results for "${q}" on Pinsora` : "Search images on Pinsora",
  };
}

export default async function SearchPage({ searchParams }: PageProps) {
  const { q } = await searchParams;

  // No query — show trending tags
  if (!q || q.trim().length < 1) {
    const trendingTags = await prisma.tag.findMany({
      take: 30,
      include: { _count: { select: { images: true } } },
      orderBy: { images: { _count: "desc" } },
    });

    return (
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 py-10">
        <div className="max-w-2xl mx-auto text-center mb-10">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 mb-4">
            <Search className="h-8 w-8 text-neutral-400" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">
            What are you looking for?
          </h1>
          <p className="text-neutral-500 text-sm">
            Search for images, tags, or topics to discover amazing content
          </p>
        </div>

        {/* Trending Tags */}
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-rose-500" />
            <h2 className="text-sm font-semibold text-neutral-700">Trending Tags</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {trendingTags.map((tag) => (
              <Link
                key={tag.id}
                href={`/search?q=${encodeURIComponent(tag.name)}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-neutral-100 hover:bg-rose-50 hover:text-rose-600 text-sm font-medium text-neutral-700 transition-colors"
              >
                <Hash className="h-3.5 w-3.5" />
                {tag.name}
                <span className="text-xs text-neutral-400 ml-0.5">
                  {tag._count.images}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Search results
  const [images, total, relatedTags] = await Promise.all([
    prisma.image.findMany({
      where: {
        isPublished: true,
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { tags: { some: { tag: { name: { contains: q, mode: "insensitive" } } } } },
          { category: { name: { contains: q, mode: "insensitive" } } },
        ],
      },
      orderBy: { viewCount: "desc" },
      take: 20,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        user: { select: { id: true, name: true, username: true, image: true } },
        tags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
        _count: { select: { likes: true, saves: true, comments: true } },
      },
    }),
    prisma.image.count({
      where: {
        isPublished: true,
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { tags: { some: { tag: { name: { contains: q, mode: "insensitive" } } } } },
        ],
      },
    }),
    prisma.tag.findMany({
      where: { name: { contains: q, mode: "insensitive" } },
      take: 10,
      include: { _count: { select: { images: true } } },
      orderBy: { images: { _count: "desc" } },
    }),
  ]);

  return (
    <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-neutral-900 mb-1">
          Results for &ldquo;{q}&rdquo;
        </h1>
        <p className="text-sm text-neutral-500">
          {total.toLocaleString()} image{total !== 1 ? "s" : ""} found
        </p>
      </div>

      {/* Related Tags */}
      {relatedTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {relatedTags.map((tag) => (
            <Link
              key={tag.id}
              href={`/search?q=${encodeURIComponent(tag.name)}`}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                tag.name.toLowerCase() === q.toLowerCase()
                  ? "bg-neutral-900 text-white"
                  : "bg-neutral-100 hover:bg-neutral-200 text-neutral-700"
              }`}
            >
              <Hash className="h-3 w-3" />
              {tag.name}
            </Link>
          ))}
        </div>
      )}

      {/* Results */}
      {images.length === 0 ? (
        <div className="text-center py-24">
          <div className="text-5xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold text-neutral-700 mb-2">No results found</h3>
          <p className="text-sm text-neutral-500 mb-6">
            Try different keywords or browse trending tags
          </p>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-100 hover:bg-neutral-200 text-sm font-medium text-neutral-700 transition-colors"
          >
            Browse Trending Tags
          </Link>
        </div>
      ) : (
        <InfiniteScrollGrid
          initialImages={images as Parameters<typeof InfiniteScrollGrid>[0]["initialImages"]}
          fetchUrl={`/api/images?search=${encodeURIComponent(q)}`}
        />
      )}
    </div>
  );
}
