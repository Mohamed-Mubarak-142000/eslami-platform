import Link from "next/link";
import type { Metadata, Route } from "next";
import { notFound } from "next/navigation";
import { Award, BookOpen, CheckCircle2, GraduationCap, ListChecks, Lock } from "lucide-react";
import { toArabicDigits } from "@/lib/arabic";
import { buttonClass } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireSession } from "@/features/auth/session";
import { getExamSettings } from "@/features/exams/data";
import { getActiveNawawiAttempt, getNawawiOverview } from "@/features/nawawi/data";
import { NawawiExamRunner } from "@/features/nawawi/NawawiExamRunner";
import { StartNawawiExamButton } from "@/features/nawawi/StartNawawiExamButton";
import { FINAL_PART, NAWAWI_PARTS, parsePartSlug, partRange, partSlug, partTitle } from "@/features/nawawi/nawawiData";
import { examSize } from "@/features/nawawi/service";

export async function generateMetadata({ params }: PageProps<"/nawawi/exam/[part]">): Promise<Metadata> {
  const part = parsePartSlug((await params).part);
  return { title: part ? `الأربعون النووية — اختبار ${partTitle(part)}` : "اختبار غير موجود", robots: { index: false } };
}

const RULES = [
  "أسئلة متنوّعة: أكمل الحديث، والكلمة الناقصة، وراوي الحديث.",
  "الأسئلة تتولّد لك وحدك من نصوص الأحاديث، وتُصحَّح على الخادم.",
  "يُسلَّم الاختبار تلقائيًا عند انتهاء الوقت.",
];

export default async function NawawiExamPage({ params }: PageProps<"/nawawi/exam/[part]">) {
  const part = parsePartSlug((await params).part);
  if (!part) notFound();
  const session = await requireSession(`/nawawi/exam/${partSlug(part)}`);
  const learner = session.activeLearner;
  const [settings, attempt] = await Promise.all([getExamSettings(), getActiveNawawiAttempt(learner.id, part)]);
  const overview = attempt ? null : await getNawawiOverview(learner.id);
  const size = examSize(part);
  const isFinal = part === FINAL_PART;
  const missingParts = isFinal ? NAWAWI_PARTS.filter((entry) => overview && overview.parts[entry.id]?.kind !== "passed") : [];
  const forWhom = learner.kind === "child" ? ` — ${learner.display_name}` : "";

  return (
    <>
      <PageHeader
        kicker="الأربعون النووية"
        icon={<GraduationCap className="size-4" aria-hidden />}
        title={`${isFinal ? partTitle(part) : `اختبار ${partTitle(part)}`}${forWhom}`}
        description={`${partRange(part)} · ${toArabicDigits(size.questions)} أسئلة · ${toArabicDigits(size.minutes)} دقيقة · النجاح ${toArabicDigits(settings.exam_pass_percent)}٪`}
      />
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        {attempt ? (
          <NawawiExamRunner
            key={attempt.id}
            attemptId={attempt.id}
            part={part}
            questions={attempt.questions}
            expiresAt={attempt.expiresAt}
          />
        ) : isFinal && overview?.certificate ? (
          <div className="rounded-4xl border border-gold/50 bg-gold-mist p-8 text-center">
            <Award className="mx-auto size-12 text-gold-deep" aria-hidden />
            <h2 className="mt-4 text-2xl font-bold text-emerald-deep">أتممت الأربعين النووية</h2>
            <Link
              href={`/certificates/${overview.certificate.verification_code}` as Route}
              className={buttonClass("primary", "lg", "mt-6")}
            >
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
              <li>
                {isFinal
                  ? `يُفتح بعد اجتياز المراحل الأربع، وتنال بالنجاح فيه شهادة الأربعين النووية. إن لم تنجح أعدته بعد ${toArabicDigits(settings.retry_cooldown_hours)} ساعة.`
                  : "يمكنك إعادة اختبار المرحلة متى شئت حتى تجتازها."}
              </li>
            </ul>
            <div className="mt-8">
              {missingParts.length > 0 ? (
                <div>
                  <p className="inline-flex items-center gap-2 rounded-2xl bg-gold-mist px-4 py-3 font-bold text-gold-deep">
                    <Lock className="size-5" aria-hidden /> اجتز هذه المراحل أولًا:
                  </p>
                  <ul className="mt-4 space-y-2">
                    {NAWAWI_PARTS.map((entry) => {
                      const passed = !missingParts.includes(entry);
                      return (
                        <li key={entry.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line p-4">
                          <span className="flex items-center gap-2 font-bold text-emerald-deep">
                            {passed ? (
                              <CheckCircle2 className="size-5 text-emerald" aria-hidden />
                            ) : (
                              <Lock className="size-5 text-muted" aria-hidden />
                            )}
                            {entry.title} <span className="text-sm font-normal text-muted">({partRange(entry.id)})</span>
                          </span>
                          {!passed && (
                            <Link href={`/nawawi/exam/${entry.id}` as Route} className={buttonClass("outline", "sm")}>
                              اختبرها
                            </Link>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : (
                <div className="flex flex-wrap items-start gap-3">
                  <StartNawawiExamButton part={part} />
                  <Link href="/nawawi" className={buttonClass("outline", "lg")}>
                    <BookOpen aria-hidden /> راجع الأحاديث
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
