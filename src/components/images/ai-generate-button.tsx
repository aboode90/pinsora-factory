"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface AiGenerateButtonProps {
  imageId: string;
  imageTitle: string;
}

export function AiGenerateButton({ imageId, imageTitle }: AiGenerateButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="secondary"
        className="gap-2 bg-gradient-to-r from-violet-500 to-pink-500 text-white hover:from-violet-600 hover:to-pink-600 border-0 shadow-md"
      >
        <Sparkles className="h-4 w-4" />
        Generate Similar Image
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="h-5 w-5 text-violet-500" />
              AI Image Generation
            </DialogTitle>
          </DialogHeader>

          <div className="mt-2 flex flex-col items-center text-center py-6 gap-5">

            {/* Icon */}
            <div className="relative">
              <div className="h-24 w-24 rounded-3xl bg-white flex items-center justify-center shadow-xl border border-neutral-100 overflow-hidden">
                <Image
                  src="/logo-icon.png"
                  alt="Pinsora Logo"
                  width={64}
                  height={64}
                  className="object-contain"
                />
              </div>
              <div className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-gradient-to-br from-violet-400 to-pink-400 flex items-center justify-center shadow-md">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
            </div>

            {/* Text */}
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-neutral-900">
                Exclusive App Feature
              </h3>
              <p className="text-neutral-500 text-sm leading-relaxed max-w-xs">
                AI image generation is available exclusively on the
                <span className="font-semibold text-neutral-800"> Pinsora mobile app</span>.
                Download the app to generate stunning AI images inspired by any photo.
              </p>
            </div>

            {/* Features list */}
            <div className="w-full rounded-2xl bg-gradient-to-br from-violet-50 to-pink-50 border border-violet-100 p-4 text-left space-y-2">
              {[
                "Unlimited creative variations",
                "Save generated images to your boards",
                "Share AI creations with the community",
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-neutral-700">
                  <div className="h-5 w-5 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center shrink-0">
                    <Sparkles className="h-3 w-3 text-white" />
                  </div>
                  {feature}
                </div>
              ))}
            </div>

            {/* App store buttons */}
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-800 transition-colors">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                App Store
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-800 transition-colors">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3.18 23.76c.3.17.64.22.99.14l12.12-6.99-2.54-2.54-10.57 9.39zM.5 1.77C.18 2.1 0 2.58 0 3.18v17.64c0 .6.18 1.08.5 1.41l.07.07 9.89-9.89v-.23L.57 1.7l-.07.07zM20.37 10.43l-2.72-1.57-2.85 2.85 2.85 2.85 2.74-1.58c.78-.45.78-1.1 0-1.55zM3.18.24L15.3 7.23l-2.54 2.54L2.19.38c.35-.08.69-.03.99.14v-.28z"/>
                </svg>
                Google Play
              </button>
            </div>

            <p className="text-xs text-neutral-400">
              Coming soon — Stay tuned for the Pinsora app launch 🚀
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
