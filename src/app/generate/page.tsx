import { Metadata } from "next";
import { AiGenerator } from "@/components/generator/ai-generator";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Pinsora AI Generator - Create Magic",
  description: "Generate unique AI images and save them to your profile.",
};

export default async function GeneratePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/login?callbackUrl=/generate");
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black tracking-tight mb-4">
          <span className="text-neutral-900">Pinsora</span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-600"> Magic Lab</span>
        </h1>
        <p className="text-neutral-500 max-w-lg mx-auto">
          حول خيالك إلى حقيقة بلمسة واحدة. جرب مختبرنا لتوليد الصور بالذكاء الاصطناعي مجاناً.
        </p>
      </div>

      <AiGenerator />
    </div>
  );
}
