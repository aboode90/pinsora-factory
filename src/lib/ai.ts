/**
 * AI Image Generation Service — Leonardo.ai
 */

export interface GenerateImageOptions {
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
}

export interface GenerateImageResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

/**
 * Build a generation prompt from image metadata
 */
export function buildPromptFromImage(
  title: string,
  description: string | null,
  tags: string[]
): string {
  const parts = [title];
  if (description) parts.push(description);
  if (tags.length > 0) parts.push(tags.join(", "));
  return parts.join(". ");
}

/**
 * Main AI image generation function
 */
export async function generateImage(
  options: GenerateImageOptions
): Promise<GenerateImageResult> {
  const provider = process.env.AI_PROVIDER ?? "placeholder";

  switch (provider) {
    case "leonardo":
      return generateWithLeonardo(options);
    case "openai":
      return generateWithOpenAI(options);
    case "stability":
      return generateWithStability(options);
    default:
      // Placeholder for development
      return {
        success: true,
        imageUrl: `https://picsum.photos/seed/${encodeURIComponent(options.prompt)}/800/600`,
      };
  }
}

// ─── Leonardo.ai ──────────────────────────────────────────────────────────────

async function generateWithLeonardo(
  options: GenerateImageOptions
): Promise<GenerateImageResult> {
  try {
    const apiKey = process.env.AI_API_KEY;
    if (!apiKey) return { success: false, error: "Leonardo API key not configured" };

    // Step 1: Create generation
    const createRes = await fetch("https://cloud.leonardo.ai/api/rest/v1/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        prompt: options.prompt,
        negative_prompt: options.negativePrompt ?? "blurry, low quality, distorted",
        modelId: "1dd50843-d653-4516-a8e3-f0238ee453ff", // FLUX Schnell
        width: options.width ?? 1024,
        height: options.height ?? 768,
        num_images: 1,
        guidance_scale: 3.5,
        num_inference_steps: 4,
        public: false,
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.json();
      return { success: false, error: err.error ?? "Leonardo API error" };
    }

    const createData = await createRes.json();
    const generationId = createData.sdGenerationJob?.generationId;

    if (!generationId) {
      return { success: false, error: "No generation ID returned" };
    }

    // Step 2: Poll for result (max 60 seconds)
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 3000));

      const pollRes = await fetch(
        `https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`,
        {
          headers: { Authorization: `Bearer ${apiKey}` },
        }
      );

      if (!pollRes.ok) continue;

      const pollData = await pollRes.json();
      const generation = pollData.generations_by_pk;

      if (generation?.status === "COMPLETE") {
        const imageUrl = generation.generated_images?.[0]?.url;
        if (imageUrl) {
          return { success: true, imageUrl };
        }
        return { success: false, error: "No image in response" };
      }

      if (generation?.status === "FAILED") {
        return { success: false, error: "Generation failed" };
      }
    }

    return { success: false, error: "Generation timed out" };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

// ─── OpenAI DALL-E ────────────────────────────────────────────────────────────

async function generateWithOpenAI(
  options: GenerateImageOptions
): Promise<GenerateImageResult> {
  try {
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: options.prompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.error?.message ?? "OpenAI API error" };
    }

    const data = await response.json();
    return { success: true, imageUrl: data.data[0].url };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

// ─── Stability AI ─────────────────────────────────────────────────────────────

async function generateWithStability(
  options: GenerateImageOptions
): Promise<GenerateImageResult> {
  try {
    const response = await fetch(
      "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${process.env.AI_API_KEY}`,
        },
        body: JSON.stringify({
          text_prompts: [{ text: options.prompt, weight: 1 }],
          cfg_scale: 7,
          height: options.height ?? 1024,
          width: options.width ?? 1024,
          samples: 1,
          steps: 30,
        }),
      }
    );

    if (!response.ok) {
      return { success: false, error: "Stability AI error" };
    }

    const data = await response.json();
    const base64 = data.artifacts[0].base64;
    return { success: true, imageUrl: `data:image/png;base64,${base64}` };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
