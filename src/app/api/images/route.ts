import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { slugify } from "@/lib/utils";

const createImageSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  imageUrl: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  categoryId: z.string(),
  tags: z.array(z.string()).max(20).optional(),
  isFeatured: z.boolean().optional(),
});

// GET /api/images — list images with filters
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const pageSize = Math.min(50, parseInt(searchParams.get("pageSize") ?? "20"));
    const categoryId = searchParams.get("categoryId");
    const categorySlug = searchParams.get("category");
    const search = searchParams.get("search");
    const tag = searchParams.get("tag");
    const userId = searchParams.get("userId");
    const featured = searchParams.get("featured") === "true";
    const sortBy = searchParams.get("sortBy") ?? "createdAt";

    const session = await auth();

    const where: Record<string, unknown> = { isPublished: true };

    if (categoryId) where.categoryId = categoryId;
    if (categorySlug) {
      where.category = { slug: categorySlug };
    }
    if (userId) where.userId = userId;
    if (featured) where.isFeatured = true;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { tags: { some: { tag: { name: { contains: search, mode: "insensitive" } } } } },
      ];
    }
    if (tag) {
      where.tags = { some: { tag: { slug: tag } } };
    }

    const orderBy: Record<string, string> = {};
    if (sortBy === "popular") orderBy.likeCount = "desc";
    else if (sortBy === "views") orderBy.viewCount = "desc";
    else orderBy.createdAt = "desc";

    const [images, total] = await Promise.all([
      prisma.image.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          user: { select: { id: true, name: true, username: true, image: true } },
          tags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
          _count: { select: { likes: true, saves: true, comments: true } },
        },
      }),
      prisma.image.count({ where }),
    ]);

    // Check if current user liked/saved each image
    let likedIds = new Set<string>();
    let savedIds = new Set<string>();

    if (session?.user?.id) {
      const imageIds = images.map((img) => img.id);
      const [likes, saves] = await Promise.all([
        prisma.like.findMany({
          where: { userId: session.user.id, imageId: { in: imageIds } },
          select: { imageId: true },
        }),
        prisma.save.findMany({
          where: { userId: session.user.id, imageId: { in: imageIds } },
          select: { imageId: true },
        }),
      ]);
      likedIds = new Set(likes.map((l) => l.imageId));
      savedIds = new Set(saves.map((s) => s.imageId));
    }

    const enriched = images.map((img) => ({
      ...img,
      isLiked: likedIds.has(img.id),
      isSaved: savedIds.has(img.id),
    }));

    return NextResponse.json({
      success: true,
      data: enriched,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      hasMore: page * pageSize < total,
    });
  } catch (error) {
    console.error("GET /api/images error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/images — create image (auth required)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createImageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { tags, ...imageData } = parsed.data;

    const image = await prisma.image.create({
      data: {
        ...imageData,
        userId: session.user.id,
        tags: tags
          ? {
              create: await Promise.all(
                tags.map(async (tagName) => {
                  const slug = slugify(tagName);
                  const tag = await prisma.tag.upsert({
                    where: { slug },
                    update: {},
                    create: { name: tagName.toLowerCase(), slug },
                  });
                  return { tagId: tag.id };
                })
              ),
            }
          : undefined,
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        user: { select: { id: true, name: true, username: true, image: true } },
        tags: { include: { tag: true } },
      },
    });

    return NextResponse.json({ success: true, data: image }, { status: 201 });
  } catch (error) {
    console.error("POST /api/images error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

