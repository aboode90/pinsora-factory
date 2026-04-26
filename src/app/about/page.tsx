import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Sparkles, Heart, Shield, Zap } from "lucide-react";

export const metadata: Metadata = {
  title: "About Pinsora",
  description: "Learn about Pinsora — the creative image discovery platform powered by AI.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-16">
      {/* Hero */}
      <div className="text-center mb-16">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-violet-600 shadow-lg mb-6">
          <Sparkles className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-4xl font-black text-neutral-900 mb-4">
          About <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-600">Pinsora</span>
        </h1>
        <p className="text-lg text-neutral-500 max-w-xl mx-auto leading-relaxed">
          A creative platform for discovering, saving, and sharing beautiful images — powered by AI.
        </p>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-16">
        {[
          { icon: Heart, title: "Discover", desc: "Explore thousands of stunning images across art, photography, nature, and more.", color: "bg-rose-50 text-rose-500" },
          { icon: Shield, title: "Save & Organize", desc: "Create boards to save your favorite images and organize your inspiration.", color: "bg-violet-50 text-violet-500" },
          { icon: Zap, title: "AI Powered", desc: "Generate similar images using our AI — exclusively on the Pinsora mobile app.", color: "bg-amber-50 text-amber-500" },
        ].map(({ icon: Icon, title, desc, color }) => (
          <div key={title} className="rounded-2xl border border-neutral-100 p-6 text-center">
            <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${color} mb-4`}>
              <Icon className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-neutral-900 mb-2">{title}</h3>
            <p className="text-sm text-neutral-500 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      {/* Mission */}
      <div className="rounded-2xl bg-gradient-to-br from-pink-50 to-violet-50 border border-pink-100 p-8 mb-10">
        <h2 className="text-xl font-bold text-neutral-900 mb-3">Our Mission</h2>
        <p className="text-neutral-600 leading-relaxed">
          Pinsora was built to give creators, designers, and visual enthusiasts a beautiful space to discover and share inspiring imagery. We believe great visuals spark great ideas — and we&apos;re here to make that discovery effortless.
        </p>
      </div>

      {/* CTA */}
      <div className="text-center">
        <Link
          href="/auth/register"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-pink-500 to-violet-600 text-white font-semibold hover:opacity-90 transition-opacity shadow-md"
        >
          <Sparkles className="h-4 w-4" />
          Join Pinsora Today
        </Link>
      </div>
    </div>
  );
}
