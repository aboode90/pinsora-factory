import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/search?q=keyword&type=images|categories|tags
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();
    const type = searchParams.get("type") ?? "images";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const pageSize = Math.min(50, parseInt(searchParams.get("pageSize") ?? "20"));

    if (!q || q.length < 2) {
      return NextResponse.json({ success: false, error: "Query too short" }, { status: 400 });
    }

    if (type === "images") {
      const where = {
        isPublished: true,
        OR: [
          { title: { contains: q, mode: "insensitive" as const } },
          { description: { contains: q, mode: "insensitive" as const } },
          { tags: { some: { tag: { name: { contains: q, mode: "insensitive" as const } } } } },
          { category: { name: { contains: q, mode: "insensitive" as const } } },
        ],
      };

      const [images, total] = await Promise.all([
        prisma.image.findMany({
          where,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: { viewCount: "desc" },
          include: {
            category: { select: { id: true, name: true, slug: true } },
            user: { select: { id: true, name: true, username: true, image: true } },
            tags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
          },
        }),
        prisma.image.count({ where }),
      ]);

      return NextResponse.json({
        success: true,
        data: images,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
        hasMore: page * pageSize < total,
      });
    }

    if (type === "categories") {
      const categories = await prisma.category.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        },
        include: { _count: { select: { images: true } } },
        take: 10,
      });
      return NextResponse.json({ success: true, data: categories });
    }

    if (type === "tags") {
      const tags = await prisma.tag.findMany({
        where: { name: { contains: q, mode: "insensitive" } },
        include: { _count: { select: { images: true } } },
        take: 20,
        orderBy: { images: { _count: "desc" } },
      });
      return NextResponse.json({ success: true, data: tags });
    }

    return NextResponse.json({ success: false, error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error("GET /api/search error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
