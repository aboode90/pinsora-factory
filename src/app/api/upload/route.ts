import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getUploadPresignedUrl, generateImageKey } from "@/lib/r2";

const uploadSchema = z.object({
  filename: z.string().min(1),
  contentType: z.string().regex(/^image\/(jpeg|jpg|png|webp|gif|avif)$/),
  size: z.number().max(10 * 1024 * 1024), // 10MB max
});

// POST /api/upload — get a presigned URL for direct R2 upload
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = uploadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { filename, contentType } = parsed.data;
    const key = generateImageKey(session.user.id, filename);
    const presignedUrl = await getUploadPresignedUrl(key, contentType);
    const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

    return NextResponse.json({
      success: true,
      data: { presignedUrl, key, publicUrl },
    });
  } catch (error) {
    console.error("POST /api/upload error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

