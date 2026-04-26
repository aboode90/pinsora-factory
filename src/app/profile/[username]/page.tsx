import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { UserAvatar } from "@/components/ui/avatar";
import { MasonryGrid } from "@/components/images/masonry-grid";
import { FollowButton } from "@/components/user/follow-button";
import { formatDate } from "@/lib/utils";
import { Grid, Calendar, MessageCircle, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface PageProps {
  params: Promise<{ username: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { username: username },
        { id: username }
      ]
    },
  });
  if (!user) return { title: "User Not Found" };
  return {
    title: `${user.name || "User"} (@${user.username}) — Pinsora`,
    description: user.bio || `View ${user.name}'s images on Pinsora`,
  };
}

export default async function UserProfilePage({ params }: PageProps) {
  const { username } = await params;
  const session = await auth();

  // Find user by username or ID
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { username: username },
        { id: username }
      ]
    },
    include: {
      _count: {
        select: {
          images: true,
          boards: true,
          followers: true
        }
      },
    },
  });

  if (!user) {
    notFound();
  }

  // Check if current user is following this profile
  let isFollowing = false;
  if (session?.user?.id) {
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: user.id,
        },
      },
    });
    isFollowing = !!follow;
  }

  // Get user's images
  const images = await prisma.image.findMany({
    where: {
      userId: user.id,
      isPublished: true
    },
    orderBy: { createdAt: "desc" },
    take: 40,
    include: {
      category: { select: { id: true, name: true, slug: true } },
      user: { select: { id: true, name: true, username: true, image: true } },
      tags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
      _count: { select: { likes: true, saves: true, comments: true } },
    },
  });

  return (
    <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 py-8">
      {/* Profile Header */}
      <div className="flex flex-col items-center text-center mb-10 pb-8 border-b border-neutral-100">
        <div className="mb-4">
          <UserAvatar
            name={user.name}
            image={user.image}
            size="lg"
            className="h-24 w-24 text-3xl"
          />
        </div>

        <h1 className="text-3xl font-bold text-neutral-900">{user.name || "User"}</h1>
        {user.username && (
          <p className="text-neutral-500 text-sm mt-1">@{user.username}</p>
        )}

        {/* Actions */}
        <div className="mt-6 flex items-center justify-center gap-3 h-11">
          <FollowButton
            userId={user.id}
            initialFollowed={isFollowing}
            followerCount={user._count.followers}
          />
          {session?.user?.id && session.user.id !== user.id && (
            <Link href={`/messages?userId=${user.id}`}>
              <Button variant="outline" className="rounded-full px-8 font-bold gap-2 h-11">
                <MessageCircle className="h-4 w-4" />
                Message
              </Button>
            </Link>
          )}
        </div>

        {user.bio && (
          <p className="text-neutral-600 text-sm mt-6 max-w-md leading-relaxed">
            {user.bio}
          </p>
        )}

        <div className="flex items-center justify-center gap-6 mt-6 text-sm text-neutral-500">
          <span className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            <span className="font-bold text-neutral-900">{user._count.followers}</span> followers
          </span>
          <span className="flex items-center gap-1.5">
            <Grid className="h-4 w-4" />
            <span className="font-bold text-neutral-900">{user._count.images}</span> images
          </span>
          <span className="flex items-center gap-1.5 hidden sm:flex">
            <Calendar className="h-4 w-4" />
            Joined {formatDate(user.createdAt)}
          </span>
        </div>
      </div>

      {/* Content Grid */}
      {images.length > 0 ? (
        <MasonryGrid images={images as any} />
      ) : (
        <div className="text-center py-20 bg-neutral-50 rounded-3xl border border-dashed border-neutral-200">
          <p className="text-neutral-400">No images posted yet.</p>
        </div>
      )}
    </div>
  );
}
