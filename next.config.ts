import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  typedRoutes: true,
  images: {
    qualities: [70, 80],
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
      { source: "/login", destination: "/", permanent: false },
      { source: "/register", destination: "/", permanent: false },
    ];
  },
};

export default nextConfig;
