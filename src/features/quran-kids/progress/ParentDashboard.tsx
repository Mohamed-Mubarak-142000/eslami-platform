"use client";

import { Flame, ListChecks } from "lucide-react";
import type { Surah } from "@/features/quran";
import { useKidsProgress } from "./KidsProgressProvider";
import { computeStreak } from "./streak";
import { getDueReviews } from "./reviewSchedule";
import { getSurahAyahCount } from "./surahAyahCounts";
import { BADGE_DEFINITIONS } from "./badges";
import { SurahProgressCard } from "./SurahProgressCard";
import "../quran-kids.css";

export function ParentDashboard({ surahs }: { surahs: Surah[] }) {
  const { state, markSurahReviewed } = useKidsProgress();
  const streak = computeStreak(state.activityDates);
  const dueReviews = getDueReviews(state.reviewSchedule);
  const surahById = new Map(surahs.map((surah) => [surah.id, surah]));
  const fullyMemorizedCount = surahs.filter((surah) => {
    const total = getSurahAyahCount(surah.id);
    return total > 0 && (state.memorizedAyahsBySurah[surah.id]?.length ?? 0) >= total;
  }).length;

  return (
    <main id="quran-main" className="quran-page">
      <section className="quran-intro">
        <span className="landing-kicker">لوحة الأهل</span>
        <h1>متابعة تقدّم طفلك</h1>
        <p>ملخّص سريع لنشاط طفلك في منطقة الأطفال — كل البيانات محفوظة محليًا على هذا الجهاز فقط.</p>
      </section>

      <div className="quran-parent-stats">
        <div className="quran-parent-stat">
          <Flame aria-hidden />
          <strong>{streak}</strong>
          <span>يوم متواصل</span>
        </div>
        <div className="quran-parent-stat">
          <ListChecks aria-hidden />
          <strong>{fullyMemorizedCount}</strong>
          <span>سورة محفوظة بالكامل</span>
        </div>
        <div className="quran-parent-stat">
          <span className="quran-parent-stat__badge-icon" aria-hidden>🏅</span>
          <strong>{state.unlockedBadgeIds.length}/{BADGE_DEFINITIONS.length}</strong>
          <span>شارة مكتسبة</span>
        </div>
        <div className="quran-parent-stat">
          <strong>{state.quizStats.attempts}</strong>
          <span>محاولة اختبار (أفضل نتيجة {state.quizStats.bestScorePercent}%)</span>
        </div>
      </div>

      {dueReviews.length > 0 && (
        <>
          <h2 className="quran-kids-section-title">مراجعة اليوم</h2>
          <ul className="quran-parent-review-list">
            {dueReviews.map((due) => {
              const surah = surahById.get(due.surahId);
              return (
                <li key={due.surahId}>
                  <span>{surah?.name ?? `سورة رقم ${due.surahId}`}</span>
                  <button type="button" onClick={() => markSurahReviewed(due.surahId)}>تمت المراجعة</button>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <h2 className="quran-kids-section-title">تقدّم الحفظ لكل سورة</h2>
      <div className="quran-kids-surah-grid">
        {surahs.map((surah) => (
          <SurahProgressCard key={surah.id} surah={surah} memorizedCount={state.memorizedAyahsBySurah[surah.id]?.length ?? 0} />
        ))}
      </div>
    </main>
  );
}
