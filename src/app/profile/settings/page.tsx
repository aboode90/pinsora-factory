"use client";

import React, { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Camera, Loader2, Save, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/ui/avatar";

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: session?.user?.name || "",
    username: (session?.user as any)?.username || "",
    bio: (session?.user as any)?.bio || "",
    image: session?.user?.image || "",
  });

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5MB");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.url) {
        setFormData((prev) => ({ ...prev, image: data.url }));
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        await update(); // Update session
        router.push("/profile");
        router.refresh();
      } else {
        alert("Failed to update profile");
      }
    } catch (error) {
      console.error("Update error:", error);
      alert("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (!session) return null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-bold text-neutral-900 mb-8">Edit Profile</h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Profile Picture */}
        <div className="flex flex-col items-center">
          <div className="relative group cursor-pointer" onClick={handleImageClick}>
            <div className="h-32 w-32 rounded-full overflow-hidden border-4 border-white shadow-md bg-neutral-100">
              {formData.image ? (
                <Image
                  src={formData.image}
                  alt="Profile"
                  width={128}
                  height={128}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-neutral-400">
                  <UserIcon size={48} />
                </div>
              )}
            </div>
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
              {isUploading ? (
                <Loader2 className="text-white animate-spin" />
              ) : (
                <Camera className="text-white" />
              )}
            </div>
          </div>
          <p className="mt-4 text-sm text-neutral-500 font-medium">Click to change photo</p>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*"
          />
        </div>

        <div className="grid grid-cols-1 gap-6">
          <Input
            label="Display Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Your name"
            required
          />

          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-2">Bio</label>
            <textarea
              className="w-full rounded-xl border border-neutral-200 p-4 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 transition-all min-h-[120px]"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Tell us about yourself..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" loading={isLoading} className="px-8">
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
