import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import BoardDetailClient from "./board-client";

interface PageProps {
  params: Promise<{ id: string; locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;

  try {
    const board = await prisma.board.findUnique({
      where: { id },
      select: {
        name: true,
        description: true,
        user: { select: { name: true, username: true } },
      },
    });

    if (!board) return { title: "Board Not Found — Pinsora" };

    const ownerName = board.user.name ?? board.user.username ?? "User";
    return {
      title: `${board.name} by ${ownerName} — Pinsora`,
      description: board.description ?? `View ${board.name} board by ${ownerName} on Pinsora.`,
      robots: { index: false, follow: false }, // Boards are private/personal
    };
  } catch {
    return { title: "Board — Pinsora" };
  }
}

export default function BoardDetailPage({ params }: PageProps) {
  return <BoardDetailClient params={params} />;
}
