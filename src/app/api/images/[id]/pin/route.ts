import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const image = await prisma.image.findUnique({
      where: { id },
      include: { category: true }
    });

    if (!image) {
      return NextResponse.json({ success: false, error: "Image not found" }, { status: 404 });
    }

    const accessToken = process.env.PINTEREST_ACCESS_TOKEN;
    const boardId = process.env.PINTEREST_BOARD_ID;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.pinsora.com";

    if (!accessToken || !boardId) {
      return NextResponse.json({ success: false, error: "Pinterest configuration missing" }, { status: 500 });
    }

    const res = await fetch("https://api.pinterest.com/v5/pins", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: image.title,
        description: image.description || `Beautiful ${image.category.name} inspiration from Pinsora`,
        link: `${appUrl}/images/${image.id}`,
        media_source: {
          source_type: "image_url",
          url: image.imageUrl,
        },
        board_id: boardId,
      }),
    });

    const data = await res.json();

    if (res.ok) {
      return NextResponse.json({ success: true, url: `https://www.pinterest.com/pin/${data.id}` });
    } else {
      console.error("Pinterest API error:", data);
      return NextResponse.json({
        success: false,
        error: data.message || "Failed to pin",
        details: data
      }, { status: res.status });
    }
  } catch (error) {
    console.error("POST /api/images/[id]/pin error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
