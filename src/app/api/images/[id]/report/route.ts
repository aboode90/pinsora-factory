import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const reportSchema = z.object({
  reason: z.enum(["SPAM", "INAPPROPRIATE", "COPYRIGHT", "OTHER"]),
  details: z.string().max(1000).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = reportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const report = await prisma.report.create({
      data: {
        reason: parsed.data.reason,
        details: parsed.data.details,
        imageId: id,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ success: true, data: report });
  } catch (error) {
    console.error("POST /api/images/:id/report error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
