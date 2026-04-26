import { NextRequest, NextResponse } from "next/server";

// GET /api/download?url=...&filename=...
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const imageUrl = searchParams.get("url");
    const filename = searchParams.get("filename") ?? "image.jpg";

    if (!imageUrl) {
      return NextResponse.json({ error: "URL required" }, { status: 400 });
    }

    // Fetch the image server-side
    const response = await fetch(imageUrl);

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch image" }, { status: 400 });
    }

    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") ?? "image/jpeg";

    // Return with download headers
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}.jpg"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Download failed" }, { status: 500 });
  }
}
