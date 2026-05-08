import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://pinsora.com").replace(/\/$/, "");

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/en/",
          "/ar/",
          "/en/explore",
          "/ar/explore",
          "/en/categories",
          "/ar/categories",
          "/en/categories/",
          "/ar/categories/",
          "/en/images/",
          "/ar/images/",
          "/en/profile/",
          "/ar/profile/",
          "/en/search",
          "/ar/search",
          "/en/about",
          "/ar/about",
          "/en/privacy",
          "/ar/privacy",
          "/en/terms",
          "/ar/terms",
        ],
        disallow: [
          "/api/",
          "/en/admin/",
          "/ar/admin/",
          "/en/auth/",
          "/ar/auth/",
          "/en/settings/",
          "/ar/settings/",
          "/en/upload/",
          "/ar/upload/",
          "/en/notifications/",
          "/ar/notifications/",
          "/en/chat/",
          "/ar/chat/",
          "/en/messages/",
          "/ar/messages/",
          "/en/boards/",
          "/ar/boards/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
