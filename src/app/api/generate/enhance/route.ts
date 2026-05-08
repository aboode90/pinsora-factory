import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // نطلب من الذكاء الاصطناعي تحسين الوصف ليكون سينمائياً واحترافياً
    const systemInstruction = "You are a professional AI prompt engineer. Enhance the following user prompt to be more detailed, cinematic, and professional for an image generator. Keep the core idea but add details about lighting, camera lens, and style. ONLY output the enhanced prompt text, no other talking.";
    const fullPrompt = encodeURIComponent(`${systemInstruction}\n\nUser Prompt: ${prompt}`);

    const response = await fetch(`https://text.pollinations.ai/${fullPrompt}`);

    if (!response.ok) throw new Error("Failed to enhance prompt");

    const enhancedText = await response.text();

    return NextResponse.json({ enhancedText });
  } catch (error) {
    console.error("Enhance API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
