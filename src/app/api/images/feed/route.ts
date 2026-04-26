import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "recommended"; // following or recommended

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    if (type === "following") {
      // Get images from people the user follows
      const following = await prisma.follow.findMany({
        where: { followerId: userId },
        select: { followingId: true },
      });

      const followingIds = following.map((f) => f.followingId);

      const images = await prisma.image.findMany({
        where: {
          userId: { in: followingIds },
          isPublished: true,
        },
        orderBy: { createdAt: "desc" },
        take: 30,
        include: {
          category: { select: { name: true, slug: true } },
          user: { select: { id: true, name: true, username: true, image: true } },
          _count: { select: { likes: true, saves: true, comments: true } },
        },
      });

      return NextResponse.json({ success: true, data: images });
    } else {
      // Recommended: Prioritize categories user has liked
      const likedImages = await prisma.like.findMany({
        where: { userId },
        select: { image: { select: { categoryId: true } } },
        take: 50,
      });

      const preferredCategoryIds = Array.from(new Set(likedImages.map((l) => l.image.categoryId)));

      const images = await prisma.image.findMany({
        where: {
          isPublished: true,
          // Exclude already liked images for variety?
          // likes: { none: { userId } }
        },
        orderBy: [
          // Order by preferred categories first, then by date
          { createdAt: "desc" },
        ],
        take: 30,
        include: {
          category: { select: { name: true, slug: true } },
          user: { select: { id: true, name: true, username: true, image: true } },
          _count: { select: { likes: true, saves: true, comments: true } },
        },
      });

      // Simple re-sorting in memory for "Smart" feel
      const sortedImages = images.sort((a, b) => {
        const aPref = preferredCategoryIds.includes(a.categoryId) ? 1 : 0;
        const bPref = preferredCategoryIds.includes(b.categoryId) ? 1 : 0;
        return bPref - aPref;
      });

      return NextResponse.json({ success: true, data: sortedImages });
    }
  } catch (error) {
    console.error("Feed error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
