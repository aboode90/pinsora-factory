import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/boards — get current user's boards
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") ?? session.user.id;
    const isOwner = userId === session.user.id;

    const boards = await prisma.board.findMany({
      where: {
        userId,
        ...(isOwner ? {} : { isPrivate: false }),
      },
      orderBy: { updatedAt: "desc" },
      include: {
        _count: { select: { boardImages: true } },
        boardImages: {
          take: 3,
          orderBy: { addedAt: "desc" },
          include: {
            image: { select: { id: true, imageUrl: true, thumbnailUrl: true, title: true } },
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: boards });
  } catch (error) {
    console.error("GET /api/boards error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

const createBoardSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  isPrivate: z.boolean().optional(),
});

// POST /api/boards
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createBoardSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const board = await prisma.board.create({
      data: { ...parsed.data, userId: session.user.id },
    });

    return NextResponse.json({ success: true, data: board }, { status: 201 });
  } catch (error) {
    console.error("POST /api/boards error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

