"use client";

import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { useRef } from "react";
import { motion } from "framer-motion";
import { Award, BookOpen, Clapperboard, Flame, Headphones, Puzzle, ShieldCheck, Sparkles, Star } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { gsap, useGSAP, FULL_MOTION } from "@/lib/gsap";
import { toArabicDigits } from "@/lib/arabic";
import gardenChild from "@/assets/scenes/garden-child.png";
import { useKidsProgress } from "./progress/KidsProgressProvider";
import { computeStars, countMemorizedAyahs } from "./progress/stars";
import { computeStreak } from "./progress/streak";

interface HubCard {
  href: Route;
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  shadow: string;
}

const CARDS: HubCard[] = [
  {
    href: "/kids/learn",
    title: "تعلّم السور",
    description: "آية آية مع الشيخ، وردّد وراءه",
    icon: BookOpen,
    color: "#12a15b",
    shadow: "#0b7a44",
  },
  { href: "/kids/games", title: "الألعاب", description: "حروف وتجويد وترتيب الآيات", icon: Puzzle, color: "#f5b92e", shadow: "#c98f10" },
  {
    href: "/kids/stories",
    title: "قصص الأنبياء",
    description: "قصص كرتونية نتعلّم منها",
    icon: Clapperboard,
    color: "#7a5af5",
    shadow: "#5a3ed1",
  },
  { href: "/kids/quiz", title: "اختبر نفسك", description: "أسئلة ممتعة عن السور", icon: Sparkles, color: "#e84a67", shadow: "#b92f49" },
  {
    href: "/kids/listen",
    title: "استمع مع الأطفال",
    description: "المصحف المعلّم بصوت الشيخ والأطفال",
    icon: Headphones,
    color: "#1f9be0",
    shadow: "#157ab3",
  },
  {
    href: "/kids/progress",
    title: "رحلتي وشاراتي",
    description: "نجومك وشاراتك وما حفظته",
    icon: Award,
    color: "#7a5af5",
    shadow: "#5a3ed1",
  },
  { href: "/kids/parent", title: "لوحة الأهل", description: "لمتابعة تقدّم طفلك", icon: ShieldCheck, color: "#4b6b62", shadow: "#324a43" },
];

export function KidsHub() {
  const ref = useRef<HTMLDivElement>(null);
  const { state } = useKidsProgress();

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(FULL_MOTION, () => {
        gsap.from("[data-hub-title]", { autoAlpha: 0, y: -30, scale: 0.9, duration: 0.9, ease: "back.out(1.8)" });
        gsap.from("[data-hub-card]", { autoAlpha: 0, y: 50, scale: 0.85, duration: 0.7, stagger: 0.08, delay: 0.2, ease: "back.out(1.6)" });
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  const stats = [
    { label: "نجمة", value: computeStars(state), icon: Star, tint: "text-[#e0a800] fill-[#f5c542]" },
    { label: "آية حفظتها", value: countMemorizedAyahs(state), icon: BookOpen, tint: "text-emerald" },
    { label: "أيام متتالية", value: computeStreak(state.activityDates), icon: Flame, tint: "text-[#f0642e] fill-[#ffb36b]" },
  ];

  return (
    <div ref={ref}>
      <section className="grid items-center gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div
          data-hub-title
          className="rounded-[2.5rem] bg-white/90 p-7 text-center shadow-lift ring-4 ring-white/60 backdrop-blur lg:text-start"
        >
          <p className="inline-block rounded-full bg-[#fff6d8] px-4 py-1 text-base font-extrabold text-[#8a5a00]">أهلًا بك يا بطل!</p>
          <h1 className="mt-3 text-4xl font-extrabold text-emerald-deep sm:text-5xl">حديقة القرآن</h1>
          <p className="mt-3 text-lg text-muted">اختر مغامرتك: تعلّم سورة، العب لعبة، أو اختبر نفسك واجمع النجوم.</p>
          <dl className="mt-6 grid grid-cols-3 gap-3">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="rounded-3xl bg-ivory p-3 text-center">
                  <Icon className={`mx-auto size-7 ${stat.tint}`} aria-hidden />
                  <dd className="mt-1 text-2xl font-extrabold text-emerald-deep">{toArabicDigits(stat.value)}</dd>
                  <dt className="text-xs font-bold text-muted">{stat.label}</dt>
                </div>
              );
            })}
          </dl>
        </div>
        <div className="relative hidden aspect-[16/10] overflow-hidden rounded-[2.5rem] shadow-lift ring-4 ring-white/70 lg:block">
          <Image
            src={gardenChild}
            alt="طفل يقرأ المصحف تحت شجرة"
            fill
            sizes="45vw"
            quality={80}
            placeholder="blur"
            className="animate-float object-cover object-left"
          />
        </div>
      </section>

      <ul className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-3">
        {CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <li key={card.href} data-hub-card>
              <motion.div
                whileHover={{ y: -8, rotate: -1 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 400, damping: 16 }}
              >
                <Link
                  href={card.href}
                  className="block h-full rounded-[2rem] bg-white/95 p-5 text-center shadow-lift ring-4 ring-white/60 backdrop-blur sm:p-6"
                >
                  <span
                    className="mx-auto grid size-18 place-items-center rounded-full text-white sm:size-20"
                    style={{ background: card.color, boxShadow: `0 7px 0 ${card.shadow}` }}
                  >
                    <Icon className="size-9" aria-hidden />
                  </span>
                  <span className="mt-4 block text-xl font-extrabold text-emerald-deep sm:text-2xl">{card.title}</span>
                  <span className="mt-1 block text-sm text-muted">{card.description}</span>
                </Link>
              </motion.div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
