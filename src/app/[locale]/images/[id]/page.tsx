import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ImageActions } from "@/components/images/image-actions";
import { ImageComments } from "@/components/images/image-comments";
import { RelatedImages } from "@/components/images/related-images";
import { UserAvatar } from "@/components/ui/avatar";
import { getImageIdFromParam, formatDate, formatNumber, getImagePath } from "@/lib/utils";
import { Eye, Calendar, Tag } from "lucide-react";

export const dynamic = "force-dynamic";

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://pinsora.com").replace(/\/$/, "");

interface PageProps {
  params: Promise<{ id: string; locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id: rawId, locale } = await params;
  const id = getImageIdFromParam(rawId);

  const image = await prisma.image.findUnique({
    where: { id },
    select: {
      title: true,
      description: true,
      imageUrl: true,
      thumbnailUrl: true,
      category: { select: { name: true, slug: true } },
      user: { select: { name: true, username: true } },
      tags: { include: { tag: { select: { name: true } } } },
    },
  });

  if (!image) return { title: "Image Not Found — Pinsora", robots: { index: false } };

  const canonicalPath = getImagePath({ id, title: image.title });
  const keywords = [
    image.title,
    image.category.name,
    ...image.tags.map((t) => t.tag.name),
    "pinsora",
    "creative images",
  ].filter(Boolean);

  return {
    title: `${image.title} — Pinsora`,
    description: image.description ?? `View ${image.title} on Pinsora. Discover stunning ${image.category.name} images.`,
    keywords,
    alternates: {
      canonical: `${siteUrl}${canonicalPath}`,
      languages: {
        en: `${siteUrl}/en${canonicalPath}`,
        ar: `${siteUrl}/ar${canonicalPath}`,
      },
    },
    openGraph: {
      title: `${image.title} — Pinsora`,
      description: image.description ?? `View ${image.title} on Pinsora`,
      url: `${siteUrl}/${locale}${canonicalPath}`,
      images: [
        {
          url: image.thumbnailUrl ?? image.imageUrl,
          alt: image.title,
        },
      ],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `${image.title} — Pinsora`,
      description: image.description ?? `View ${image.title} on Pinsora`,
      images: [image.thumbnailUrl ?? image.imageUrl],
    },
    robots: { index: true, follow: true },
  };
}

export default async function ImageDetailPage({ params }: PageProps) {
  const { id: rawId } = await params;
  const id = getImageIdFromParam(rawId);

  const session = await auth();

  const image = await prisma.image.findUnique({
    where: { id },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      user: { select: { id: true, name: true, username: true, image: true, bio: true, _count: { select: { followers: true, images: true } } } },
      tags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
      _count: { select: { likes: true, saves: true, comments: true } },
      comments: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          user: { select: { id: true, name: true, username: true, image: true } },
        },
      },
    },
  });

  if (!image || !image.isPublished) notFound();

  // Increment view count (fire and forget)
  prisma.image.update({ where: { id }, data: { viewCount: { increment: 1 } } }).catch(() => {});

  let isLiked = false;
  let isSaved = false;

  if (session?.user?.id) {
    const [like, save] = await Promise.all([
      prisma.like.findUnique({ where: { userId_imageId: { userId: session.user.id, imageId: id } } }),
      prisma.save.findUnique({ where: { userId_imageId: { userId: session.user.id, imageId: id } } }),
    ]);
    isLiked = !!like;
    isSaved = !!save;
  }

  const profileHref = image.user.username
    ? `/profile/${image.user.username}`
    : `/profile/${image.user.id}`;

  const canonicalPath = getImagePath({ id, title: image.title });

  // JSON-LD Structured Data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ImageObject",
    name: image.title,
    description: image.description ?? image.title,
    contentUrl: image.imageUrl,
    thumbnailUrl: image.thumbnailUrl ?? image.imageUrl,
    url: `${siteUrl}${canonicalPath}`,
    datePublished: image.createdAt.toISOString(),
    dateModified: image.updatedAt?.toISOString() ?? image.createdAt.toISOString(),
    author: {
      "@type": "Person",
      name: image.user.name ?? "Anonymous",
      url: image.user.username
        ? `${siteUrl}/en/profile/${image.user.username}`
        : undefined,
    },
    keywords: image.tags.map((t) => t.tag.name).join(", "),
    interactionStatistic: [
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/LikeAction",
        userInteractionCount: image._count.likes,
      },
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/ViewAction",
        userInteractionCount: image.viewCount,
      },
    ],
  };

  return (
    <div className="mx-auto max-w-screen-xl px-3 sm:px-4 md:px-6 py-4 sm:py-8">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 lg:gap-10">
        {/* Image */}
        <div>
          <div className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden bg-neutral-100 shadow-sm">
            <Image
              src={image.imageUrl}
              alt={image.title}
              width={image.width ?? 1200}
              height={image.height ?? 800}
              className="w-full h-auto object-contain"
              priority
              sizes="(max-width: 1024px) 100vw, calc(100vw - 400px)"
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4 sm:space-y-6">
          {/* Title & Category */}
          <div>
            <Link
              href={`/categories/${image.category.slug}`}
              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-rose-500 hover:text-rose-600 mb-2"
            >
              <Tag className="h-3 w-3" />
              {image.category.name}
            </Link>
            <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-900 leading-tight">{image.title}</h1>
            {image.description && (
              <p className="mt-3 text-sm text-neutral-600 leading-relaxed">{image.description}</p>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-xs text-neutral-400">
            <span className="flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5" />
              {formatNumber(image.viewCount)} views
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(image.createdAt)}
            </span>
          </div>

          {/* Actions */}
          <ImageActions
            imageId={image.id}
            imageUrl={image.imageUrl}
            imageTitle={image.title}
            initialLiked={isLiked}
            initialSaved={isSaved}
            likeCount={image._count.likes}
            ownerId={image.user.id}
          />

          {/* Tags */}
          {image.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {image.tags.map(({ tag }) => (
                <Link
                  key={tag.id}
                  href={`/search?q=${encodeURIComponent(tag.name)}`}
                  className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-neutral-100 hover:bg-rose-50 hover:text-rose-600 text-xs font-medium text-neutral-600 transition-colors"
                >
                  #{tag.name}
                </Link>
              ))}
            </div>
          )}

          {/* Author */}
          <div className="p-3 sm:p-4 rounded-2xl border border-neutral-100 bg-neutral-50/50">
            <Link href={profileHref} className="flex items-center gap-3 group">
              <UserAvatar name={image.user.name} image={image.user.image} size="lg" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-neutral-900 group-hover:text-rose-600 transition-colors truncate">
                  {image.user.name ?? "Anonymous"}
                </p>
                {image.user.username && (
                  <p className="text-xs text-neutral-400">@{image.user.username}</p>
                )}
              </div>
            </Link>
            {image.user.bio && (
              <p className="mt-3 text-xs text-neutral-500 leading-relaxed line-clamp-3">
                {image.user.bio}
              </p>
            )}
            <div className="mt-3 flex gap-4 text-xs text-neutral-400">
              <span>
                <strong className="text-neutral-700">{formatNumber(image.user._count.images)}</strong> images
              </span>
              <span>
                <strong className="text-neutral-700">{formatNumber(image.user._count.followers)}</strong> followers
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Comments */}
      <div className="mt-8 sm:mt-12">
        <ImageComments imageId={image.id} initialComments={image.comments} />
      </div>

      {/* Related Images */}
      <div className="mt-10 sm:mt-16">
        <h2 className="text-lg sm:text-xl font-bold text-neutral-900 mb-4 sm:mb-6">More from {image.category.name}</h2>
        <RelatedImages categoryId={image.category.id} excludeId={image.id} />
      </div>
    </div>
  );
}
