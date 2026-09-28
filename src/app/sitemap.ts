import type { MetadataRoute } from "next";

const ROUTES = ["", "/quran", "/listen", "/radio", "/prayer-times", "/calendar", "/adhkar", "/privacy", "/terms"];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://al-manara.example";
  const surahs = Array.from({ length: 114 }, (_, index) => `/quran/${index + 1}`);
  return [...ROUTES, ...surahs].map((route) => ({
    url: `${baseUrl}${route}`,
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1 : 0.7,
  }));
}
