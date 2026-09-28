import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://al-manara.example";
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/kids/parent"] }],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
