import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://basira.example";
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/community", "/me/", "/settings/", "/notifications", "/auth/"] },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
