import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// POST /api/images/:id/like — toggle like
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const existing = await prisma.like.findUnique({
      where: { userId_imageId: { userId, imageId: id } },
    });

    if (existing) {
      // Unlike
      await prisma.$transaction([
        prisma.like.delete({ where: { userId_imageId: { userId, imageId: id } } }),
        prisma.image.update({ where: { id }, data: { likeCount: { decrement: 1 } } }),
      ]);
      return NextResponse.json({ success: true, liked: false });
    } else {
      // Like
      const [like, image] = await prisma.$transaction([
        prisma.like.create({ data: { userId, imageId: id } }),
        prisma.image.update({ where: { id }, data: { likeCount: { increment: 1 } }, select: { userId: true } }),
      ]);

      // Create notification
      if (image.userId !== userId) {
        await prisma.notification.create({
          data: {
            type: "LIKE",
            recipientId: image.userId,
            actorId: userId,
            resourceId: id,
          },
        });
      }

      return NextResponse.json({ success: true, liked: true });
    }
  } catch (error) {
    console.error("POST /api/images/:id/like error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
