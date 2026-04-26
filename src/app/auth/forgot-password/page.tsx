"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 1500));
    setIsSubmitted(true);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-white to-violet-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
            <Image src="/logo-icon.png" alt="Pinsora Icon" width={44} height={44} className="rounded-xl object-contain" />
            <span className="text-2xl font-black tracking-tight">
              <span className="text-neutral-900">Pin</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-600">sora</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-neutral-900">Forgot password?</h1>
          <p className="text-sm text-neutral-500 mt-1">
            {isSubmitted
              ? "Check your email for reset instructions"
              : "No worries, we'll send you reset instructions"}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-8">
          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                required
              />
              <Button type="submit" className="w-full h-11" loading={isLoading}>
                Reset Password
              </Button>
            </form>
          ) : (
            <div className="text-center py-4">
              <div className="h-12 w-12 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="h-6 w-6" />
              </div>
              <p className="text-sm text-neutral-600 mb-6">
                We&apos;ve sent a password reset link to your email address.
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setIsSubmitted(false)}
              >
                Try another email
              </Button>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-neutral-100">
            <Link
              href="/auth/login"
              className="flex items-center justify-center gap-2 text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
