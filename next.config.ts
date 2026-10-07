import type { NextConfig } from "next";

// One id per build (the Vercel deployment, else the build time). Open pages compare theirs with the
// server's (/api/version) and offer a reload after a deploy — see features/update/UpdatePrompt.tsx.
const BUILD_ID = process.env.VERCEL_DEPLOYMENT_ID ?? process.env.VERCEL_GIT_COMMIT_SHA ?? String(Date.now());

const nextConfig: NextConfig = {
  env: { NEXT_PUBLIC_BUILD_ID: BUILD_ID },
  reactStrictMode: true,
  poweredByHeader: false,
  typedRoutes: true,
  images: {
    qualities: [70, 80],
  },
  experimental: {
    // Sponsor logos are uploaded through a Server Action (up to 1 MB, plus the form's other fields).
    serverActions: { bodySizeLimit: "2mb" },
  },
  async headers() {
    return [
      {
        // The browser must always re-check the service worker, or installed apps keep a stale one.
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      { source: "/quran/read", destination: "/quran", permanent: true },
      { source: "/quran/read/:surah", destination: "/quran/:surah", permanent: true },
      { source: "/quran/more", destination: "/prayer-times", permanent: true },
      { source: "/quran/prayer-times", destination: "/prayer-times", permanent: true },
      { source: "/quran/hijri", destination: "/calendar", permanent: true },
      { source: "/quran/duas", destination: "/adhkar", permanent: true },
      { source: "/quran/topics", destination: "/", permanent: true },
      { source: "/quran/kids", destination: "/kids", permanent: true },
      { source: "/quran/kids/listen", destination: "/kids/learn", permanent: true },
      { source: "/quran/kids/listen/:surah", destination: "/kids/learn/:surah", permanent: true },
      { source: "/quran/kids/audio/:path*", destination: "/kids/listen", permanent: true },
      { source: "/quran/kids/match", destination: "/kids/games", permanent: true },
      { source: "/quran/kids/match/letters", destination: "/kids/games/letters", permanent: true },
      { source: "/quran/kids/match/:surah", destination: "/kids/games/tajweed/:surah", permanent: true },
      { source: "/quran/kids/:path*", destination: "/kids/:path*", permanent: true },
    ];
  },
};

export default nextConfig;
