import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // نرسل الرسالة إلى Pollinations AI
    // أضفنا تعليمات بأن يتصرف كـ Pinsora AI Assistant
    const systemPrompt = "You are Pinsora AI, a helpful and creative assistant for the Pinsora image discovery platform. You help users with image prompts, design ideas, and general questions. Keep your answers concise and friendly.";
    const fullPrompt = encodeURIComponent(`${systemPrompt}\n\nUser: ${message}`);

    const response = await fetch(`https://text.pollinations.ai/${fullPrompt}`);

    if (!response.ok) {
      throw new Error("Failed to fetch from AI");
    }

    const text = await response.text();

    return NextResponse.json({ text });
  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
