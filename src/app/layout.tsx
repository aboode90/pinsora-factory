import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    default: "Pinsora — Discover Beautiful Creative Images",
    template: "%s | Pinsora",
  },
  description:
    "Discover, save, and share stunning creative images across hundreds of categories. Powered by AI image generation.",
  keywords: ["images", "photography", "art", "creative", "inspiration", "AI", "gallery"],
  authors: [{ name: "Pinsora" }],
  icons: {
    icon: "/logo-icon.png",
    apple: "/logo-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: "Pinsora",
    title: "Pinsora — Discover Beautiful Creative Images",
    description: "Discover, save, and share stunning creative images. Powered by AI.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pinsora",
    description: "Discover, save, and share stunning creative images. Powered by AI.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-white font-sans antialiased">
        <Providers>
          <Navbar />
          <main className="min-h-[calc(100vh-4rem)]">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
