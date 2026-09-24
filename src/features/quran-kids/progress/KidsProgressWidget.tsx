"use client";

import Link from "next/link";
import { Award, Flame } from "lucide-react";
import { useKidsProgress } from "./KidsProgressProvider";
import { BADGE_DEFINITIONS } from "./badges";
import { computeStreak } from "./streak";
import "../quran-kids.css";

export function KidsProgressWidget() {
  const { state } = useKidsProgress();
  const unlockedCount = state.unlockedBadgeIds.length;
  const streak = computeStreak(state.activityDates);

  return (
    <div className="quran-kids-progress-widget-row">
      <Link href="/quran/kids/progress" className="quran-kids-progress-widget">
        <Award aria-hidden />
        <span>
          {unlockedCount} / {BADGE_DEFINITIONS.length} شارة
        </span>
      </Link>
      {streak > 0 && (
        <span className="quran-kids-progress-widget quran-kids-progress-widget--streak">
          <Flame aria-hidden />
          <span>{streak} يوم متواصل</span>
        </span>
      )}
    </div>
  );
}
