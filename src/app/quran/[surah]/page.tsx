import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSurahs } from "@/features/quran/api";
import { getMushafIndex, getMushafPage } from "@/features/quran/mushafPage";
import { TOTAL_PAGES } from "@/features/quran/mushafPageTypes";
import { DEFAULT_RIWAYA, findRiwaya } from "@/features/quran/riwayat";
import { MushafReader } from "@/features/quran/MushafReader";
import { riwayaFontFamily } from "@/features/quran/riwayaFonts";

export const revalidate = 86400;

const HAFS = { key: DEFAULT_RIWAYA.key, label: DEFAULT_RIWAYA.label, short: DEFAULT_RIWAYA.short };

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
 * otherwise where the surah begins. From there the reader turns through all 604 pages.
 */
export default async function SurahPage({ params, searchParams }: PageProps<"/quran/[surah]">) {
  const number = parseSurah((await params).surah);
  if (!number) notFound();
  const query = await searchParams;
  const pageParam = Number(Array.isArray(query.page) ? query.page[0] : query.page);
  const chosen = findRiwaya(Array.isArray(query.riwaya) ? query.riwaya[0] : query.riwaya);

  // If the chosen riwaya can't load, Hafs is shown instead.
  let riwaya = chosen;
  let index = await getMushafIndex(chosen.key);
  if (!index && chosen.key !== "hafs") {
    riwaya = DEFAULT_RIWAYA;
    index = await getMushafIndex("hafs");
  }
  const surahStart = index?.surahs[number - 1]?.startPage ?? 1;
  const page = Number.isInteger(pageParam) && pageParam >= 1 && pageParam <= TOTAL_PAGES ? pageParam : surahStart;
  const data = index ? await getMushafPage(riwaya.key, page) : null;

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
      // A new riwaya or a link to another page starts the reader afresh.
      key={`${riwaya.key}-${page}`}
      initialPage={data}
      index={index}
      riwaya={riwaya.key === "hafs" ? HAFS : { key: riwaya.key, label: riwaya.label, short: riwaya.short }}
      riwayaFailed={chosen.key !== riwaya.key}
      failedRiwayaLabel={chosen.label}
      riwayaFont={riwaya.key !== "hafs" ? riwayaFontFamily(riwaya.key) : null}
    />
  );
}
