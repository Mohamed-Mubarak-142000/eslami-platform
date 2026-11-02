import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSurahs } from "@/features/quran/api";
import { getMushafIndex, getMushafPage } from "@/features/quran/mushafPage";
import { TOTAL_PAGES } from "@/features/quran/mushafPageTypes";
import { MushafReader } from "@/features/quran/MushafReader";

/*
 * The reader's routes. `/quran/2?page=50` (and `&until=&wird=` for a day's portion) is rewritten in
 * next.config.ts to `/quran/2/50` (`/quran/2/50/55/khatma`), so every page is rendered once and cached
 * instead of on each visit, while the links people share keep their form. Each route revalidates weekly:
 * the text never changes, this only picks up fixes to how it is built.
 */

function parseSurah(value: string): number | null {
  const number = Number(value);
  return Number.isInteger(number) && number >= 1 && number <= 114 ? number : null;
}

export async function surahReaderMetadata(surahParam: string): Promise<Metadata> {
  const number = parseSurah(surahParam);
  if (!number) return {};
  const surahs = await getSurahs();
  const name = surahs.find((surah) => surah.id === number)?.name ?? String(number);
  return {
    title: `سورة ${name}`,
    description: `اقرأ سورة ${name} في مصحف مصفّح بالرسم العثماني مع التفسير الميسّر وألوان التجويد.`,
    alternates: { canonical: `/quran/${number}` },
  };
}

interface SurahReaderPageProps {
  surah: string;
  /** The page to open at; where the surah begins when absent or out of range. */
  page?: string;
  /** A day's portion (khatma or plan "اقرأ الآن"): the reader keeps to pages page..until. */
  until?: string;
  wird?: string;
}

/** The mushaf opened at a page, from which the reader turns through all 604 pages — or only the day's portion. */
export async function SurahReaderPage({ surah, page: pageParam, until: untilParam, wird }: SurahReaderPageProps) {
  const number = parseSurah(surah);
  if (!number) notFound();
  // An old link's `?riwaya=` is ignored: the mushaf is Hafs 'an 'Asim.
  const index = await getMushafIndex();
  const surahStart = index?.surahs[number - 1]?.startPage ?? 1;
  const asked = Number(pageParam);
  const page = Number.isInteger(asked) && asked >= 1 && asked <= TOTAL_PAGES ? asked : surahStart;
  const until = Number(untilParam);
  const portion =
    Number.isInteger(until) && until >= page && until <= TOTAL_PAGES && (wird === "khatma" || wird === "plan")
      ? { from: page, to: until, kind: wird as "khatma" | "plan" }
      : null;
  const data = index ? await getMushafPage(page) : null;

  // Thrown, not shown: a cached page must never be the failure (error.tsx tells the reader).
  if (!index || !data) throw new Error(`mushaf page ${page} could not load`);

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
