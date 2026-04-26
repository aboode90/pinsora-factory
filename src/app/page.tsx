import { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { InfiniteScrollGrid } from "@/components/images/infinite-scroll";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Pinsora — Discover Beautiful Creative Images",
  description:
    "Explore thousands of stunning images across art, photography, design, and more.",
};

export const dynamic = "force-dynamic";

async function getRecommendedImages(userId?: string) {
  try {
    // Basic recommendation: categories user liked before
    let preferredCategoryIds: string[] = [];

    if (userId) {
      const liked = await prisma.like.findMany({
        where: { userId },
        select: { image: { select: { categoryId: true } } },
        take: 20
      });
      preferredCategoryIds = Array.from(new Set(liked.map(l => l.image.categoryId)));
    }

    const images = await prisma.image.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: "desc" },
      take: 40,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        user: { select: { id: true, name: true, username: true, image: true } },
        tags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
        _count: { select: { likes: true, saves: true, comments: true } },
      },
    });

    if (preferredCategoryIds.length > 0) {
      return images.sort((a, b) => {
        const aPref = preferredCategoryIds.includes(a.categoryId) ? 1 : 0;
        const bPref = preferredCategoryIds.includes(b.categoryId) ? 1 : 0;
        return bPref - aPref;
      });
    }

    return images;
  } catch (error) {
    console.error("Failed to fetch images:", error);
    return [];
  }
}

export default async function HomePage() {
  const session = await auth();

  // If user is not logged in, show Landing Page
  if (!session) {
    return (
      <div className="flex flex-col items-center">
        {/* Hero Section for Unauthenticated Users */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-white">
          <div className="container px-4 md:px-6 mx-auto text-center">
            <h1 className="text-4xl font-extrabold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl mb-6">
              Find your next <span className="text-rose-600">inspiration</span>
            </h1>
            <p className="mx-auto max-w-[700px] text-neutral-500 md:text-xl mb-8">
              Join our community to explore thousands of stunning images, save your favorites,
              and generate new ideas with AI.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/register">
                <Button size="lg" className="rounded-full px-8 bg-rose-600 hover:bg-rose-700 text-white font-bold text-lg h-14">
                  Sign up now
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button variant="outline" size="lg" className="rounded-full px-8 border-neutral-300 font-bold text-lg h-14">
                  Log in
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Sneak Peek (Blurred or limited) */}
        <div className="w-full bg-neutral-50 py-12 border-t border-neutral-100">
          <div className="container px-4 mx-auto text-center mb-10">
            <h2 className="text-2xl font-bold text-neutral-800">Explore categories</h2>
          </div>
          <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto px-4">
             {["Photography", "Digital Art", "Architecture", "Fashion", "Nature", "Logos", "Travel"].map((cat) => (
               <div key={cat} className="px-6 py-3 bg-white rounded-full border border-neutral-200 shadow-sm font-medium text-neutral-600">
                 {cat}
               </div>
             ))}
          </div>
        </div>
      </div>
    );
  }

  // If logged in, show the regular feed
  const images = await getRecommendedImages(session.user.id);

  return (
    <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 py-6">
      <div className="flex justify-center mb-8">
         <div className="flex bg-neutral-100 p-1 rounded-full">
            <Link href="/" className="px-6 py-2 bg-white shadow-sm rounded-full text-sm font-bold text-neutral-900">
               For You
            </Link>
            <Link href="/explore" className="px-6 py-2 rounded-full text-sm font-bold text-neutral-500 hover:text-neutral-700">
               Explore
            </Link>
         </div>
      </div>

      {images.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <div className="text-6xl mb-4">🖼️</div>
          <h2 className="text-xl font-semibold text-neutral-700 mb-2">
            No images yet
          </h2>
          <p className="text-sm text-neutral-500">
            Be the first to upload an image!
          </p>
        </div>
      ) : (
        <InfiniteScrollGrid
          initialImages={images as Parameters<typeof InfiniteScrollGrid>[0]["initialImages"]}
          fetchUrl="/api/images"
        />
      )}
    </div>
  );
}
