import type { Metadata } from "next";
import { BookOpen } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { FormAlert } from "@/features/auth/ui/AuthFields";
import { requireSession } from "@/features/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSurahs } from "@/features/quran/api";
import { LearnerSwitcher } from "@/features/account/LearnerSwitcher";
import { loadBoundaries, loadCurrentKhatma } from "@/features/khatma/data";
import { buildKhatmaView } from "@/features/khatma/view";
import { CreateKhatmaForm } from "@/features/khatma/CreateKhatmaForm";
import { KhatmaToday } from "@/features/khatma/KhatmaToday";

export const metadata: Metadata = { title: "ختمة القرآن", robots: { index: false } };

export default async function KhatmaPage() {
  const { activeLearner } = await requireSession("/khatma");
  const supabase = await createSupabaseServerClient();
  const [current, boundaries, surahs] = await Promise.all([loadCurrentKhatma(supabase, activeLearner.id), loadBoundaries(), getSurahs()]);
  const surahNames = Object.fromEntries(surahs.map((surah) => [surah.id, surah.name]));
  const view = current && boundaries ? buildKhatmaView(current, boundaries, surahNames) : null;

  return (
    <>
      <PageHeader
        kicker="الختمة"
        icon={<BookOpen className="size-4" aria-hidden />}
        title={view ? "ورد ختمتك اليوم" : "ختمة القرآن"}
        description={
          view
            ? "ما عليك قراءته اليوم لتمضي في ختمتك. إن فاتك يوم فالختمة تنتظرك حيث توقفت."
            : "اقرأ القرآن كاملًا أو سورًا وأجزاءً تختارها، بمقدار يومي أو في مدة تحددها، وفي الأيام التي تناسبك."
        }
        actions={<LearnerSwitcher />}
      />
      <div className="mx-auto max-w-3xl space-y-8 px-4 py-10 sm:px-6">
        {view ? (
          <KhatmaToday view={view} />
        ) : current ? (
          <FormAlert error="تعذّر تحميل بيانات المصحف الآن، حدّث الصفحة بعد قليل." />
        ) : (
          <CreateKhatmaForm boundaries={boundaries} surahNames={surahNames} />
        )}
      </div>
    </>
  );
}
