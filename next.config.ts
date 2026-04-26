import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      // Cloudflare R2
      {
        protocol: "https",
        hostname: "*.r2.dev",
      },
      // Picsum Photos (for development/demo)
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      // Unsplash (common image source)
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      // Google user avatars
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      // GitHub avatars
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      // OpenAI DALL-E generated images
      {
        protocol: "https",
        hostname: "oaidalleapiprodscus.blob.core.windows.net",
      },
      // Leonardo.ai CDN
      {
        protocol: "https",
        hostname: "cdn.leonardo.ai",
      },
      {
        protocol: "https",
        hostname: "*.leonardo.ai",
      },
    ],
  },
  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ["lucide-react", "@radix-ui/react-dialog"],
  },
};

export default nextConfig;
