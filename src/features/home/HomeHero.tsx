"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { BookOpen, Headphones } from "lucide-react";
import { gsap, useGSAP, FULL_MOTION } from "@/lib/gsap";
import { buttonClass } from "@/components/ui/button";
import terrace from "@/assets/scenes/quran-terrace.png";
import { DeskCalendar } from "./DeskCalendar";
import { NextPrayerCard } from "./NextPrayerCard";

const STATS = [
  { value: "١١٤", label: "سورة في مصحف مصفّح" },
  { value: "+٢٠٠", label: "قارئ ورواية" },
  { value: "٢٤/٧", label: "إذاعة القرآن الكريم" },
];

export function HomeHero() {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(FULL_MOTION, () => {
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
        tl.from("[data-hero-bg]", { scale: 1.14, duration: 2.6, ease: "power2.out" }, 0)
          .from("[data-hero-kicker]", { autoAlpha: 0, y: 16, duration: 0.6 }, 0.2)
          .from("[data-hero-line]", { autoAlpha: 0, yPercent: 60, duration: 0.9, stagger: 0.14 }, 0.3)
          .from("[data-hero-fade]", { autoAlpha: 0, y: 20, duration: 0.7, stagger: 0.1 }, 0.7)
          .from(
            "[data-hero-calendar]",
            { autoAlpha: 0, y: -70, rotateX: -35, transformOrigin: "top center", duration: 1.1, ease: "back.out(1.4)" },
            0.5,
          )
          .from("[data-hero-card]", { autoAlpha: 0, x: -50, duration: 0.9 }, 0.8);

        gsap.to("[data-hero-bg]", {
          yPercent: 14,
          ease: "none",
          scrollTrigger: { trigger: ref.current, start: "top top", end: "bottom top", scrub: true },
        });
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <section ref={ref} className="relative isolate overflow-hidden bg-emerald-night text-white">
      <div data-hero-bg className="absolute inset-0 -z-20 will-change-transform">
        <Image
          src={terrace}
          alt=""
          fill
          preload
          sizes="100vw"
          quality={80}
          placeholder="blur"
          className="object-cover object-[35%_center]"
        />
      </div>
      <div className="absolute inset-0 -z-10 bg-linear-to-l from-emerald-night via-emerald-night/80 to-emerald-night/25" aria-hidden />
      <div className="pattern-stars-light absolute inset-0 -z-10 opacity-40" aria-hidden />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-32 bg-linear-to-t from-ivory to-transparent" aria-hidden />

      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 pb-32 pt-14 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:pb-40 lg:pt-20">
        <div>
          <p
            data-hero-kicker
            className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-white/10 px-4 py-1.5 text-sm font-bold text-gold-soft backdrop-blur"
          >
            بسم الله نبدأ
          </p>
          <h1 className="mt-6 font-display text-4xl font-bold leading-[1.35] sm:text-5xl lg:text-6xl">
            <span className="block overflow-hidden pb-1">
              <span data-hero-line className="block">
                علمٌ ينير قلبك،
              </span>
            </span>
            <span className="block overflow-hidden pb-1">
              <span data-hero-line className="block bg-linear-to-l from-gold-soft via-gold to-gold-soft bg-clip-text text-transparent">
                ومعرفةٌ ترافق يومك
              </span>
            </span>
          </h1>
          <p data-hero-fade className="mt-6 max-w-xl text-lg leading-9 text-white/80">
            اقرأ القرآن الكريم في مصحف مصفّح، واستمع لأجمل التلاوات وإذاعة القرآن، واجعل للذكر مكانًا ثابتًا في يومك.
          </p>
          <div data-hero-fade className="mt-8 flex flex-wrap gap-3">
            <Link href="/quran" className={buttonClass("gold", "lg")}>
              <BookOpen aria-hidden /> اقرأ القرآن
            </Link>
            <Link href="/listen" className={buttonClass("light", "lg")}>
              <Headphones aria-hidden /> استمع للتلاوات
            </Link>
          </div>
          <dl data-hero-fade className="mt-10 grid max-w-lg grid-cols-3 gap-3">
            {STATS.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur">
                <dt className="sr-only">{stat.label}</dt>
                <dd className="font-display text-2xl font-bold text-gold-soft">{stat.value}</dd>
                <dd className="mt-1 text-xs leading-5 text-white/70">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="mx-auto grid w-full max-w-md gap-8 sm:max-w-none sm:grid-cols-2 sm:items-start lg:max-w-sm lg:grid-cols-1">
          <DeskCalendar />
          <NextPrayerCard />
        </div>
      </div>
    </section>
  );
}
