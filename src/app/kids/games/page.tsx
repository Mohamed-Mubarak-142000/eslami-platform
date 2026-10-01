"use client";

import Link from "next/link";
import type { Route } from "next";
import { motion } from "framer-motion";
import { kidsPanel } from "@/features/kids/ui/kidsStyles";

interface GameCard {
  href: Route;
  title: string;
  description: string;
  emoji: string;
  color: string;
  shadow: string;
}

const SECTIONS: { title: string; games: GameCard[] }[] = [
  {
    title: "📖 ألعاب القرآن",
    games: [
      {
        href: "/kids/games/listen-pick",
        title: "اسمع واختر",
        description: "اسمع الآية واعرفها بين الآيات",
        emoji: "🎧",
        color: "#1f9be0",
        shadow: "#157ab3",
      },
      {
        href: "/kids/games/ayah-order",
        title: "رتّب الآيات",
        description: "رتّب آيات السورة كما في المصحف",
        emoji: "🧩",
        color: "#f5b92e",
        shadow: "#c98f10",
      },
      {
        href: "/kids/games/arrange",
        title: "رتّب الكلمات",
        description: "رتّب كلمات الآية بالترتيب الصحيح",
        emoji: "🔤",
        color: "#12a15b",
        shadow: "#0b7a44",
      },
      {
        href: "/kids/games/surah-match",
        title: "ذاكرة السور",
        description: "طابق اسم السورة مع أول آية فيها",
        emoji: "🃏",
        color: "#7a5af5",
        shadow: "#5a3ed1",
      },
      {
        href: "/kids/games/true-false",
        title: "صح أم خطأ",
        description: "جمل عن السور: صحيحة أم خطأ؟",
        emoji: "✅",
        color: "#e84a67",
        shadow: "#b92f49",
      },
      {
        href: "/kids/quiz",
        title: "اختبر نفسك",
        description: "اختبار كل سورة يفتح التي بعدها",
        emoji: "🧠",
        color: "#e8774a",
        shadow: "#b8552c",
      },
    ],
  },
  {
    title: "🔡 الحروف والتجويد",
    games: [
      {
        href: "/kids/games/letters",
        title: "ذاكرة الحروف",
        description: "اقلب البطاقات وطابق كل حرف باسمه",
        emoji: "🅰️",
        color: "#7a5af5",
        shadow: "#5a3ed1",
      },
      {
        href: "/kids/games/tajweed",
        title: "لوّن التجويد",
        description: "اكتشف أحكام التجويد ولوّنها",
        emoji: "🎨",
        color: "#e84a67",
        shadow: "#b92f49",
      },
    ],
  },
  {
    title: "🎬 قصص واستماع",
    games: [
      {
        href: "/kids/stories",
        title: "قصص الأنبياء",
        description: "قصص كرتونية نتعلّم منها",
        emoji: "📺",
        color: "#7a5af5",
        shadow: "#5a3ed1",
      },
      {
        href: "/kids/listen",
        title: "استمع مع الأطفال",
        description: "المصحف المعلّم بصوت الشيخ والأطفال",
        emoji: "🎶",
        color: "#1f9be0",
        shadow: "#157ab3",
      },
    ],
  },
];

export default function KidsGamesPage() {
  return (
    <div>
      <div className={`${kidsPanel} text-center`}>
        <h1 className="text-3xl font-extrabold text-emerald-deep sm:text-4xl">🎮 العب وتعلّم</h1>
        <p className="mt-2 text-lg text-muted">العب وتعلّم واجمع النجوم!</p>
      </div>
      {SECTIONS.map((section, sectionIndex) => (
        <section key={section.title} className="mt-8">
          <h2 className="mb-3 text-2xl font-extrabold text-white drop-shadow-[0_2px_4px_rgb(0_40_30/50%)]">{section.title}</h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {section.games.map((game, index) => (
              <motion.li
                key={game.href}
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: sectionIndex * 0.15 + index * 0.06, type: "spring", stiffness: 260, damping: 18 }}
                whileHover={{ y: -6, rotate: index % 2 ? 1 : -1 }}
              >
                <Link
                  href={game.href}
                  className="flex h-full items-center gap-4 rounded-[2rem] bg-white/95 p-5 shadow-lift ring-4 ring-white/60"
                >
                  <span
                    className="grid size-18 shrink-0 place-items-center rounded-3xl text-4xl"
                    style={{ background: game.color, boxShadow: `0 7px 0 ${game.shadow}` }}
                    aria-hidden
                  >
                    {game.emoji}
                  </span>
                  <span>
                    <span className="block text-xl font-extrabold text-emerald-deep">{game.title}</span>
                    <span className="mt-1 block text-muted">{game.description}</span>
                  </span>
                </Link>
              </motion.li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
