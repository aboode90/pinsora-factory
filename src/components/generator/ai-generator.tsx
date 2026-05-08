"use client";

import React, { useState } from "react";
import { Sparkles, Download, Save, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { toast } from "sonner";

export function AiGenerator() {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      const res = await fetch("/api/generate/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();
      if (data.imageUrl) {
        setGeneratedImage(data.imageUrl);
        toast.success("Image generated successfully!");
      } else {
        toast.error(data.error || "Failed to generate image");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToProfile = async () => {
    if (!generatedImage || isSaving) return;
    setIsSaving(true);

    try {
      const res = await fetch("/api/generate/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: generatedImage, prompt }),
      });

      if (res.ok) {
        toast.success("Saved to your profile!");
      } else {
        toast.error("Failed to save image");
      }
    } catch (error) {
      toast.error("Error saving image");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Warning Alert */}
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex gap-3 text-amber-800">
        <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-bold mb-1">تنبيه بخصوص الخدمة المجانية</p>
          <p>بما أن هذه الخدمة مقدمة مجاناً، فقد لا تحصل على نتائج احترافية جداً أو دقيقة تماماً وفق المطلوب في كل مرة. الجودة تعتمد على ضغط السيرفر وبساطة الوصف.</p>
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-xl space-y-4">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="صف ما تريد تخيله... (مثال: قطة رائدة فضاء في المريخ)"
          className="w-full h-32 p-4 rounded-2xl bg-neutral-100 border-none focus:ring-2 focus:ring-violet-500 transition-all resize-none text-sm"
        />
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
          className="w-full h-12 bg-gradient-to-r from-pink-500 to-violet-600 hover:from-pink-600 hover:to-violet-700 text-white rounded-xl gap-2 text-md font-bold"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              جاري السحر...
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5" />
              توليد الصورة
            </>
          )}
        </Button>
      </div>

      {/* Result Area */}
      {generatedImage && (
        <div className="space-y-4 animate-in fade-in zoom-in duration-500">
          <div className="relative aspect-[3/4] rounded-3xl overflow-hidden border-4 border-white shadow-2xl">
            <img
              src={generatedImage}
              alt="Generated"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => window.open(generatedImage, "_blank")}
              className="rounded-xl h-12 gap-2"
            >
              <Download className="h-4 w-4" />
              تحميل الصورة
            </Button>
            <Button
              onClick={handleSaveToProfile}
              disabled={isSaving}
              className="rounded-xl h-12 gap-2 bg-neutral-900 text-white hover:bg-neutral-800"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              حفظ في الملف الشخصي
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
