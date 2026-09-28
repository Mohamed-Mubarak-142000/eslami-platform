import Link from "next/link";
import type { Metadata, Route } from "next";
import { notFound } from "next/navigation";
import { Award, GraduationCap, Hourglass, ListChecks } from "lucide-react";
import { toArabicDigits } from "@/lib/arabic";
import { buttonClass } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireSession } from "@/features/auth/session";
import { getActiveAttempt, getExamOverview, getExamSettings } from "@/features/exams/data";
import { ExamRunner } from "@/features/exams/ExamRunner";
import { StartExamButton } from "@/features/exams/StartExamButton";
import { getSurahs } from "@/features/quran/api";

export async function generateMetadata({ params }: PageProps<"/exams/[juz]">): Promise<Metadata> {
  const { juz } = await params;
  return { title: `اختبار الجزء ${toArabicDigits(juz)}`, robots: { index: false } };
}

const RULES = [
  "أسئلة متنوّعة: أكمل الآية، والآية التالية، والكلمة الناقصة، واسم السورة.",
  "الأسئلة تتولّد لك وحدك من نص الجزء، وتُصحَّح على الخادم.",
  "يُسلَّم الاختبار تلقائيًا عند انتهاء الوقت.",
  "الشهادة تقيس الحفظ وليست إجازة في التلاوة والتجويد.",
];

export default async function ExamPage({ params }: PageProps<"/exams/[juz]">) {
  const juz = Number((await params).juz);
  if (!Number.isInteger(juz) || juz < 1 || juz > 30) notFound();

  const session = await requireSession(`/exams/${juz}`);
  const learner = session.activeLearner;
  const [settings, attempt, surahs] = await Promise.all([getExamSettings(), getActiveAttempt(learner.id, juz), getSurahs()]);
  const surahNames = Object.fromEntries(surahs.map((surah) => [surah.id, surah.name]));
  const status = attempt ? null : (await getExamOverview(learner.id, settings.retry_cooldown_hours))[juz]!;
  const forWhom = learner.kind === "child" ? ` — ${learner.display_name}` : "";

  return (
    <>
      <PageHeader
        kicker="اختبار حفظ"
        icon={<GraduationCap className="size-4" aria-hidden />}
        title={`اختبار الجزء ${toArabicDigits(juz)}${forWhom}`}
        description={`${toArabicDigits(settings.exam_question_count)} سؤالًا · ${toArabicDigits(settings.exam_minutes)} دقيقة · النجاح ${toArabicDigits(settings.exam_pass_percent)}٪`}
      />
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        {attempt ? (
          <ExamRunner
            key={attempt.id}
            attemptId={attempt.id}
            juz={juz}
            questions={attempt.questions}
            expiresAt={attempt.expiresAt}
            surahNames={surahNames}
          />
        ) : status?.kind === "certified" ? (
          <div className="rounded-4xl border border-gold/50 bg-gold-mist p-8 text-center">
            <Award className="mx-auto size-12 text-gold-deep" aria-hidden />
            <h2 className="mt-4 text-2xl font-bold text-emerald-deep">اجتزت اختبار هذا الجزء</h2>
            <Link href={`/certificates/${status.certificate.verification_code}` as Route} className={buttonClass("primary", "lg", "mt-6")}>
              عرض الشهادة
            </Link>
          </div>
        ) : (
          <div className="rounded-4xl border border-line bg-white p-6 shadow-soft sm:p-8">
            <h2 className="flex items-center gap-2 text-xl font-bold text-emerald-deep">
              <ListChecks className="size-5 text-gold-deep" aria-hidden /> قبل أن تبدأ
            </h2>
            <ul className="mt-4 list-disc space-y-2 ps-6 text-muted">
              {RULES.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
            <div className="mt-8">
              {status?.kind === "cooldown" ? (
                <p className="inline-flex items-center gap-2 rounded-2xl bg-rose/10 px-4 py-3 font-bold text-rose">
                  <Hourglass className="size-5" aria-hidden /> يمكنك إعادة المحاولة بعد انتهاء مدة الانتظار (
                  {toArabicDigits(settings.retry_cooldown_hours)} ساعة من آخر محاولة). راجع حفظك بالتسميع حتى ذلك الحين.
                </p>
              ) : (
                <StartExamButton juz={juz} />
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
