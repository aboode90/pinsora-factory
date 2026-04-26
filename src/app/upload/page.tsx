"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import { Upload, X, ImagePlus, Tag, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";

const uploadSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional(),
  categoryId: z.string().min(1, "Category is required"),
});

type UploadForm = z.infer<typeof uploadSchema>;

export default function UploadPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const checkNSFW = async (file: File): Promise<boolean> => {
    try {
      setIsScanning(true);
      setError(null);

      // Load dependencies dynamically
      const [tf, nsfwjs] = await Promise.all([
        import("@tensorflow/tfjs"),
        import("nsfwjs")
      ]);

      await tf.ready();

      // Create a hidden image element to analyze
      const img = document.createElement("img");
      const url = URL.createObjectURL(file);
      img.src = url;

      return new Promise((resolve) => {
        img.onload = async () => {
          try {
            const model = await nsfwjs.load();
            const predictions = await model.classify(img);
            URL.revokeObjectURL(url);

            // Look for high probability of Porn or Sexy
            const nsfwScore = predictions.find(p => p.className === "Porn" || p.className === "Sexy");
            const isInappropriate = nsfwScore && nsfwScore.probability > 0.6;

            resolve(!!isInappropriate);
          } catch (err) {
            console.error("NSFW check failed:", err);
            resolve(false); // If check fails, we proceed but log it
          }
        };
      });
    } catch (err) {
      console.error("Failed to load NSFW detector:", err);
      return false;
    } finally {
      setIsScanning(false);
    }
  };

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      const data = await res.json();
      return data.data;
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UploadForm>({ resolver: zodResolver(uploadSchema) });

  if (status === "unauthenticated") {
    router.push("/auth/login?callbackUrl=/upload");
    return null;
  }

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB");
      return;
    }

    setSelectedFile(file);
    setError(null);
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
  };

  // Handle drag and drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }
    setSelectedFile(file);
    setError(null);
    setPreview(URL.createObjectURL(file));
  }, []);

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const addTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed) && tags.length < 20) {
      setTags([...tags, trimmed]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => setTags(tags.filter((t) => t !== tag));

  const onSubmit = async (data: UploadForm) => {
    setError(null);

    if (selectedFile) {
      // Step 0: Check for inappropriate content
      const isInappropriate = await checkNSFW(selectedFile);
      if (isInappropriate) {
        setError("This image contains inappropriate content (nudity or sexual material) and cannot be uploaded. Please respect our community guidelines.");
        return;
      }
    }

    setUploading(true);

    try {
      let imageUrl = "";

      if (selectedFile) {
        // Step 1: Get presigned URL from our API
        setUploadProgress(20);
        const presignRes = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: selectedFile.name,
            contentType: selectedFile.type,
            size: selectedFile.size,
          }),
        });

        const presignData = await presignRes.json();
        if (!presignData.success) {
          setError(presignData.error ?? "Failed to get upload URL");
          return;
        }

        // Step 2: Upload directly to R2
        setUploadProgress(50);
        const uploadRes = await fetch(presignData.data.presignedUrl, {
          method: "PUT",
          body: selectedFile,
          headers: { "Content-Type": selectedFile.type },
        });

        if (!uploadRes.ok) {
          setError("Failed to upload image to storage");
          return;
        }

        setUploadProgress(80);
        imageUrl = presignData.data.publicUrl;

      } else {
        setError("Please select an image file");
        return;
      }

      // Step 3: Save to database
      setUploadProgress(90);
      const res = await fetch("/api/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          imageUrl,
          tags,
        }),
      });

      const result = await res.json();
      if (!result.success) {
        setError(result.error ?? "Failed to save image");
        return;
      }

      setUploadProgress(100);
      router.push(`/images/${result.data.id}`);

    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900 mb-1">Upload Image</h1>
        <p className="text-sm text-neutral-500">Share your creative work with the community.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* File Upload */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="rounded-2xl border-2 border-dashed border-neutral-200 hover:border-rose-300 transition-colors bg-neutral-50 hover:bg-rose-50/30"
        >
          {preview ? (
              <div className="relative">
                <Image
                  src={preview}
                  alt="Preview"
                  width={800}
                  height={500}
                  className="w-full h-auto max-h-80 object-contain rounded-2xl"
                />
                <button
                  type="button"
                  onClick={() => { setPreview(null); setSelectedFile(null); }}
                  className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="p-3 text-center">
                  <p className="text-sm text-neutral-600 font-medium">{selectedFile?.name}</p>
                  <p className="text-xs text-neutral-400">
                    {selectedFile ? (selectedFile.size / 1024 / 1024).toFixed(2) + " MB" : ""}
                  </p>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center py-16 cursor-pointer">
                <div className="h-16 w-16 rounded-2xl bg-rose-100 flex items-center justify-center mb-4">
                  <ImagePlus className="h-8 w-8 text-rose-500" />
                </div>
                <p className="text-sm font-semibold text-neutral-700 mb-1">
                  Drop your image here or click to browse
                </p>
                <p className="text-xs text-neutral-400">PNG, JPG, WebP, GIF up to 10MB</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
          )}
        </div>

        {/* Upload Progress */}
        {isScanning && (
          <div className="flex items-center gap-2 p-4 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 text-sm animate-pulse">
            <Sparkles className="h-4 w-4" />
            AI is scanning your image for safety...
          </div>
        )}

        {uploading && uploadProgress > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-neutral-500">
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-rose-500 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Title */}
        <Input
          label="Title"
          placeholder="Give your image a descriptive title"
          error={errors.title?.message}
          {...register("title")}
        />

        {/* Description */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">
            Description <span className="text-neutral-400 font-normal">(optional)</span>
          </label>
          <textarea
            placeholder="Describe your image..."
            rows={4}
            className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none"
            {...register("description")}
          />
        </div>

        {/* Category */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">Category</label>
          <select
            className="w-full h-10 rounded-xl border border-neutral-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            {...register("categoryId")}
          >
            <option value="">Select a category...</option>
            {categoriesData?.map((cat: { id: string; name: string }) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          {errors.categoryId && (
            <p className="mt-1 text-xs text-red-500">{errors.categoryId.message}</p>
          )}
        </div>

        {/* Tags */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">
            Tags <span className="text-neutral-400 font-normal">(up to 20)</span>
          </label>
          <div className="flex gap-2 mb-2">
            <div className="relative flex-1">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder="Add a tag and press Enter"
                className="w-full h-10 pl-10 pr-3 rounded-xl border border-neutral-200 bg-white text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              />
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addTag}>Add</Button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-medium"
                >
                  #{tag}
                  <button type="button" onClick={() => removeTag(tag)} aria-label={`Remove ${tag}`}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={uploading || isSubmitting} className="flex-1 gap-2">
            <Upload className="h-4 w-4" />
            Publish Image
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
