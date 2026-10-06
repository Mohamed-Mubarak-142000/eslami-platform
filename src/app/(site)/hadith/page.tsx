import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import { ArrowLeft, ScrollText, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { AdSlot } from "@/components/ads/AdSlot";
import { toArabicDigits } from "@/lib/arabic";
import { buttonClass } from "@/components/ui/button";
import { getCategories, getHadithOfTheDay } from "@/features/hadith/api";
import { HadithPanel, HadithText } from "@/features/hadith/HadithView";
import { planDay } from "@/features/plan/schedule";

export const metadata: Metadata = {
  title: "الأحاديث النبوية",
  description: "أحاديث نبوية مع شرحها وفوائدها ودرجتها، مرتّبة حسب الموضوع، وحديث جديد كل يوم.",
  alternates: { canonical: "/hadith" },
};

export const revalidate = 3600;

export default async function HadithIndexPage() {
  const [categories, daily] = await Promise.all([getCategories(), getHadithOfTheDay(planDay())]);
  const roots = categories.filter((category) => category.parentId === null);
  const childrenOf = (id: string) => categories.filter((category) => category.parentId === id);

  return (
    <>
      <PageHeader
        kicker="السنة النبوية"
        icon={<ScrollText className="size-4" aria-hidden />}
        title="الأحاديث النبوية"
        description="أحاديث نبوية صحيحة مع شرحها وفوائدها ودرجتها، مرتّبة حسب الموضوع."
      />
      <div className="mx-auto max-w-6xl space-y-12 px-4 py-10 sm:px-6">
        {daily && (
          <HadithPanel title="حديث اليوم" icon={<Sparkles className="size-5" aria-hidden />}>
            <h3 className="mb-3 text-sm font-bold text-gold-deep">{daily.title}</h3>
            <HadithText text={daily.text} className="line-clamp-6" />
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm text-muted">
                {daily.attribution}
                {daily.grade && ` — ${daily.grade}`}
              </span>
              <Link href={`/hadith/${daily.id}` as Route} className={buttonClass("primary", "sm")}>
                اقرأ الشرح <ArrowLeft aria-hidden />
              </Link>
            </div>
          </HadithPanel>
        )}

        <AdSlot className="px-0 sm:px-0" />

        {roots.length === 0 ? (
          <p className="rounded-3xl border border-line bg-white p-6 text-center text-muted">تعذّر تحميل الأحاديث الآن، حاول بعد قليل.</p>
        ) : (
          <section aria-labelledby="topics-heading">
            <h2 id="topics-heading" className="text-2xl font-bold text-emerald-deep">
              الموضوعات
            </h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {roots.map((root) => {
                const children = childrenOf(root.id);
                return (
                  <div key={root.id} className="rounded-4xl border border-line bg-white p-5 shadow-soft">
                    <Link href={`/hadith/category/${root.id}` as Route} className="group flex items-center justify-between gap-3">
                      <span className="text-xl font-bold text-emerald-deep group-hover:underline">{root.title}</span>
                      <span className="rounded-full bg-gold-mist px-3 py-1 text-sm font-bold text-gold-deep">
                        {toArabicDigits(root.count)} حديث
                      </span>
                    </Link>
                    {children.length > 0 && (
                      <ul className="mt-4 flex flex-wrap gap-2">
                        {children.map((child) => (
                          <li key={child.id}>
                            <Link
                              href={`/hadith/category/${child.id}` as Route}
                              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-ivory px-3 py-1.5 text-sm font-bold text-ink hover:border-emerald/40 hover:text-emerald-deep"
                            >
                              {child.title}
                              <span className="text-xs font-normal text-muted">{toArabicDigits(child.count)}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <p className="text-center text-sm text-muted">الأحاديث وشروحها من «موسوعة الأحاديث النبوية» (HadeethEnc.com).</p>
      </div>
    </>
  );
}
