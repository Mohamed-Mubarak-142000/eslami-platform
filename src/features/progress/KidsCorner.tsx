"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Award, Gamepad2, Printer, Trees, UserPlus } from "lucide-react";
import { toArabicDigits } from "@/lib/arabic";
import { buttonClass } from "@/components/ui/button";
import { useAccountContext } from "@/features/account/AccountProvider";
import { useKidsProgress } from "@/features/kids/progress/KidsProgressProvider";
import { ActivityStrip, SurahCertificatePrint, completedSurahIds } from "@/features/kids/progress/ReportParts";
import { computeStars } from "@/features/kids/progress/stars";

/** Entry to the kids garden from the dashboard: open it for the selected child, or pick / add one. */
export function KidsCorner({ surahNames }: { surahNames: Record<number, string> }) {
  const { state, setActiveLearner } = useAccountContext();
  const router = useRouter();
  if (state.status !== "signed-in") return null;

  const { activeLearner, learners } = state;
  const children = learners.filter((learner) => learner.kind === "child");

  return (
    <section
      aria-labelledby="kids-corner-heading"
      className="rounded-4xl border border-sky/30 bg-linear-to-l from-sky/10 to-white p-6 shadow-soft"
    >
      <div className="flex flex-wrap items-center justify-between gap-5">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-sky/15 text-sky">
            <Trees className="size-6" aria-hidden />
          </span>
          <div>
            <h2 id="kids-corner-heading" className="text-xl font-bold text-emerald-deep">
              {activeLearner.kind === "child" ? `حديقة القرآن لـ ${activeLearner.display_name}` : "حديقة القرآن لأطفالك"}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {activeLearner.kind === "child"
                ? "تعلّم السور وألعاب الحروف والتجويد — كل نتيجة ونجمة تُحفظ في ملفه."
                : children.length > 0
                  ? "اختر طفلك لتفتح له الحديقة، وتُحفظ ألعابه ونتائجه في ملفه."
                  : "أضف طفلك لتفتح له مساحة يتعلّم فيها ويلعب، وتتابع نتائجه من هنا."}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {activeLearner.kind === "child" ? (
            <Link href="/kids" className={buttonClass("primary", "md")}>
              <Gamepad2 aria-hidden /> ادخل الحديقة
            </Link>
          ) : children.length > 0 ? (
            children.map((child) => (
              <button
                key={child.id}
                type="button"
                onClick={() => {
                  setActiveLearner(child.id);
                  router.push("/kids");
                }}
                className={buttonClass("outline", "md")}
              >
                <Gamepad2 aria-hidden /> {child.display_name}
              </button>
            ))
          ) : (
            <Link href="/account" className={buttonClass("primary", "md")}>
              <UserPlus aria-hidden /> أضف طفلًا
            </Link>
          )}
        </div>
      </div>

      {activeLearner.kind === "child" && <ChildReport childName={activeLearner.display_name} surahNames={surahNames} />}
    </section>
  );
}

/** What the parent area shows, for the child selected in the dashboard. */
function ChildReport({ childName, surahNames }: { childName: string; surahNames: Record<number, string> }) {
  const { state, status } = useKidsProgress();
  const [printing, setPrinting] = useState<number | null>(null);
  if (status !== "ready") return null;

  const completed = completedSurahIds(state);
  const games = state.matchStats.letterGamesCompleted + state.matchStats.tajweedGamesCompleted;
  const stats: [string, string][] = [
    ["نجمة", toArabicDigits(computeStars(state))],
    ["سورة مكتملة", toArabicDigits(completed.length)],
    ["مسابقة", toArabicDigits(state.quizStats.attempts)],
    ["أفضل نتيجة", `${toArabicDigits(state.quizStats.bestScorePercent)}٪`],
    ["لعبة حروف وتجويد", toArabicDigits(games)],
  ];

  function print(surahId: number) {
    setPrinting(surahId);
    setTimeout(() => window.print(), 50);
  }

  return (
    <div className="mt-6 space-y-5 border-t border-sky/20 pt-5">
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-white p-3 text-center">
            <dd className="font-display text-xl font-bold text-emerald-deep">{value}</dd>
            <dt className="text-xs text-muted">{label}</dt>
          </div>
        ))}
      </dl>

      <div>
        <p className="text-sm font-bold text-muted">النشاط في آخر ١٤ يومًا</p>
        <ActivityStrip activityDates={state.activityDates} className="mt-2" />
      </div>

      <div>
        <p className="flex items-center gap-1.5 text-sm font-bold text-muted">
          <Award className="size-4 text-gold-deep" aria-hidden /> شهادات السور
        </p>
        {completed.length === 0 ? (
          <p className="mt-2 text-sm text-muted">عندما يتمّ {childName} حفظ سورة كاملة، تظهر هنا شهادتها للطباعة.</p>
        ) : (
          <div className="mt-2 flex flex-wrap gap-2">
            {completed.map((surahId) => (
              <button key={surahId} type="button" onClick={() => print(surahId)} className={buttonClass("outline", "sm")}>
                <Printer aria-hidden /> سورة {surahNames[surahId] ?? toArabicDigits(surahId)}
              </button>
            ))}
          </div>
        )}
      </div>

      {printing !== null && <SurahCertificatePrint childName={childName} surahName={surahNames[printing] ?? toArabicDigits(printing)} />}
    </div>
  );
}
