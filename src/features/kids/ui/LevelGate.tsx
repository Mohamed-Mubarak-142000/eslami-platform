"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Lock } from "lucide-react";
import { useKidsProgress } from "../progress/KidsProgressProvider";
import { isSurahUnlocked } from "../progress/levels";
import { kidsButton, kidsPanel } from "./kidsStyles";

/** Shows a surah's page only once it is open, so a direct link can't skip a level. */
export function LevelGate({ surahId, children }: { surahId: number; children: ReactNode }) {
  const { state, status } = useKidsProgress();
  if (status === "loading") return null;
  if (isSurahUnlocked(state, surahId)) return children;
  return (
    <div className={`${kidsPanel} mx-auto max-w-xl text-center`}>
      <span className="mx-auto grid size-20 place-items-center rounded-full bg-[#eef1ec] text-muted">
        <Lock className="size-10" aria-hidden />
      </span>
      <h1 className="mt-5 text-3xl font-extrabold text-emerald-deep">هذه السورة مقفلة</h1>
      <p className="mt-2 text-lg text-muted">انجح في اختبار السورة السابقة لتفتح هذه السورة.</p>
      <Link href="/kids/quiz" className={kidsButton("gold", "mt-6 px-10")}>
        إلى الاختبارات
      </Link>
    </div>
  );
}
