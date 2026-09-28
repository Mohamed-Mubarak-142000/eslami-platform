"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, type ReactNode } from "react";
import { Home, Moon, Star, Sun, Volume2, VolumeX } from "lucide-react";
import { gsap, useGSAP, FULL_MOTION } from "@/lib/gsap";
import { toArabicDigits } from "@/lib/arabic";
import { useNow } from "@/features/time/useNow";
import garden from "@/assets/scenes/garden.png";
import { useKidsProgress } from "../progress/KidsProgressProvider";
import { computeStars } from "../progress/stars";
import { setSfxEnabled, useSfxEnabled } from "../sfx";
import { GuestMergeBanner, LearnerSwitcher } from "@/features/account/LearnerSwitcher";

const LEAVES = Array.from({ length: 7 }, (_, i) => ({
  left: `${8 + i * 13}%`,
  delay: i * 1.7,
  size: 18 + (i % 3) * 8,
  duration: 11 + (i % 4) * 3,
}));

function Greeting() {
  const now = useNow();
  if (!now) return null;
  const hour = now.getHours();
  const morning = hour >= 4 && hour < 12;
  const evening = hour >= 17 || hour < 4;
  return (
    <div className="fixed bottom-4 left-4 z-20 hidden flex-col sm:flex items-center rounded-3xl bg-white/90 px-3.5 py-2.5 text-center font-kids shadow-lift ring-4 ring-white/60 backdrop-blur">
      {evening ? (
        <Moon className="size-7 fill-[#ffd66b] text-[#e8a800]" aria-hidden />
      ) : (
        <Sun className="size-8 animate-[spin_18s_linear_infinite] fill-[#ffd66b] text-[#f0a500]" aria-hidden />
      )}
      <span className="mt-0.5 text-sm font-extrabold text-emerald-deep">
        {morning ? "صباح الخير" : evening ? "مساء الخير" : "طاب يومك"}
      </span>
    </div>
  );
}

export function KidsShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);
  const { state } = useKidsProgress();
  const sfxOn = useSfxEnabled();
  const atGarden = pathname === "/kids";

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(FULL_MOTION, () => {
        gsap.to("[data-garden-bg]", { scale: 1.06, duration: 24, ease: "sine.inOut", yoyo: true, repeat: -1 });
        gsap.utils.toArray<HTMLElement>("[data-leaf]").forEach((leaf) => {
          const delay = Number(leaf.dataset.delay ?? 0);
          const duration = Number(leaf.dataset.duration ?? 12);
          gsap.fromTo(
            leaf,
            { y: -60, x: 0, rotate: 0, autoAlpha: 0 },
            { y: "110vh", x: "random(-120, 120)", rotate: "random(-360, 360)", autoAlpha: 1, duration, delay, ease: "none", repeat: -1 },
          );
        });
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className="relative isolate min-h-dvh overflow-x-hidden font-kids">
      <div className="fixed inset-0 -z-20 overflow-hidden" aria-hidden>
        <div data-garden-bg className="absolute inset-0">
          <Image src={garden} alt="" fill preload sizes="100vw" quality={80} placeholder="blur" className="object-cover" />
        </div>
        <div className="absolute inset-0 bg-linear-to-b from-sky-100/10 via-transparent to-emerald-night/25" />
      </div>
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
        {LEAVES.map((leaf, index) => (
          <svg
            key={index}
            data-leaf
            data-delay={leaf.delay}
            data-duration={leaf.duration}
            viewBox="0 0 24 24"
            className="invisible absolute top-0 text-[#8fcf4a]"
            style={{ left: leaf.left, width: leaf.size, height: leaf.size }}
          >
            <path d="M5 21c0-9 6-16 16-17-1 10-8 16-16 17zm0 0l9-9" fill="currentColor" stroke="#5d9a2a" strokeWidth="1" />
          </svg>
        ))}
      </div>

      <header className="sticky top-0 z-30 px-3 pt-3 sm:px-5">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <Link
            href={atGarden ? "/" : "/kids"}
            className="inline-flex items-center gap-2 rounded-full bg-white/95 px-5 py-2.5 text-base font-extrabold text-emerald-deep shadow-lift ring-4 ring-white/60 transition-transform hover:-translate-y-0.5"
          >
            <Home className="size-5" aria-hidden /> {atGarden ? "العودة للموقع" : "العودة للحديقة"}
          </Link>
          <div className="ms-auto flex items-center gap-2">
            <LearnerSwitcher variant="kids" />
            <Link
              href="/kids/progress"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#fff6d8] px-4 py-2.5 text-base font-extrabold text-[#8a5a00] shadow-lift ring-4 ring-white/60"
              aria-label={`نجومك: ${computeStars(state)}`}
            >
              <Star className="size-5 fill-[#f5c542] text-[#e0a800]" aria-hidden /> {toArabicDigits(computeStars(state))}
            </Link>
            <button
              type="button"
              onClick={() => setSfxEnabled(!sfxOn)}
              aria-pressed={sfxOn}
              className="grid size-12 place-items-center rounded-full bg-white/95 text-emerald-deep shadow-lift ring-4 ring-white/60"
              aria-label={sfxOn ? "إيقاف أصوات الألعاب" : "تشغيل أصوات الألعاب"}
            >
              {sfxOn ? <Volume2 className="size-5" aria-hidden /> : <VolumeX className="size-5" aria-hidden />}
            </button>
          </div>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-6xl px-3 pb-32 pt-6 sm:px-5">
        <GuestMergeBanner className="mb-6" />
        {children}
      </main>
      <Greeting />
    </div>
  );
}
