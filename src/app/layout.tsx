import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://pinsora.com").replace(/\/$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Pinsora — Discover Beautiful Creative Images",
    template: "%s — Pinsora",
  },
  description:
    "Explore thousands of stunning images across art, photography, design, and more. Find creative inspiration, AI-generated art, wallpapers, and aesthetic photos.",
  keywords: [
    "creative images",
    "AI generated art",
    "image gallery",
    "photo inspiration",
    "digital art",
    "wallpapers",
    "aesthetic photos",
    "art discovery",
    "pinsora",
  ],
  authors: [{ name: "Pinsora", url: siteUrl }],
  creator: "Pinsora",
  publisher: "Pinsora",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    siteName: "Pinsora",
    title: "Pinsora — Discover Beautiful Creative Images",
    description:
      "Explore thousands of stunning images across art, photography, design, and more.",
    url: siteUrl,
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Pinsora — Creative Image Discovery",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pinsora — Discover Beautiful Creative Images",
    description: "Explore thousands of stunning images across art, photography, design, and more.",
    images: [`${siteUrl}/og-image.png`],
  },
  alternates: {
    canonical: siteUrl,
    languages: {
      en: `${siteUrl}/en`,
      ar: `${siteUrl}/ar`,
      "x-default": `${siteUrl}/en`,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
