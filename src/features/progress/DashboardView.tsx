"use client";

import Link from "next/link";
import type { Route } from "next";
import { Award, BookOpen, BookOpenCheck, Flame, Gamepad2, GraduationCap, Mic, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { toArabicDigits } from "@/lib/arabic";
import { buttonClass } from "@/components/ui/button";
import { FormAlert } from "@/features/auth/ui/AuthFields";
import { GuestMergeBanner } from "@/features/account/LearnerSwitcher";
import { useKidsProgress } from "@/features/kids/progress/KidsProgressProvider";
import { computeStreak } from "@/features/kids/progress/streak";
import { countMemorizedAyahs } from "@/features/kids/progress/stars";
import { useLastRead } from "@/features/quran/lastReadStorage";
import { useNow } from "@/features/time/useNow";
import type { ExamStatus, GameKind } from "@/lib/supabase/database.types";
import { countMemorizedInJuz, type JuzRange } from "./juz";
import { formatArabicDate } from "./format";
import { ReviewToday } from "./ReviewToday";

const TOTAL_AYAHS = 6236;

const GAME_LABELS: Record<GameKind, string> = {
  letters: "لعبة الحروف",
  tajweed: "ألوان التجويد",
  arrange: "رتّب الآية",
  quiz: "مسابقة السور",
};

interface CertificateSummary {
  juz: number;
  verification_code: string;
  issued_at: string;
  revoked_at: string | null;
}

interface AttemptSummary {
  juz: number;
  status: ExamStatus;
  score: number | null;
  total: number;
  started_at: string;
}

interface GameSummary {
  id: number;
  game: GameKind;
  surah: number | null;
  score: number;
  total: number;
  stars: number | null;
  created_at: string;
}

interface TasmeeSummary {
  id: number;
  surah: number;
  ayah_from: number;
  ayah_to: number;
  correct: number;
  mistakes: number;
  created_at: string;
}

interface DashboardViewProps {
  juzRanges: JuzRange[];
  surahNames: Record<number, string>;
  certificates: CertificateSummary[];
  attempts: AttemptSummary[];
  games: GameSummary[];
  tasmee: TasmeeSummary[];
  notice?: string | undefined;
}

function Stat({ icon: Icon, label, value, tone }: { icon: LucideIcon; label: string; value: string; tone: string }) {
  return (
    <div className="flex items-center gap-4 rounded-3xl border border-line bg-white p-4 shadow-soft">
      <span className={cn("grid size-12 shrink-0 place-items-center rounded-2xl", tone)}>
        <Icon className="size-6" aria-hidden />
      </span>
      <div>
        <p className="font-display text-2xl font-bold text-emerald-deep">{value}</p>
        <p className="text-sm text-muted">{label}</p>
      </div>
    </div>
  );
}

function JuzCard({
  range,
  memorized,
  certificate,
  attempt,
}: {
  range: JuzRange;
  memorized: number;
  certificate?: CertificateSummary | undefined;
  attempt?: AttemptSummary | undefined;
}) {
  const percent = range.totalAyahs > 0 ? Math.round((memorized / range.totalAyahs) * 100) : 0;
  const certified = certificate && !certificate.revoked_at;
  const href = (certified ? `/certificates/${certificate.verification_code}` : `/exams/${range.juz}`) as Route;
  return (
    <Link
      href={href}
      className={cn(
        "group relative flex flex-col rounded-3xl border p-4 transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-lift",
        certified ? "border-gold/60 bg-linear-to-br from-gold-mist to-white" : "border-line bg-white",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-display text-lg font-bold text-emerald-deep">الجزء {toArabicDigits(range.juz)}</span>
        {certified ? (
          <Award className="size-5 text-gold-deep" aria-label="حاصل على الشهادة" />
        ) : attempt?.status === "failed" ? (
          <span className="rounded-full bg-rose/10 px-2 py-0.5 text-[0.7rem] font-bold text-rose">أعد المحاولة</span>
        ) : null}
      </div>
      <div
        className="mt-3 h-2 overflow-hidden rounded-full bg-emerald-mist"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`نسبة حفظ الجزء ${range.juz}`}
      >
        <div className={cn("h-full rounded-full", certified ? "bg-gold" : "bg-emerald")} style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-2 text-xs text-muted">
        {toArabicDigits(percent)}٪ — {toArabicDigits(memorized)} من {toArabicDigits(range.totalAyahs)} آية
      </p>
      <p className="mt-2 text-xs font-bold text-emerald opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
        {certified ? "عرض الشهادة" : "اختبار الجزء"}
      </p>
    </Link>
  );
}

export function DashboardView({ juzRanges, surahNames, certificates, attempts, games, tasmee, notice }: DashboardViewProps) {
  const { state, status } = useKidsProgress();
  const lastRead = useLastRead();
  const now = useNow();
  const memorizedTotal = countMemorizedAyahs(state);
  const streak = now ? computeStreak(state.activityDates, now) : 0;
  const activeCertificates = certificates.filter((certificate) => !certificate.revoked_at);
  const loading = status === "loading";

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-10 sm:px-6">
      <FormAlert message={notice} />
      <GuestMergeBanner />
      {status === "error" && <FormAlert error="تعذّر مزامنة تقدّمك الآن. تحقّق من الاتصال ثم حدّث الصفحة." />}

      <section aria-label="ملخّص" className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-4", loading && "animate-pulse")}>
        <Stat
          icon={BookOpenCheck}
          label={`آية محفوظة من ${toArabicDigits(TOTAL_AYAHS)}`}
          value={toArabicDigits(memorizedTotal)}
          tone="bg-emerald-mist text-emerald"
        />
        <Stat icon={Flame} label="أيام متتالية" value={toArabicDigits(streak)} tone="bg-rose/10 text-rose" />
        <Stat icon={Award} label="شهادة أجزاء" value={toArabicDigits(activeCertificates.length)} tone="bg-gold-mist text-gold-deep" />
        <Stat icon={Sparkles} label="شارة" value={toArabicDigits(state.unlockedBadgeIds.length)} tone="bg-sky/10 text-sky" />
      </section>

      <ReviewToday surahNames={surahNames} />

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-4xl bg-emerald-deep p-6 text-white shadow-lift">
          <BookOpen className="size-7 text-gold-soft" aria-hidden />
          <h2 className="mt-3 text-xl font-bold">تابع القراءة</h2>
          <p className="mt-1 text-sm text-white/75">
            {lastRead ? `سورة ${lastRead.surahName} — صفحة ${toArabicDigits(lastRead.page)}` : "ابدأ من الفاتحة أو اختر سورة."}
          </p>
          <Link
            href={lastRead ? (`/quran/${lastRead.surahId}?page=${lastRead.page}` as Route) : "/quran"}
            className={buttonClass("gold", "md", "mt-5")}
          >
            {lastRead ? "أكمل من حيث توقفت" : "افتح المصحف"}
          </Link>
        </div>
        <div className="rounded-4xl border border-line bg-white p-6 shadow-soft">
          <Mic className="size-7 text-gold-deep" aria-hidden />
          <h2 className="mt-3 text-xl font-bold text-emerald-deep">سمّع لنفسك</h2>
          <p className="mt-1 text-sm text-muted">تُخفى الآيات وتقرأ من حفظك، ثم تكشف وتصحّح.</p>
          <Link href="/tasmee" className={buttonClass("primary", "md", "mt-5")}>
            ابدأ التسميع
          </Link>
        </div>
        <div className="rounded-4xl border border-line bg-white p-6 shadow-soft">
          <GraduationCap className="size-7 text-gold-deep" aria-hidden />
          <h2 className="mt-3 text-xl font-bold text-emerald-deep">اختبارات الأجزاء</h2>
          <p className="mt-1 text-sm text-muted">اجتز اختبار حفظ الجزء واحصل على شهادة باسمك.</p>
          <Link href="/exams" className={buttonClass("outline", "md", "mt-5")}>
            عرض الاختبارات
          </Link>
        </div>
      </section>

      <section aria-labelledby="juz-heading">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="juz-heading" className="text-2xl font-bold text-emerald-deep">
              حفظك في الأجزاء الثلاثين
            </h2>
            <p className="mt-1 text-sm text-muted">علّم الآيات التي حفظتها من المصحف أو بعد التسميع، وتتحدّث النسب تلقائيًا.</p>
          </div>
        </div>
        {juzRanges.length === 0 ? (
          <p className="rounded-3xl border border-line bg-white p-6 text-center text-muted">تعذّر تحميل بيانات الأجزاء الآن.</p>
        ) : (
          <div className={cn("grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5", loading && "animate-pulse")}>
            {juzRanges.map((range) => (
              <JuzCard
                key={range.juz}
                range={range}
                memorized={countMemorizedInJuz(range, state.memorizedAyahsBySurah)}
                certificate={certificates.find((certificate) => certificate.juz === range.juz)}
                attempt={attempts.find((attempt) => attempt.juz === range.juz)}
              />
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-4xl border border-line bg-white p-6 shadow-soft">
          <h2 className="flex items-center gap-2 text-lg font-bold text-emerald-deep">
            <Mic className="size-5 text-gold-deep" aria-hidden /> آخر جلسات التسميع
          </h2>
          {tasmee.length === 0 ? (
            <p className="mt-4 text-sm text-muted">لم تسمّع بعد.</p>
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {tasmee.map((session) => (
                <li key={session.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <span className="font-bold">
                    {surahNames[session.surah] ?? `سورة ${toArabicDigits(session.surah)}`} ({toArabicDigits(session.ayah_from)}–
                    {toArabicDigits(session.ayah_to)})
                  </span>
                  <span className="text-muted">
                    <span className="font-bold text-emerald">{toArabicDigits(session.correct)} صحيحة</span>
                    {session.mistakes > 0 && <span className="text-rose"> · {toArabicDigits(session.mistakes)} للمراجعة</span>} ·{" "}
                    {formatArabicDate(session.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-4xl border border-line bg-white p-6 shadow-soft">
          <h2 className="flex items-center gap-2 text-lg font-bold text-emerald-deep">
            <Gamepad2 className="size-5 text-gold-deep" aria-hidden /> آخر الألعاب
          </h2>
          {games.length === 0 ? (
            <p className="mt-4 text-sm text-muted">
              لم تُلعب أي لعبة بعد.{" "}
              <Link href="/kids/games" className="font-bold text-emerald hover:underline">
                إلى ألعاب الحديقة
              </Link>
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {games.map((game) => (
                <li key={game.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <span className="font-bold">
                    {GAME_LABELS[game.game]}
                    {game.surah && <span className="font-normal text-muted"> — {surahNames[game.surah]}</span>}
                  </span>
                  <span className="text-muted">
                    {game.stars !== null
                      ? `${toArabicDigits(game.stars)} / ٣ نجوم`
                      : `${toArabicDigits(game.score)} / ${toArabicDigits(game.total)}`}{" "}
                    · {formatArabicDate(game.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
