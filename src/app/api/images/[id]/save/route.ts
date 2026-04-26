import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const saveSchema = z.object({
  boardId: z.string().optional(),
});

// POST /api/images/:id/save — toggle save (optionally to a board)
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
    const body = await req.json().catch(() => ({}));
    const { boardId } = saveSchema.parse(body);

    const existing = await prisma.save.findUnique({
      where: { userId_imageId: { userId, imageId: id } },
    });

    if (existing) {
      // Unsave
      await prisma.$transaction([
        prisma.save.delete({ where: { userId_imageId: { userId, imageId: id } } }),
        prisma.image.update({ where: { id }, data: { saveCount: { decrement: 1 } } }),
      ]);

      // Also remove from board if specified
      if (boardId) {
        await prisma.boardImage
          .delete({ where: { boardId_imageId: { boardId, imageId: id } } })
          .catch(() => {});
      }

      return NextResponse.json({ success: true, saved: false });
    } else {
      // Save
      const [save, image] = await prisma.$transaction([
        prisma.save.create({ data: { userId, imageId: id } }),
        prisma.image.update({ where: { id }, data: { saveCount: { increment: 1 } }, select: { userId: true } }),
      ]);

      // Create notification
      if (image.userId !== userId) {
        await prisma.notification.create({
          data: {
            type: "SAVE",
            recipientId: image.userId,
            actorId: userId,
            resourceId: id,
          },
        });
      }

      // Add to board if specified
      if (boardId) {
        // Verify board belongs to user
        const board = await prisma.board.findFirst({ where: { id: boardId, userId } });
        if (board) {
          await prisma.boardImage
            .upsert({
              where: { boardId_imageId: { boardId, imageId: id } },
              update: {},
              create: { boardId, imageId: id },
            })
            .catch(() => {});
        }
      }

      return NextResponse.json({ success: true, saved: true });
    }
  } catch (error) {
    console.error("POST /api/images/:id/save error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
