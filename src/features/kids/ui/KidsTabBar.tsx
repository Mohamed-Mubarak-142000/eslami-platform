"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useKidsProgress } from "../progress/KidsProgressProvider";
import { unopenedChests } from "../progress/rewards";
import { toArabicDigits } from "@/lib/arabic";

const TABS: { href: Route; label: string; emoji: string; match: (path: string) => boolean }[] = [
  { href: "/kids", label: "رحلتي", emoji: "🗺️", match: (path) => path === "/kids" || path.startsWith("/kids/journey") },
  {
    href: "/kids/games",
    label: "العب وتعلّم",
    emoji: "🎮",
    match: (path) => ["/kids/games", "/kids/quiz", "/kids/stories", "/kids/listen", "/kids/recite"].some((p) => path.startsWith(p)),
  },
  { href: "/kids/garden", label: "حديقتي", emoji: "🌳", match: (path) => path.startsWith("/kids/garden") },
  {
    href: "/kids/rewards",
    label: "جوائزي",
    emoji: "🏆",
    match: (path) => path.startsWith("/kids/rewards") || path.startsWith("/kids/progress"),
  },
];

/** Big, icon-first navigation that stays at the bottom, like a game's menu. */
export function KidsTabBar() {
  const pathname = usePathname();
  const { state } = useKidsProgress();
  const chests = unopenedChests(state).length;
  return (
    <nav
      aria-label="أقسام حديقة القرآن"
      className="fixed inset-x-0 bottom-0 z-40 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:px-4"
    >
      <ul className="mx-auto grid max-w-2xl grid-cols-4 gap-1 rounded-[2rem] bg-white/95 p-1.5 shadow-[0_-10px_40px_-12px_rgb(0_62_50/40%)] ring-4 ring-white/70 backdrop-blur">
        {TABS.map((tab) => {
          const active = tab.match(pathname);
          return (
            <li key={tab.href} className="relative">
              {active && (
                <motion.span
                  layoutId="kids-tab"
                  className="absolute inset-0 rounded-[1.6rem] bg-[#fff1c2]"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className="relative flex flex-col items-center gap-0.5 py-2 text-sm font-extrabold text-emerald-deep sm:text-base"
              >
                <span className={`text-3xl transition-transform ${active ? "scale-110" : ""}`} aria-hidden>
                  {tab.emoji}
                </span>
                {tab.label}
                {tab.href === "/kids/rewards" && chests > 0 && (
                  <span className="absolute end-3 top-1 grid min-w-6 place-items-center rounded-full bg-[#e84a67] px-1.5 text-xs text-white ring-2 ring-white">
                    {toArabicDigits(chests)}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
