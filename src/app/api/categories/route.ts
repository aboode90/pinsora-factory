import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { slugify } from "@/lib/utils";

// GET /api/categories
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const withChildren = searchParams.get("withChildren") === "true";
    const parentOnly = searchParams.get("parentOnly") === "true";

    const where = parentOnly ? { parentId: null } : {};

    const categories = await prisma.category.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        _count: { select: { images: true } },
        ...(withChildren && {
          children: {
            include: { _count: { select: { images: true } } },
            orderBy: { name: "asc" },
          },
        }),
      },
    });

    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    console.error("GET /api/categories error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  coverImage: z.string().url().optional(),
  parentId: z.string().optional(),
  sortOrder: z.number().int().optional(),
});

// POST /api/categories — admin only
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = createCategorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, ...rest } = parsed.data;
    const slug = slugify(name);

    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "Category with this name already exists" },
        { status: 409 }
      );
    }

    const category = await prisma.category.create({
      data: { name, slug, ...rest },
    });

    return NextResponse.json({ success: true, data: category }, { status: 201 });
  } catch (error) {
    console.error("POST /api/categories error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

