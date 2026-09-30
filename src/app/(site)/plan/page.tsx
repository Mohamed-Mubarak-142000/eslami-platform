import type { Metadata } from "next";
import { CalendarRange } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { FormAlert } from "@/features/auth/ui/AuthFields";
import { requireSession } from "@/features/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getJuzStarts, getMushafPageStarts, getQuranMeta } from "@/features/quran/textApi";
import { getSurahAyahCount } from "@/features/kids/progress/surahAyahCounts";
import { getSurahs } from "@/features/quran/api";
import { LearnerSwitcher } from "@/features/account/LearnerSwitcher";
import { loadCurrentPlan } from "@/features/plan/data";
import { buildJuzPages, surahsToPages } from "@/features/plan/schedule";
import { buildTodayView } from "@/features/plan/view";
import { CreatePlanForm } from "@/features/plan/CreatePlanForm";
import { TodayWird } from "@/features/plan/TodayWird";

export const metadata: Metadata = { title: "خطة الحفظ", robots: { index: false } };

export default async function PlanPage() {
  const { activeLearner, profile } = await requireSession("/plan");
  const supabase = await createSupabaseServerClient();
  const [current, juzStarts, pageStarts, surahs, meta] = await Promise.all([
    loadCurrentPlan(supabase, activeLearner.id),
    getJuzStarts(),
    getMushafPageStarts(),
    getSurahs(),
    getQuranMeta(),
  ]);
  const surahNames = Object.fromEntries(surahs.map((surah) => [surah.id, surah.name]));
  const juzPages = buildJuzPages(juzStarts, pageStarts);
  const juzOf = new Map(meta.map((surah) => [surah.number, surah.juzStart]));
  const pickerSurahs = surahs.map((surah) => ({ id: surah.id, name: surah.name, juz: juzOf.get(surah.id) ?? 1 }));
  const surahPages = Object.fromEntries(
    surahs.map((surah) => {
      const pages = surahsToPages(pageStarts, [surah.id], getSurahAyahCount);
      return [surah.id, [pages[0] ?? 0, pages[pages.length - 1] ?? -1] as [number, number]];
    }),
  );
  const view = current && pageStarts.length > 0 ? await buildTodayView(current, pageStarts, surahNames) : null;
  const name = activeLearner.kind === "self" ? profile.full_name : activeLearner.display_name;

  return (
    <>
      <PageHeader
        kicker="خطة الحفظ"
        icon={<CalendarRange className="size-4" aria-hidden />}
        title={view ? "وردك اليوم" : "خطة حفظ القرآن"}
        description={
          view
            ? `${name ? `${name}، ` : ""}هذا ما عليك حفظه ومراجعته اليوم. إن فاتك يوم فالخطة تنتظرك حيث توقفت.`
            : "احفظ أجزاءً جديدة أو راجع ما تحفظه، في الأيام التي تناسبك، ونرتّب لك كل يوم وِردك من الحفظ والمراجعة."
        }
        actions={<LearnerSwitcher />}
      />
      <div className="mx-auto max-w-3xl space-y-8 px-4 py-10 sm:px-6">
        {view ? (
          <TodayWird view={view} />
        ) : juzPages.length > 0 ? (
          <CreatePlanForm juzPages={juzPages} surahs={pickerSurahs} surahPages={surahPages} surahNames={surahNames} />
        ) : (
          <FormAlert
            error={current ? "تعذّر تحميل خطتك الآن، حدّث الصفحة بعد قليل." : "تعذّر تحميل بيانات المصحف الآن، حدّث الصفحة بعد قليل."}
          />
        )}
      </div>
    </>
  );
}
