"use client";

import Link from "next/link";
import type { Route } from "next";
import { motion } from "framer-motion";
import { Brain, Palette, Shuffle, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { kidsPanel } from "@/features/kids/ui/kidsStyles";

const GAMES: { href: Route; title: string; description: string; icon: LucideIcon; color: string; shadow: string }[] = [
  {
    href: "/kids/games/letters",
    title: "ذاكرة الحروف",
    description: "اقلب البطاقات وطابق كل حرف باسمه",
    icon: Brain,
    color: "#7a5af5",
    shadow: "#5a3ed1",
  },
  {
    href: "/kids/games/tajweed",
    title: "لوّن التجويد",
    description: "اكتشف أحكام التجويد ولوّنها بالألوان الصحيحة",
    icon: Palette,
    color: "#e84a67",
    shadow: "#b92f49",
  },
  {
    href: "/kids/games/arrange",
    title: "رتّب الآية",
    description: "رتّب كلمات الآية كما في المصحف",
    icon: Shuffle,
    color: "#12a15b",
    shadow: "#0b7a44",
  },
  { href: "/kids/quiz", title: "الاختبار", description: "أكمل الآية واعرف السورة", icon: Sparkles, color: "#f5b92e", shadow: "#c98f10" },
];

export default function KidsGamesPage() {
  return (
    <div>
      <div className={`${kidsPanel} text-center`}>
        <h1 className="text-3xl font-extrabold text-emerald-deep sm:text-4xl">ساحة الألعاب</h1>
        <p className="mt-2 text-lg text-muted">العب وتعلّم واجمع النجوم!</p>
      </div>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {GAMES.map((game, index) => {
          const Icon = game.icon;
          return (
            <motion.li
              key={game.href}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: index * 0.08, type: "spring", stiffness: 260, damping: 18 }}
              whileHover={{ y: -6, rotate: index % 2 ? 1 : -1 }}
            >
              <Link href={game.href} className="flex items-center gap-5 rounded-[2rem] bg-white/95 p-6 shadow-lift ring-4 ring-white/60">
                <span
                  className="grid size-20 shrink-0 place-items-center rounded-3xl text-white"
                  style={{ background: game.color, boxShadow: `0 7px 0 ${game.shadow}` }}
                >
                  <Icon className="size-10" aria-hidden />
                </span>
                <span>
                  <span className="block text-2xl font-extrabold text-emerald-deep">{game.title}</span>
                  <span className="mt-1 block text-muted">{game.description}</span>
                </span>
              </Link>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}
