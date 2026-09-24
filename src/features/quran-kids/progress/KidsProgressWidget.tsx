"use client";

import Link from "next/link";
import { Award } from "lucide-react";
import { useKidsProgress } from "./KidsProgressProvider";
import { BADGE_DEFINITIONS } from "./badges";
import "../quran-kids.css";

export function KidsProgressWidget() {
  const { state } = useKidsProgress();
  const unlockedCount = state.unlockedBadgeIds.length;

  return (
    <Link href="/quran/kids/progress" className="quran-kids-progress-widget">
      <Award aria-hidden />
      <span>
        {unlockedCount} / {BADGE_DEFINITIONS.length} شارة
      </span>
    </Link>
  );
}
