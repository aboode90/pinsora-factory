import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/boards/:id
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    const board = await prisma.board.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, username: true, image: true } },
        _count: { select: { boardImages: true } },
        boardImages: {
          orderBy: { addedAt: "desc" },
          include: {
            image: {
              include: {
                category: { select: { id: true, name: true, slug: true } },
                user: { select: { id: true, name: true, username: true, image: true } },
                tags: { include: { tag: true } },
              },
            },
          },
        },
      },
    });

    if (!board) {
      return NextResponse.json({ success: false, error: "Board not found" }, { status: 404 });
    }

    // Private board — only owner can view
    if (board.isPrivate && board.userId !== session?.user?.id) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: board });
  } catch (error) {
    console.error("GET /api/boards/:id error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

const updateBoardSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  isPrivate: z.boolean().optional(),
});

// PATCH /api/boards/:id
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const board = await prisma.board.findUnique({ where: { id } });
    if (!board || board.userId !== session.user.id) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = updateBoardSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const updated = await prisma.board.update({ where: { id }, data: parsed.data });
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("PATCH /api/boards/:id error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/boards/:id
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const board = await prisma.board.findUnique({ where: { id } });
    if (!board || board.userId !== session.user.id) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    await prisma.board.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Board deleted" });
  } catch (error) {
    console.error("DELETE /api/boards/:id error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
