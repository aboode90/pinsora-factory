import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const commentSchema = z.object({
  content: z.string().min(1).max(1000),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: imageId } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = commentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    const comment = await prisma.comment.create({
      data: {
        content: parsed.data.content,
        imageId,
        userId: session.user.id,
      },
      include: {
        user: { select: { id: true, name: true, username: true, image: true } },
      },
    });

    // Create notification for image owner
    const image = await prisma.image.findUnique({ where: { id: imageId }, select: { userId: true } });
    if (image && image.userId !== session.user.id) {
      await prisma.notification.create({
        data: {
          type: "COMMENT",
          recipientId: image.userId,
          actorId: session.user.id,
          resourceId: imageId,
        },
      });
    }

    return NextResponse.json({ success: true, data: comment });
  } catch (error) {
    console.error("Comment error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
