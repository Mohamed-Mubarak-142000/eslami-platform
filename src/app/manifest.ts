import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "المنارة — قرآن وعلم وذكر",
    short_name: "المنارة",
    description: "اقرأ القرآن الكريم، واستمع للتلاوات والإذاعة، وتابع مواقيت الصلاة والتقويم الهجري والأذكار.",
    lang: "ar",
    dir: "rtl",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#fbf8f1",
    theme_color: "#003e32",
    id: "/",
    orientation: "any",
    categories: ["education", "lifestyle", "books"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
