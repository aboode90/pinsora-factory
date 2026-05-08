import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { HomeFeed } from "@/components/images/home-feed";
import { Button } from "@/components/ui/button";
import { getLocale, getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://pinsora.com").replace(/\/$/, "");

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isAr = locale === "ar";

  const title = isAr
    ? "بينسورا — اكتشف صوراً إبداعية رائعة"
    : "Pinsora — Discover Beautiful Creative Images";
  const description = isAr
    ? "استكشف آلاف الصور المذهلة في الفن والتصوير والتصميم والمزيد. اعثر على الإلهام الإبداعي والفن المولّد بالذكاء الاصطناعي."
    : "Explore thousands of stunning images across art, photography, design, and more. Find creative inspiration, AI-generated art, wallpapers, and aesthetic photos.";

  return {
    title,
    description,
    alternates: {
      canonical: `${siteUrl}/${locale}`,
      languages: {
        en: `${siteUrl}/en`,
        ar: `${siteUrl}/ar`,
        "x-default": `${siteUrl}/en`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${siteUrl}/${locale}`,
      locale: isAr ? "ar_SA" : "en_US",
    },
  };
}

async function getFollowingFeed(userId: string) {
  try {
    const followingCount = await prisma.follow.count({ where: { followerId: userId } });
    if (followingCount === 0) return { images: [], followingCount: 0 };

    const follows = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });
    const followingIds = follows.map((f) => f.followingId);

    const images = await prisma.image.findMany({
      where: { userId: { in: followingIds }, isPublished: true },
      orderBy: { createdAt: "desc" },
      take: 40,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        user: { select: { id: true, name: true, username: true, image: true } },
        tags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
        _count: { select: { likes: true, saves: true, comments: true } },
      },
    });

    return { images, followingCount };
  } catch {
    return { images: [], followingCount: 0 };
  }
}

async function getRecommendedImages(userId?: string) {
  try {
    let preferredCategoryIds: string[] = [];
    let searchKeywords: string[] = [];

    if (userId) {
      const [liked, saved, searches] = await Promise.all([
        prisma.like.findMany({
          where: { userId },
          select: { image: { select: { categoryId: true } } },
          orderBy: { createdAt: "desc" },
          take: 20,
        }),
        prisma.save.findMany({
          where: { userId },
          select: { image: { select: { categoryId: true } } },
          orderBy: { createdAt: "desc" },
          take: 20,
        }),
        prisma.searchHistory.findMany({
          where: { userId },
          select: { query: true },
          orderBy: { createdAt: "desc" },
          take: 10,
        }),
      ]);

      preferredCategoryIds = Array.from(new Set([
        ...liked.map((l) => l.image.categoryId),
        ...saved.map((s) => s.image.categoryId),
      ]));
      searchKeywords = searches.map((s) => s.query.toLowerCase());
    }

    const images = await prisma.image.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: "desc" },
      take: 60,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        user: { select: { id: true, name: true, username: true, image: true } },
        tags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
        _count: { select: { likes: true, saves: true, comments: true } },
      },
    });

    if (userId && (preferredCategoryIds.length > 0 || searchKeywords.length > 0)) {
      return images
        .map((img) => {
          let score = 0;
          if (preferredCategoryIds.includes(img.categoryId)) score += 10;

          const imgText = `${img.title} ${img.category.name} ${img.tags.map((t) => t.tag.name).join(" ")}`.toLowerCase();
          for (const kw of searchKeywords) {
            if (imgText.includes(kw)) score += 15;
          }

          return { img, score };
        })
        .sort((a, b) => b.score - a.score || 0)
        .map((item) => item.img)
        .slice(0, 40);
    }

    return images.slice(0, 40);
  } catch {
    return [];
  }
}

export default async function LocaleHomePage() {
  const session = await auth();
  const locale = await getLocale();
  const t = await getTranslations();

  if (!session) {
    return (
      <div className="flex flex-col items-center">
        <section className="w-full py-8 md:py-24 lg:py-32 bg-white">
          <div className="container px-4 md:px-6 mx-auto text-center">
            <h1 className="text-3xl font-extrabold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl mb-4 sm:mb-6">
              {t("home.title")} <span className="text-rose-600">{t("home.highlight")}</span>
            </h1>
            <p className="mx-auto max-w-[700px] text-neutral-500 text-base sm:text-lg md:text-xl mb-6 sm:mb-8">
              {t("home.subtitle")}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Link href={`/${locale}/auth/login`} className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto rounded-full px-8 bg-rose-600 hover:bg-rose-700 text-white font-bold text-lg h-12 sm:h-14">
                  {t("home.cta")}
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <div className="w-full bg-neutral-50 py-12 border-t border-neutral-100">
          <div className="container px-4 mx-auto text-center mb-10">
            <h2 className="text-2xl font-bold text-neutral-800">{t("home.exploreCategories")}</h2>
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

  const [forYouImages, { images: followingImages, followingCount }] = await Promise.all([
    getRecommendedImages(session.user.id),
    getFollowingFeed(session.user.id),
  ]);

  return (
    <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 py-6">
      <HomeFeed
        forYouImages={forYouImages as Parameters<typeof HomeFeed>[0]["forYouImages"]}
        followingImages={followingImages as Parameters<typeof HomeFeed>[0]["followingImages"]}
        followingCount={followingCount}
      />
    </div>
  );
}
