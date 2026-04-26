import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { generateImage, buildPromptFromImage } from "@/lib/ai";

// POST /api/images/:id/generate — generate a similar image using AI
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    // Find the source image
    const image = await prisma.image.findUnique({
      where: { id },
      include: {
        tags: { include: { tag: true } },
      },
    });

    if (!image) {
      return NextResponse.json({ success: false, error: "Image not found" }, { status: 404 });
    }

    const tagNames = image.tags.map((t) => t.tag.name);
    const prompt = buildPromptFromImage(image.title, image.description, tagNames);

    // Log the generation attempt
    const log = await prisma.aiGenerationLog.create({
      data: {
        prompt,
        sourceImageId: id,
        userId: session?.user?.id,
        status: "PROCESSING",
      },
    });

    // Generate the image
    const result = await generateImage({ prompt });

    // Update log with result
    await prisma.aiGenerationLog.update({
      where: { id: log.id },
      data: {
        status: result.success ? "COMPLETED" : "FAILED",
        resultUrl: result.imageUrl,
        errorMessage: result.error,
      },
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error ?? "Generation failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        imageUrl: result.imageUrl,
        prompt,
        logId: log.id,
      },
    });
  } catch (error) {
    console.error("POST /api/images/:id/generate error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
