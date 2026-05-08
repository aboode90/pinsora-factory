import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { InfiniteScrollGrid } from "@/components/images/infinite-scroll";
import { Compass } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://pinsora.com").replace(/\/$/, "");

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isAr = locale === "ar";

  const title = isAr ? "استكشف — بينسورا" : "Explore — Pinsora";
  const description = isAr
    ? "استكشف آلاف الصور المذهلة من مجتمعنا الإبداعي."
    : "Explore thousands of stunning images from our creative community.";

  return {
    title,
    description,
    alternates: {
      canonical: `${siteUrl}/${locale}/explore`,
      languages: {
        en: `${siteUrl}/en/explore`,
        ar: `${siteUrl}/ar/explore`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${siteUrl}/${locale}/explore`,
    },
  };
}

export default async function ExplorePage() {
  const images = await prisma.image.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      category: { select: { id: true, name: true, slug: true } },
      user: { select: { id: true, name: true, username: true, image: true } },
      tags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
      _count: { select: { likes: true, saves: true, comments: true } },
    },
  });

  return (
    <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 py-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl bg-rose-50 flex items-center justify-center">
          <Compass className="h-5 w-5 text-rose-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Explore</h1>
          <p className="text-sm text-neutral-500">Discover the latest images from our community</p>
        </div>
      </div>

      <InfiniteScrollGrid
        initialImages={images as Parameters<typeof InfiniteScrollGrid>[0]["initialImages"]}
        fetchUrl="/api/images"
      />
    </div>
  );
}
