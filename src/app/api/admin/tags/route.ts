import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tags = await prisma.tag.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { images: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: tags });
  } catch (error) {
    console.error("GET /api/admin/tags error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
