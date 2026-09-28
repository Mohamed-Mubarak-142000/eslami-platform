import type { Metadata } from "next";
import { Compass } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireSession } from "@/features/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getJuzStarts } from "@/features/quran/textApi";
import { getSurahs } from "@/features/quran/api";
import { buildJuzRanges } from "@/features/progress/juz";
import { DashboardView } from "@/features/progress/DashboardView";
import { LearnerSwitcher } from "@/features/account/LearnerSwitcher";

export const metadata: Metadata = { title: "رحلتي", robots: { index: false } };

export default async function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  const [{ activeLearner, profile }, params] = await Promise.all([requireSession("/dashboard"), searchParams]);
  const supabase = await createSupabaseServerClient();
  const learnerId = activeLearner.id;

  const [starts, surahs, certificates, attempts, games, tasmee] = await Promise.all([
    getJuzStarts(),
    getSurahs(),
    supabase.from("certificates").select("juz, verification_code, issued_at, revoked_at").eq("learner_id", learnerId).order("juz"),
    supabase
      .from("exam_attempts")
      .select("juz, status, score, total, started_at")
      .eq("learner_id", learnerId)
      .order("started_at", { ascending: false })
      .limit(60),
    supabase
      .from("game_sessions")
      .select("id, game, surah, score, total, stars, created_at")
      .eq("learner_id", learnerId)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("tasmee_sessions")
      .select("id, surah, ayah_from, ayah_to, correct, mistakes, created_at")
      .eq("learner_id", learnerId)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const name = activeLearner.kind === "self" ? profile.full_name : activeLearner.display_name;
  return (
    <>
      <PageHeader
        kicker="رحلتي"
        icon={<Compass className="size-4" aria-hidden />}
        title={name ? `رحلة ${name} مع القرآن` : "رحلتك مع القرآن"}
        description="ما حفظته في كل جزء، ومكان قراءتك، وتسميعك، واختباراتك وشهاداتك — محفوظة في حسابك."
        actions={<LearnerSwitcher />}
      />
      <DashboardView
        juzRanges={buildJuzRanges(starts)}
        surahNames={Object.fromEntries(surahs.map((surah) => [surah.id, surah.name]))}
        certificates={certificates.data ?? []}
        attempts={attempts.data ?? []}
        games={games.data ?? []}
        tasmee={tasmee.data ?? []}
        notice={params.password === "updated" ? "تم تعيين كلمة المرور الجديدة." : undefined}
      />
    </>
  );
}
