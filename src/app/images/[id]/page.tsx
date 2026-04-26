import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate, formatNumber } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/ui/avatar";
import { AiGenerateButton } from "@/components/images/ai-generate-button";
import { ImageActions } from "@/components/images/image-actions";
import { RelatedImages } from "@/components/images/related-images";
import { ImageComments } from "@/components/images/image-comments";
import { Calendar, Heart, Bookmark } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getImage(id: string) {
  return prisma.image.findUnique({
    where: { id, isPublished: true },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      user: { select: { id: true, name: true, username: true, image: true, bio: true } },
      tags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
      _count: { select: { likes: true, saves: true, comments: true } },
      comments: {
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, username: true, image: true } }
        }
      }
    },
  });
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const image = await getImage(id);
  if (!image) return { title: "Image Not Found" };

  return {
    title: image.title,
    description: image.description ?? `${image.title} — Browse on PixelVault`,
    openGraph: {
      title: image.title,
      description: image.description ?? undefined,
      images: [{ url: image.imageUrl, width: image.width ?? 1200, height: image.height ?? 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: image.title,
      description: image.description ?? undefined,
      images: [image.imageUrl],
    },
  };
}

export default async function ImageDetailPage({ params }: PageProps) {
  const { id } = await params;
  const image = await getImage(id);

  if (!image) notFound();

  const tagNames = image.tags.map((t) => t.tag.name);

  return (
    <div className="mx-auto max-w-screen-xl px-4 sm:px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
        {/* Image */}
        <div>
          <div className="relative rounded-2xl overflow-hidden bg-neutral-100 shadow-sm">
            <Image
              src={image.imageUrl}
              alt={image.title}
              width={image.width ?? 1200}
              height={image.height ?? 800}
              className="w-full h-auto object-contain max-h-[80vh]"
              priority
              sizes="(max-width: 1024px) 100vw, calc(100vw - 420px)"
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Title & Category */}
          <div>
            <Link
              href={`/categories/${image.category.slug}`}
              className="inline-flex items-center mb-3"
            >
              <Badge variant="secondary" className="hover:bg-rose-100 hover:text-rose-700 transition-colors cursor-pointer">
                {image.category.name}
              </Badge>
            </Link>
            <h1 className="text-2xl font-bold text-neutral-900 leading-tight">{image.title}</h1>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-neutral-500">
            <span className="flex items-center gap-1.5">
              <Heart className="h-4 w-4" />
              {formatNumber(image.likeCount)} likes
            </span>
            <span className="flex items-center gap-1.5">
              <Bookmark className="h-4 w-4" />
              {formatNumber(image.saveCount)} saves
            </span>
          </div>

          {/* Actions */}
          <ImageActions
            imageId={image.id}
            imageUrl={image.imageUrl}
            imageTitle={image.title}
            ownerId={image.userId}
          />

          {/* AI Generate */}
          <AiGenerateButton imageId={image.id} imageTitle={image.title} />

          {/* Description */}
          {image.description && (
            <div>
              <h2 className="text-sm font-semibold text-neutral-700 mb-2">Description</h2>
              <p className="text-sm text-neutral-600 leading-relaxed">{image.description}</p>
            </div>
          )}

          {/* Tags */}
          {tagNames.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-neutral-700 mb-2">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {image.tags.map(({ tag }) => (
                  <Link key={tag.id} href={`/search?q=${encodeURIComponent(tag.name)}&type=images`}>
                    <Badge
                      variant="outline"
                      className="cursor-pointer hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 transition-colors"
                    >
                      #{tag.name}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Author */}
          <div className="rounded-2xl border border-neutral-100 p-4">
            <h2 className="text-sm font-semibold text-neutral-700 mb-3">Creator</h2>
            <Link
              href={`/profile/${image.user.username ?? image.user.id}`}
              className="flex items-center gap-3 group"
            >
              <UserAvatar name={image.user.name} image={image.user.image} size="lg" />
              <div>
                <p className="font-semibold text-neutral-900 group-hover:text-rose-500 transition-colors">
                  {image.user.name ?? "Unknown"}
                </p>
                {image.user.username && (
                  <p className="text-sm text-neutral-500">@{image.user.username}</p>
                )}
                {image.user.bio && (
                  <p className="text-xs text-neutral-500 mt-1 line-clamp-2">{image.user.bio}</p>
                )}
              </div>
            </Link>
          </div>

          {/* Date */}
          <div className="flex items-center gap-1.5 text-xs text-neutral-400">
            <Calendar className="h-3.5 w-3.5" />
            Published {formatDate(image.createdAt)}
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <ImageComments imageId={image.id} initialComments={image.comments} />

      {/* Related Images */}
      <div className="mt-12">
        <h2 className="text-xl font-bold text-neutral-900 mb-6">More from {image.category.name}</h2>
        <RelatedImages categoryId={image.category.id} excludeId={image.id} />
      </div>
    </div>
  );
}
