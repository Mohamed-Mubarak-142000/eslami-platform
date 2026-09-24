"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, PartyPopper } from "lucide-react";
import { Amiri_Quran } from "next/font/google";
import { TAJWEED_RULES, type Surah, type TajweedAyah } from "@/features/quran";
import { useKidsProgress } from "../progress/KidsProgressProvider";
import { checkTajweedMatch, pickTajweedRound, type TajweedMatchRound } from "./matchGameLogic";
import "../quran-kids.css";

const amiriQuran = Amiri_Quran({ subsets: ["arabic"], weight: "400", display: "swap" });

export function TajweedMatchGame({ surah, tajweedAyahs }: { surah: Surah; tajweedAyahs: TajweedAyah[] }) {
  const { recordMatchGameCompletion } = useKidsProgress();
  const [round, setRound] = useState<TajweedMatchRound | null>(() => pickTajweedRound(tajweedAyahs));
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [wrongRuleClass, setWrongRuleClass] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  const currentTarget = useMemo(() => round?.targets.find((target) => !matchedIds.includes(target.id)) ?? null, [round, matchedIds]);

  const paletteRules = useMemo(() => {
    if (!round) return [];
    const uniqueRuleClasses = Array.from(new Set(round.targets.map((target) => target.ruleClass)));
    return uniqueRuleClasses.map((ruleClass) => ({ ruleClass, info: TAJWEED_RULES[ruleClass] })).filter((item) => item.info);
  }, [round]);

  function handleChoice(ruleClass: string) {
    if (!currentTarget) return;
    if (checkTajweedMatch(currentTarget, ruleClass)) {
      setWrongRuleClass(null);
      setMatchedIds((current) => {
        const next = [...current, currentTarget.id];
        if (round && next.length === round.targets.length) {
          setCompleted(true);
          recordMatchGameCompletion("tajweed");
        }
        return next;
      });
    } else {
      setWrongRuleClass(ruleClass);
    }
  }

  function handleReplay() {
    setRound(pickTajweedRound(tajweedAyahs));
    setMatchedIds([]);
    setWrongRuleClass(null);
    setCompleted(false);
  }

  if (!round) {
    return (
      <main id="quran-main" className="quran-page">
        <Link href="/quran/kids/match" className="quran-back"><ArrowRight aria-hidden /> اختيار سورة أخرى</Link>
        <p className="quran-empty">لا تتوفر أحكام تجويد كافية في هذه السورة لبناء اللعبة. جرّب سورة أخرى.</p>
      </main>
    );
  }

  return (
    <main id="quran-main" className="quran-page">
      <Link href="/quran/kids/match" className="quran-back"><ArrowRight aria-hidden /> اختيار سورة أخرى</Link>

      <section className="quran-reciter-header">
        <div>
          <span className="landing-kicker">لعبة تلوين التجويد</span>
          <h1>{surah.name} — آية {round.ayahNumberInSurah}</h1>
        </div>
      </section>

      <p className="quran-empty">اختر لون الحكم الصحيح للجزء المحدد من الآية.</p>

      <article className={`quran-kids-tajweed-snippet ${amiriQuran.className}`} lang="ar" dir="rtl">
        {round.displaySegments.map((segment, index) => {
          if (!segment.targetId) return <span key={index}>{segment.text}</span>;
          const isMatched = matchedIds.includes(segment.targetId);
          const target = round.targets.find((item) => item.id === segment.targetId);
          const isCurrent = currentTarget?.id === segment.targetId;
          const color = isMatched && target ? TAJWEED_RULES[target.ruleClass]?.color : undefined;
          return (
            <span
              key={index}
              className="quran-kids-tajweed-target"
              data-selected={isCurrent}
              style={color ? { color } : undefined}
            >
              {segment.text}
            </span>
          );
        })}
      </article>

      {!completed && (
        <div className="quran-kids-choice-grid">
          {paletteRules.map(({ ruleClass, info }) => (
            <button
              key={ruleClass}
              type="button"
              className="quran-kids-choice"
              data-state={wrongRuleClass === ruleClass ? "incorrect" : undefined}
              onClick={() => handleChoice(ruleClass)}
              style={{ borderColor: info?.color }}
            >
              <i aria-hidden style={{ display: "inline-block", inlineSize: ".7rem", blockSize: ".7rem", borderRadius: "50%", background: info?.color }} />
              {info?.label}
            </button>
          ))}
        </div>
      )}

      {completed && (
        <div className="quran-kids-score-panel">
          <PartyPopper size={40} color="#f5c518" aria-hidden />
          <p>أحسنت! طابقت كل الأحكام بنجاح 🎉</p>
          <button type="button" className="quran-kids-choice" onClick={handleReplay}>جولة جديدة</button>
        </div>
      )}
    </main>
  );
}
