import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ScrollText } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { buttonClass } from "@/components/ui/button";
import { toArabicDigits } from "@/lib/arabic";
import { getCategories, getCategoryHadiths, getHadith, HADITHS_PER_PAGE } from "./api";
import { HadithView } from "./HadithView";

/*
 * The hadith routes' pages. Their query links (`?c=`, `?page=`) are rewritten in next.config.ts to
 * path routes, so each page is rendered once and cached instead of on every visit.
 */

export async function hadithMetadata(id: string): Promise<Metadata> {
  const hadith = await getHadith(id);
  if (!hadith) return { title: "الأحاديث النبوية" };
  return { title: hadith.title.slice(0, 70), description: hadith.explanation.slice(0, 160) };
}

/** One hadith; `from` is the topic list the reader came from (`?c=`, rewritten to /hadith/[id]/in/[c]). */
export async function HadithDetail({ id, from: fromParam }: { id: string; from?: string }) {
  const [hadith, categories] = await Promise.all([getHadith(id), getCategories()]);
  if (!hadith) notFound();
  // Back to the list the reader came from, else the hadith's first topic.
  const from = fromParam ?? hadith.categoryIds[0];
  const category = categories.find((entry) => entry.id === from);

  return (
    <>
      <PageHeader
        kicker={category?.title ?? "الأحاديث النبوية"}
        icon={<ScrollText className="size-4" aria-hidden />}
        title={hadith.title}
      />
      <div className="mx-auto max-w-4xl space-y-8 px-4 py-10 sm:px-6">
        <Link
          href={(category ? `/hadith/category/${category.id}` : "/hadith") as Route}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald hover:underline"
        >
          <ArrowRight className="size-4" aria-hidden /> {category ? `أحاديث ${category.title}` : "كل الأحاديث"}
        </Link>
        <HadithView hadith={hadith} />
      </div>
    </>
  );
}

async function findCategory(id: string) {
  const categories = await getCategories();
  const category = categories.find((entry) => entry.id === id);
  return { category, parent: categories.find((entry) => entry.id === category?.parentId), categories };
}

export async function categoryMetadata(id: string): Promise<Metadata> {
  const { category } = await findCategory(id);
  return { title: category ? `أحاديث ${category.title}` : "الأحاديث النبوية" };
}

/** A topic's hadiths, a page at a time (`?page=`, rewritten to /hadith/category/[id]/p/[page]). */
export async function HadithCategoryList({ id, page: pageParam }: { id: string; page?: string }) {
  const page = Math.max(1, Number(pageParam) || 1);
  const [{ category, parent, categories }, list] = await Promise.all([findCategory(id), getCategoryHadiths(id, page)]);
  if (!category && categories.length > 0) notFound();
  const children = categories.filter((entry) => entry.parentId === id);
  const pageHref = (number: number) => `/hadith/category/${id}${number > 1 ? `?page=${number}` : ""}` as Route;

  return (
    <>
      <PageHeader
        kicker={parent ? parent.title : "الأحاديث النبوية"}
        icon={<ScrollText className="size-4" aria-hidden />}
        title={category?.title ?? "الأحاديث"}
        {...(list.total > 0 && { description: `${toArabicDigits(list.total)} حديث مع الشرح والفوائد.` })}
      />
      <div className="mx-auto max-w-4xl space-y-8 px-4 py-10 sm:px-6">
        <nav aria-label="مسار التصفح" className="flex flex-wrap items-center gap-2 text-sm">
          <Link href="/hadith" className="font-bold text-emerald hover:underline">
            الأحاديث
          </Link>
          {parent && (
            <>
              <span className="text-muted">/</span>
              <Link href={`/hadith/category/${parent.id}` as Route} className="font-bold text-emerald hover:underline">
                {parent.title}
              </Link>
            </>
          )}
          <span className="text-muted">/</span>
          <span className="text-muted">{category?.title}</span>
        </nav>

        {children.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {children.map((child) => (
              <li key={child.id}>
                <Link
                  href={`/hadith/category/${child.id}` as Route}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-sm font-bold text-ink hover:border-emerald/40"
                >
                  {child.title} <span className="text-xs font-normal text-muted">{toArabicDigits(child.count)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {list.items.length === 0 ? (
          <p className="rounded-3xl border border-line bg-white p-6 text-center text-muted">تعذّر تحميل الأحاديث الآن، حاول بعد قليل.</p>
        ) : (
          <ol className="space-y-3" start={(list.page - 1) * HADITHS_PER_PAGE + 1}>
            {list.items.map((item, index) => (
              <li key={item.id}>
                <Link
                  href={`/hadith/${item.id}?c=${id}` as Route}
                  className="flex items-start gap-4 rounded-3xl border border-line bg-white p-4 transition-shadow hover:shadow-lift sm:p-5"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gold-mist font-display text-sm font-bold text-gold-deep">
                    {toArabicDigits((list.page - 1) * HADITHS_PER_PAGE + index + 1)}
                  </span>
                  <span className="flex-1 text-lg leading-9 text-ink">{item.title}</span>
                  <ArrowLeft className="mt-2 size-4 shrink-0 text-muted" aria-hidden />
                </Link>
              </li>
            ))}
          </ol>
        )}

        {list.lastPage > 1 && (
          <nav aria-label="الصفحات" className="flex items-center justify-between gap-3">
            {list.page > 1 ? (
              <Link href={pageHref(list.page - 1)} className={buttonClass("outline", "sm")}>
                <ArrowRight aria-hidden /> السابق
              </Link>
            ) : (
              <span />
            )}
            <span className="text-sm text-muted">
              صفحة {toArabicDigits(list.page)} من {toArabicDigits(list.lastPage)}
            </span>
            {list.page < list.lastPage ? (
              <Link href={pageHref(list.page + 1)} className={buttonClass("outline", "sm")}>
                التالي <ArrowLeft aria-hidden />
              </Link>
            ) : (
              <span />
            )}
          </nav>
        )}
      </div>
    </>
  );
}
