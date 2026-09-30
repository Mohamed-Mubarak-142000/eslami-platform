import type { Metadata } from "next";
import { CalendarRange } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { FormAlert } from "@/features/auth/ui/AuthFields";
import { requireSession } from "@/features/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getJuzStarts, getMushafPageStarts } from "@/features/quran/textApi";
import { getSurahs } from "@/features/quran/api";
import { LearnerSwitcher } from "@/features/account/LearnerSwitcher";
import { loadCurrentPlan } from "@/features/plan/data";
import { buildJuzPages } from "@/features/plan/schedule";
import { buildTodayView } from "@/features/plan/view";
import { CreatePlanForm } from "@/features/plan/CreatePlanForm";
import { TodayWird } from "@/features/plan/TodayWird";

export const metadata: Metadata = { title: "خطة الحفظ", robots: { index: false } };

export default async function PlanPage() {
  const { activeLearner, profile } = await requireSession("/plan");
  const supabase = await createSupabaseServerClient();
  const [current, juzStarts, pageStarts, surahs] = await Promise.all([
    loadCurrentPlan(supabase, activeLearner.id),
    getJuzStarts(),
    getMushafPageStarts(),
    getSurahs(),
  ]);
  const surahNames = Object.fromEntries(surahs.map((surah) => [surah.id, surah.name]));
  const juzPages = buildJuzPages(juzStarts, pageStarts);
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
            : "اختر الأجزاء التي تريد حفظها ومقدارك اليومي، ونرتّب لك كل يوم الحفظ الجديد والمراجعة."
        }
        actions={<LearnerSwitcher />}
      />
      <div className="mx-auto max-w-3xl space-y-8 px-4 py-10 sm:px-6">
        {view ? (
          <TodayWird view={view} />
        ) : juzPages.length > 0 ? (
          <CreatePlanForm juzPages={juzPages} surahNames={surahNames} />
        ) : (
          <FormAlert
            error={current ? "تعذّر تحميل خطتك الآن، حدّث الصفحة بعد قليل." : "تعذّر تحميل بيانات المصحف الآن، حدّث الصفحة بعد قليل."}
          />
        )}
      </div>
    </>
  );
}
