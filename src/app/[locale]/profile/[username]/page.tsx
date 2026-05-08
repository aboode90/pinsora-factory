import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { MasonryGrid } from "@/components/images/masonry-grid";
import { UserAvatar } from "@/components/ui/avatar";
import { FollowButton } from "@/components/user/follow-button";
import { formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://pinsora.com").replace(/\/$/, "");

interface PageProps {
  params: Promise<{ username: string; locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username, locale } = await params;

  const user = await prisma.user.findFirst({
    where: { OR: [{ username }, { id: username }] },
    select: { name: true, bio: true, image: true, username: true },
  });

  if (!user) return { title: "User Not Found — Pinsora", robots: { index: false } };

  const displayName = user.name ?? username;
  const profileSlug = user.username ?? username;

  return {
    title: `${displayName} — Pinsora`,
    description: user.bio ?? `View ${displayName}'s images on Pinsora.`,
    alternates: {
      canonical: `${siteUrl}/${locale}/profile/${profileSlug}`,
      languages: {
        en: `${siteUrl}/en/profile/${profileSlug}`,
        ar: `${siteUrl}/ar/profile/${profileSlug}`,
      },
    },
    openGraph: {
      title: `${displayName} — Pinsora`,
      description: user.bio ?? `View ${displayName}'s images on Pinsora.`,
      url: `${siteUrl}/${locale}/profile/${profileSlug}`,
      images: user.image ? [{ url: user.image }] : [],
    },
    robots: { index: true, follow: true },
  };
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { username } = await params;
  const session = await auth();

  const user = await prisma.user.findFirst({
    where: { OR: [{ username }, { id: username }] },
    select: {
      id: true,
      name: true,
      username: true,
      bio: true,
      image: true,
      createdAt: true,
      _count: {
        select: { images: true, followers: true, following: true },
      },
    },
  });

  if (!user) notFound();

  const [images, isFollowing] = await Promise.all([
    prisma.image.findMany({
      where: { userId: user.id, isPublished: true },
      orderBy: { createdAt: "desc" },
      take: 40,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        user: { select: { id: true, name: true, username: true, image: true } },
        tags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
        _count: { select: { likes: true, saves: true, comments: true } },
      },
    }),
    session?.user?.id
      ? prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: session.user.id,
              followingId: user.id,
            },
          },
        })
      : null,
  ]);

  return (
    <div className="mx-auto max-w-screen-xl px-4 sm:px-6 py-10">
      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-10">
        <UserAvatar name={user.name} image={user.image} size="lg" className="h-20 w-20 text-2xl" />
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-extrabold text-neutral-900 mb-1">
            {user.name ?? "Anonymous"}
          </h1>
          {user.username && (
            <p className="text-sm text-neutral-400 mb-2">@{user.username}</p>
          )}
          {user.bio && (
            <p className="text-sm text-neutral-600 leading-relaxed mb-3 max-w-lg">{user.bio}</p>
          )}
          <div className="flex gap-6 text-sm">
            <div>
              <span className="font-bold text-neutral-900">{formatNumber(user._count.images)}</span>
              <span className="text-neutral-400 ml-1">images</span>
            </div>
            <div>
              <span className="font-bold text-neutral-900">{formatNumber(user._count.followers)}</span>
              <span className="text-neutral-400 ml-1">followers</span>
            </div>
            <div>
              <span className="font-bold text-neutral-900">{formatNumber(user._count.following)}</span>
              <span className="text-neutral-400 ml-1">following</span>
            </div>
          </div>
        </div>
        {session?.user?.id !== user.id && (
          <FollowButton
            userId={user.id}
            initialFollowed={!!isFollowing}
            followerCount={user._count.followers}
          />
        )}
      </div>

      {/* Images */}
      {images.length === 0 ? (
        <div className="text-center py-24">
          <div className="text-5xl mb-4">🖼️</div>
          <p className="text-neutral-500">No images uploaded yet.</p>
        </div>
      ) : (
        <MasonryGrid images={images as Parameters<typeof MasonryGrid>[0]["images"]} />
      )}
    </div>
  );
}
