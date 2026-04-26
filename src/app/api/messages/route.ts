import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const conversations = await prisma.conversation.findMany({
      where: { participants: { some: { userId: session.user.id } } },
      include: {
        participants: { include: { user: { select: { id: true, name: true, image: true } } } },
        messages: { orderBy: { createdAt: "desc" }, take: 1 }
      },
      orderBy: { updatedAt: "desc" }
    });
    return NextResponse.json({ success: true, data: conversations });
  } catch (error) {
    console.error("GET CONV ERROR:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { recipientId } = await req.json();

    // 1. Try to find existing
    const existing = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId: session.user.id } } },
          { participants: { some: { userId: recipientId } } }
        ]
      },
      include: {
        participants: { include: { user: { select: { id: true, name: true, image: true } } } }
      }
    });

    if (existing) return NextResponse.json({ success: true, data: existing });

    // 2. Create new
    const newConv = await prisma.conversation.create({
      data: {
        participants: {
          create: [{ userId: session.user.id }, { userId: recipientId }]
        }
      },
      include: {
        participants: { include: { user: { select: { id: true, name: true, image: true } } } }
      }
    });

    return NextResponse.json({ success: true, data: newConv });
  } catch (error) {
    console.error("POST CONV ERROR:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
