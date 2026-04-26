import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [userCount, imageCount, reportCount] = await Promise.all([
      prisma.user.count(),
      prisma.image.count(),
      prisma.report.count({ where: { status: "PENDING" } }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        userCount,
        imageCount,
        reportCount,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
