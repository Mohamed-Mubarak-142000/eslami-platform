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
    icons: [
      { src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
