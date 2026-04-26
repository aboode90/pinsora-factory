import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { slugify } from "@/lib/utils";

// GET /api/categories/:slug
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const category = await prisma.category.findUnique({
      where: { slug },
      include: {
        _count: { select: { images: true } },
        children: {
          include: { _count: { select: { images: true } } },
          orderBy: { name: "asc" },
        },
        parent: { select: { id: true, name: true, slug: true } },
      },
    });

    if (!category) {
      return NextResponse.json({ success: false, error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: category });
  } catch (error) {
    console.error("GET /api/categories/:slug error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

const updateCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  coverImage: z.string().url().optional(),
  parentId: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
});

// PATCH /api/categories/:slug — admin only
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = updateCategorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, ...rest } = parsed.data;
    const updateData: Record<string, unknown> = { ...rest };
    if (name) {
      updateData.name = name;
      updateData.slug = slugify(name);
    }

    const category = await prisma.category.update({
      where: { slug },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: category });
  } catch (error) {
    console.error("PATCH /api/categories/:slug error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/categories/:slug — admin only
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    await prisma.category.delete({ where: { slug } });

    return NextResponse.json({ success: true, message: "Category deleted" });
  } catch (error) {
    console.error("DELETE /api/categories/:slug error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
