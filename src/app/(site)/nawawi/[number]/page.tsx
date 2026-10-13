import Link from "next/link";
import type { Metadata, Route } from "next";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight, ExternalLink, Lightbulb, ScrollText } from "lucide-react";
import { toArabicDigits } from "@/lib/arabic";
import { buttonClass } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/PageHeader";
import { NAWAWI, narratorLine } from "@/features/nawawi/nawawiData";

export function generateStaticParams() {
  return NAWAWI.map((hadith) => ({ number: String(hadith.number) }));
}

function find(raw: string) {
  return NAWAWI.find((hadith) => String(hadith.number) === raw);
}

export async function generateMetadata({ params }: PageProps<"/nawawi/[number]">): Promise<Metadata> {
  const hadith = find((await params).number);
  if (!hadith) return { title: "حديث غير موجود" };
  return {
    title: `الحديث ${toArabicDigits(hadith.number)} من الأربعين النووية: ${hadith.title}`,
    description: hadith.explanation.slice(0, 160),
    alternates: { canonical: `/nawawi/${hadith.number}` },
  };
}

export default async function NawawiHadithPage({ params }: PageProps<"/nawawi/[number]">) {
  const hadith = find((await params).number);
  if (!hadith) notFound();
  const previous = NAWAWI.find((entry) => entry.number === hadith.number - 1);
  const next = NAWAWI.find((entry) => entry.number === hadith.number + 1);

  return (
    <>
      <PageHeader
        kicker={`الأربعون النووية · الحديث ${toArabicDigits(hadith.number)}`}
        icon={<ScrollText className="size-4" aria-hidden />}
        title={hadith.title}
        description={narratorLine(hadith)}
      />
      <div className="mx-auto max-w-3xl space-y-8 px-4 py-10 sm:px-6">
        <article className="rounded-4xl border border-line bg-white p-6 shadow-soft sm:p-8">
          <p className="quran-text text-2xl leading-[2.2] text-emerald-deep">{hadith.hadith}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
            <span className="rounded-full bg-emerald-mist px-3 py-0.5 font-bold text-emerald-deep">{hadith.grade}</span>
            <span className="text-muted">{hadith.attribution}</span>
          </div>
        </article>

        <section aria-labelledby="explanation">
          <h2 id="explanation" className="text-xl font-bold text-emerald-deep">
            الشرح
          </h2>
          <div className="mt-3 space-y-3 leading-8 text-ink">
            {hadith.explanation.split(/\n+/).map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </section>

        {hadith.lessons.length > 0 && (
          <section aria-labelledby="lessons" className="rounded-4xl border border-gold/40 bg-gold-mist/60 p-6">
            <h2 id="lessons" className="flex items-center gap-2 text-xl font-bold text-emerald-deep">
              <Lightbulb className="size-5 text-gold-deep" aria-hidden /> من فوائد الحديث
            </h2>
            <ul className="mt-3 list-disc space-y-2 ps-5 leading-8 text-ink">
              {hadith.lessons.map((lesson) => (
                <li key={lesson}>{lesson}</li>
              ))}
            </ul>
          </section>
        )}

        <a
          href={hadith.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-muted underline underline-offset-4 hover:text-emerald"
        >
          الحديث في موسوعة الأحاديث النبوية <ExternalLink className="size-3.5" aria-hidden />
        </a>

        <nav aria-label="التنقل بين الأحاديث" className="flex items-center justify-between gap-3 border-t border-line pt-6">
          {previous ? (
            <Link href={`/nawawi/${previous.number}` as Route} className={buttonClass("outline", "md")}>
              <ChevronRight aria-hidden /> الحديث {toArabicDigits(previous.number)}
            </Link>
          ) : (
            <span />
          )}
          <Link href="/nawawi" className="text-sm font-bold text-muted hover:text-emerald">
            كل الأحاديث
          </Link>
          {next ? (
            <Link href={`/nawawi/${next.number}` as Route} className={buttonClass("primary", "md")}>
              الحديث {toArabicDigits(next.number)} <ChevronLeft aria-hidden />
            </Link>
          ) : (
            <span />
          )}
        </nav>
      </div>
    </>
  );
}
