import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/images/:id
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    const image = await prisma.image.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        user: { select: { id: true, name: true, username: true, image: true } },
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

    if (!image || !image.isPublished) {
      return NextResponse.json({ success: false, error: "Image not found" }, { status: 404 });
    }

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

    return NextResponse.json({ success: true, data: { ...image, isLiked, isSaved } });
  } catch (error) {
    console.error("GET /api/images/:id error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

const updateImageSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  categoryId: z.string().optional(),
  isPublished: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  tags: z.array(z.string()).max(20).optional(),
});

// PATCH /api/images/:id
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

    const image = await prisma.image.findUnique({ where: { id } });
    if (!image) {
      return NextResponse.json({ success: false, error: "Image not found" }, { status: 404 });
    }

    const isOwner = image.userId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = updateImageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { tags, ...updateData } = parsed.data;

    const updated = await prisma.image.update({
      where: { id },
      data: {
        ...updateData,
        ...(tags !== undefined && {
          tags: {
            deleteMany: {},
            create: await Promise.all(
              tags.map(async (tagName) => {
                const slug = tagName.toLowerCase().replace(/\s+/g, "-");
                const tag = await prisma.tag.upsert({
                  where: { slug },
                  update: {},
                  create: { name: tagName.toLowerCase(), slug },
                });
                return { tagId: tag.id };
              })
            ),
          },
        }),
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        user: { select: { id: true, name: true, username: true, image: true } },
        tags: { include: { tag: true } },
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("PATCH /api/images/:id error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/images/:id
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

    const image = await prisma.image.findUnique({ where: { id } });
    if (!image) {
      return NextResponse.json({ success: false, error: "Image not found" }, { status: 404 });
    }

    const isOwner = image.userId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    await prisma.image.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Image deleted" });
  } catch (error) {
    console.error("DELETE /api/images/:id error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
