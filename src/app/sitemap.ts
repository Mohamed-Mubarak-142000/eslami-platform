import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://basira.example";
  const routes = [
    "",
    "/quran",
    "/quran/kids",
    "/quran/kids/audio",
    "/quran/kids/listen",
    "/quran/kids/match",
    "/quran/kids/quiz",
    "/quran/kids/progress",
    "/quran/read",
  ];
  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1 : 0.8,
  }));
}
