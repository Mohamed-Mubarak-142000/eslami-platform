import Link from "next/link";
import type { Metadata, Route } from "next";
import { Award, CheckCircle2, GraduationCap, Lock, PlayCircle, ScrollText } from "lucide-react";
import { cn } from "@/lib/cn";
import { toArabicDigits } from "@/lib/arabic";
import { buttonClass } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/PageHeader";
import { getSession } from "@/features/auth/session";
import { getNawawiOverview, type NawawiOverview } from "@/features/nawawi/data";
import { FINAL_PART, NAWAWI, NAWAWI_PARTS, partSlug, partTitle } from "@/features/nawawi/nawawiData";

export const metadata: Metadata = {
  title: "الأربعون النووية",
  description: "الأحاديث الأربعون النووية بشرحها وفوائدها، مع اختبار لكل مرحلة وشهادة عند إتمامها.",
  alternates: { canonical: "/nawawi" },
};

function PartExam({ part, overview, signedIn }: { part: number; overview: NawawiOverview | null; signedIn: boolean }) {
  const status = overview?.parts[part];
  const href = `/nawawi/exam/${partSlug(part)}` as Route;
  if (!signedIn) {
    return (
      <Link href={`/login?next=${encodeURIComponent(href)}` as Route} className={buttonClass("outline", "sm")}>
        <GraduationCap aria-hidden /> سجّل الدخول لتختبر
      </Link>
    );
  }
  if (status?.kind === "passed") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-mist px-3 py-1.5 text-sm font-bold text-emerald">
        <CheckCircle2 className="size-4" aria-hidden /> اجتزتها ({toArabicDigits(status.score)}/{toArabicDigits(status.total)})
      </span>
    );
  }
  return (
    <Link href={href} className={buttonClass("primary", "sm")}>
      <PlayCircle aria-hidden /> {status?.kind === "in-progress" ? "تابع الاختبار" : "اختبر هذه المرحلة"}
    </Link>
  );
}

export default async function NawawiPage() {
  const session = await getSession();
  const overview = session ? await getNawawiOverview(session.activeLearner.id).catch(() => null) : null;
  const partsPassed = NAWAWI_PARTS.filter((part) => overview?.parts[part.id]?.kind === "passed").length;
  const finalOpen = partsPassed === NAWAWI_PARTS.length;

  return (
    <>
      <PageHeader
        kicker="الأربعون النووية"
        icon={<ScrollText className="size-4" aria-hidden />}
        title="جوامع الكلم في اثنين وأربعين حديثًا"
        description="الأحاديث التي جمعها الإمام النووي رحمه الله، كل حديث بشرحه وفوائده. اقرأ مرحلة ثم اختبر نفسك فيها، وأتمّ المراحل الأربع لتدخل الاختبار النهائي وتنال الشهادة."
      />
      <div className="mx-auto max-w-5xl space-y-10 px-4 py-10 sm:px-6">
        <section
          aria-labelledby="nawawi-final"
          className="flex flex-wrap items-center justify-between gap-4 rounded-4xl bg-emerald-deep p-6 text-white shadow-lift"
        >
          <div>
            <h2 id="nawawi-final" className="flex items-center gap-2 text-xl font-bold">
              <Award className="size-6 text-gold" aria-hidden /> {partTitle(FINAL_PART)} والشهادة
            </h2>
            <p className="mt-1 text-sm text-white/75">
              {overview?.certificate
                ? "أتممت الأربعين النووية، بارك الله فيك."
                : session
                  ? `اجتزت ${toArabicDigits(partsPassed)} من ${toArabicDigits(NAWAWI_PARTS.length)} مراحل؛ يُفتح الاختبار النهائي بعد اجتيازها كلها.`
                  : "سجّل الدخول ليُحفظ تقدّمك وتنال شهادتك."}
            </p>
          </div>
          {overview?.certificate ? (
            <Link href={`/certificates/${overview.certificate.verification_code}` as Route} className={buttonClass("gold", "md")}>
              <Award aria-hidden /> عرض الشهادة
            </Link>
          ) : finalOpen ? (
            <Link href={`/nawawi/exam/${partSlug(FINAL_PART)}` as Route} className={buttonClass("gold", "md")}>
              <GraduationCap aria-hidden /> ادخل الاختبار النهائي
            </Link>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-gold-soft">
              <Lock className="size-4" aria-hidden /> مغلق حتى تُتمّ المراحل
            </span>
          )}
        </section>

        {NAWAWI_PARTS.map((part) => (
          <section key={part.id} aria-labelledby={`part-${part.id}`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id={`part-${part.id}`} className="text-2xl font-bold text-emerald-deep">
                {part.title}{" "}
                <span className="text-base font-normal text-muted">
                  — الأحاديث {toArabicDigits(part.from)}–{toArabicDigits(part.to)}
                </span>
              </h2>
              <PartExam part={part.id} overview={overview} signedIn={Boolean(session)} />
            </div>
            <ol className="mt-4 grid gap-3 sm:grid-cols-2">
              {NAWAWI.filter((hadith) => hadith.number >= part.from && hadith.number <= part.to).map((hadith) => (
                <li key={hadith.number}>
                  <Link
                    href={`/nawawi/${hadith.number}` as Route}
                    className={cn(
                      "flex h-full items-start gap-3 rounded-3xl border border-line bg-white p-4 transition-colors hover:border-emerald/40",
                    )}
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-gold-mist font-display font-bold text-gold-deep">
                      {toArabicDigits(hadith.number)}
                    </span>
                    <span>
                      <span className="block font-bold leading-7 text-emerald-deep">{hadith.title}</span>
                      <span className="text-xs text-muted">عن {hadith.narrator}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        ))}

        <p className="text-center text-xs leading-6 text-muted">
          نصوص الأحاديث وشرحها وفوائدها من{" "}
          <a
            href="https://hadeethenc.com/ar/home"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-4 hover:text-emerald"
          >
            موسوعة الأحاديث النبوية
          </a>
          .
        </p>
      </div>
    </>
  );
}
