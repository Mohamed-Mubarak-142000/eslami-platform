import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSurahs } from "@/features/quran/api";
import { getMushafIndex, getMushafPage } from "@/features/quran/mushafPage";
import { TOTAL_PAGES } from "@/features/quran/mushafPageTypes";
import { MushafReader } from "@/features/quran/MushafReader";

export const revalidate = 86400;

function parseSurah(value: string): number | null {
  const number = Number(value);
  return Number.isInteger(number) && number >= 1 && number <= 114 ? number : null;
}

export async function generateMetadata({ params }: PageProps<"/quran/[surah]">): Promise<Metadata> {
  const number = parseSurah((await params).surah);
  if (!number) return {};
  const surahs = await getSurahs();
  const name = surahs.find((surah) => surah.id === number)?.name ?? String(number);
  return {
    title: `سورة ${name}`,
    description: `اقرأ سورة ${name} في مصحف مصفّح بالرسم العثماني مع التفسير الميسّر وألوان التجويد.`,
    alternates: { canonical: `/quran/${number}` },
  };
}

/**
 * The mushaf opened at a page: `?page=` when given (khatma, plan and last-read links carry it),
 * otherwise where the surah begins. From there the reader turns through all 604 pages — or, with
 * `?until=&wird=`, only through the day's portion.
 */
export default async function SurahPage({ params, searchParams }: PageProps<"/quran/[surah]">) {
  const number = parseSurah((await params).surah);
  if (!number) notFound();
  const query = await searchParams;
  const pageParam = Number(Array.isArray(query.page) ? query.page[0] : query.page);
  // An old link's `?riwaya=` is ignored: the mushaf is Hafs 'an 'Asim.
  const index = await getMushafIndex();
  const surahStart = index?.surahs[number - 1]?.startPage ?? 1;
  const page = Number.isInteger(pageParam) && pageParam >= 1 && pageParam <= TOTAL_PAGES ? pageParam : surahStart;
  // A day's portion (khatma or plan "اقرأ الآن"): the reader keeps to pages page..until.
  const untilParam = Number(Array.isArray(query.until) ? query.until[0] : query.until);
  const wirdParam = Array.isArray(query.wird) ? query.wird[0] : query.wird;
  const portion =
    Number.isInteger(untilParam) && untilParam >= page && untilParam <= TOTAL_PAGES && (wirdParam === "khatma" || wirdParam === "plan")
      ? { from: page, to: untilParam, kind: wirdParam as "khatma" | "plan" }
      : null;
  const data = index ? await getMushafPage(page) : null;

  if (!index || !data) {
    return (
      <div className="grid min-h-dvh place-items-center p-6 text-center">
        <div>
          <p className="text-lg font-bold">تعذّر تحميل المصحف الآن، حاول بعد قليل.</p>
          <Link href="/quran" className="mt-4 inline-block text-emerald underline">
            العودة للفهرس
          </Link>
        </div>
      </div>
    );
  }

  return (
    <MushafReader
      // A link to another page starts the reader afresh.
      key={`${page}-${portion?.to ?? ""}`}
      initialPage={data}
      index={index}
      portion={portion}
    />
  );
}
