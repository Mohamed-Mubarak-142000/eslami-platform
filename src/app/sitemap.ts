import type { MetadataRoute } from "next";
import { CHAPTERS } from "@/features/seerah/seerahContent";

const ROUTES = [
  "",
  "/quran",
  "/listen",
  "/radio",
  "/recordings",
  "/ibtihalat",
  "/tawasheeh",
  "/duas",
  "/adhan",
  "/prayer-times",
  "/calendar",
  "/adhkar",
  "/seerah",
  "/privacy",
  "/terms",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://al-manara.example";
  const surahs = Array.from({ length: 114 }, (_, index) => `/quran/${index + 1}`);
  const chapters = CHAPTERS.map((chapter) => `/seerah/${chapter.id}`);
  return [...ROUTES, ...surahs, ...chapters].map((route) => ({
    url: `${baseUrl}${route}`,
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1 : 0.7,
  }));
}
