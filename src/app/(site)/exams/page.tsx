import Link from "next/link";
import type { Metadata, Route } from "next";
import { Award, Clock, GraduationCap, Hourglass, PlayCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import { toArabicDigits } from "@/lib/arabic";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireSession } from "@/features/auth/session";
import { getExamOverview, getExamSettings, type JuzExamStatus } from "@/features/exams/data";
import { LearnerSwitcher } from "@/features/account/LearnerSwitcher";

export const metadata: Metadata = { title: "اختبارات الأجزاء", robots: { index: false } };

function StatusLine({ status }: { status: JuzExamStatus }) {
  switch (status.kind) {
    case "certified":
      return (
        <span className="inline-flex items-center gap-1 text-gold-deep">
          <Award className="size-4" aria-hidden /> حاصل على الشهادة
        </span>
      );
    case "in-progress":
      return (
        <span className="inline-flex items-center gap-1 text-emerald">
          <PlayCircle className="size-4" aria-hidden /> اختبار جارٍ — أكمله
        </span>
      );
    case "cooldown":
      return (
        <span className="inline-flex items-center gap-1 text-rose">
          <Hourglass className="size-4" aria-hidden /> إعادة المحاولة لاحقًا
        </span>
      );
    default:
      return (
        <span className="text-muted">
          {status.lastScore !== null && status.total
            ? `آخر درجة ${toArabicDigits(status.lastScore)}/${toArabicDigits(status.total)}`
            : "متاح"}
        </span>
      );
  }
}

export default async function ExamsPage() {
  const session = await requireSession("/exams");
  const settings = await getExamSettings();
  const overview = await getExamOverview(session.activeLearner.id, settings.retry_cooldown_hours);
  const certified = Object.values(overview).filter((status) => status.kind === "certified").length;

  return (
    <>
      <PageHeader
        kicker="اختبارات الأجزاء"
        icon={<GraduationCap className="size-4" aria-hidden />}
        title="اختبر حفظك واحصل على الشهادة"
        description={`لكل جزء اختبار حفظ من ${toArabicDigits(settings.exam_question_count)} سؤالًا في ${toArabicDigits(settings.exam_minutes)} دقيقة، يتولّد ويُصحَّح آليًا. تنجح بـ ${toArabicDigits(settings.exam_pass_percent)}٪ فتصدر لك شهادة اجتياز باسمك.`}
        actions={<LearnerSwitcher />}
      />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <p className="mb-6 flex items-center gap-2 text-sm font-bold text-muted">
          <Clock className="size-4" aria-hidden /> حصلت على {toArabicDigits(certified)} من ٣٠ شهادة
          {settings.retry_cooldown_hours > 0 &&
            ` · عند عدم النجاح تُعاد المحاولة بعد ${toArabicDigits(settings.retry_cooldown_hours)} ساعة`}
        </p>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 30 }, (_, i) => i + 1).map((juz) => {
            const status = overview[juz]!;
            const href = (status.kind === "certified" ? `/certificates/${status.certificate.verification_code}` : `/exams/${juz}`) as Route;
            return (
              <li key={juz}>
                <Link
                  href={href}
                  className={cn(
                    "flex h-full flex-col gap-2 rounded-3xl border p-4 text-sm font-bold transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-lift",
                    status.kind === "certified" ? "border-gold/60 bg-linear-to-br from-gold-mist to-white" : "border-line bg-white",
                  )}
                >
                  <span className="font-display text-lg text-emerald-deep">الجزء {toArabicDigits(juz)}</span>
                  <StatusLine status={status} />
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}
