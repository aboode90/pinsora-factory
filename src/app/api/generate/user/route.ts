import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { prompt } = await req.json();
    if (!prompt) return NextResponse.json({ error: "Prompt is required" }, { status: 400 });

    const LEONARDO_API_KEY = process.env.LEONARDO_API_KEY;
    const MODEL_ID = "1dd50843-d653-4516-a8e3-f0238ee453ff"; // FLUX Schnell

    // 1. طلب التوليد من Leonardo
    const res = await fetch("https://cloud.leonardo.ai/api/rest/v1/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LEONARDO_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: prompt + ", cinematic lighting, highly detailed",
        modelId: MODEL_ID,
        width: 768,
        height: 1024,
        num_images: 1,
      }),
    });

    const data = await res.json();
    const generationId = data.sdGenerationJob?.generationId;

    if (!generationId) {
      return NextResponse.json({ error: "Failed to start generation" }, { status: 500 });
    }

    // 2. الانتظار للحصول على النتيجة (Simple Poll)
    let imageUrl = null;
    for (let i = 0; i < 10; i++) {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      const statusRes = await fetch(`https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`, {
        headers: { "Authorization": `Bearer ${LEONARDO_API_KEY}` },
      });
      const statusData = await statusRes.json();
      const img = statusData.generations_by_pk?.generated_images?.[0]?.url;
      if (img) {
        imageUrl = img;
        break;
      }
    }

    if (!imageUrl) {
      return NextResponse.json({ error: "Generation timed out" }, { status: 500 });
    }

    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error("User Generation Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
