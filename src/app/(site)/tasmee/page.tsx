import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Mic } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { getSurahs } from "@/features/quran/api";
import { getSurahAyahs } from "@/features/quran/textApi";
import { getSurahAyahCount } from "@/features/kids/progress/surahAyahCounts";
import { TasmeePicker } from "@/features/tasmee/TasmeePicker";
import { TasmeeSession } from "@/features/tasmee/TasmeeSession";

export const metadata: Metadata = {
  title: "التسميع",
  description: "سمّع لنفسك بصوتك: تُخفى الآيات فتقرأ من حفظك، وتظهر كل كلمة وأنت تقرؤها، ونوقفك عند الخطأ ونريك الصحيح.",
  alternates: { canonical: "/tasmee" },
};

function toInt(value: string | string[] | undefined): number {
  const parsed = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(parsed) ? parsed : 0;
}

export default async function TasmeePage({ searchParams }: PageProps<"/tasmee">) {
  const params = await searchParams;
  const surahs = await getSurahs();
  const surahId = toInt(params.surah);
  const ayahCount = getSurahAyahCount(surahId);

  let session: ReactNode = null;
  let selected: { surah: number; from: number; to: number } | null = null;
  if (ayahCount > 0) {
    const from = Math.min(Math.max(toInt(params.from) || 1, 1), ayahCount);
    const to = Math.min(Math.max(toInt(params.to) || ayahCount, from), ayahCount);
    const { ayahs } = await getSurahAyahs(surahId);
    const range = ayahs.filter((ayah) => ayah.numberInSurah >= from && ayah.numberInSurah <= to);
    const surah = surahs.find((entry) => entry.id === surahId);
    selected = { surah: surahId, from, to };
    if (range.length > 0 && surah)
      session = <TasmeeSession key={`${surahId}-${from}-${to}`} surah={{ id: surah.id, name: surah.name }} ayahs={range} />;
  }

  return (
    <>
      <PageHeader
        kicker="التسميع"
        icon={<Mic className="size-4" aria-hidden />}
        title="سمّع لنفسك"
        description="اختر سورة ومقطعًا، ثم اقرأ من حفظك بصوتك: تظهر الآيات وأنت تقرؤها، وإن أخطأت نوقفك ونريك الصحيح لتكمل."
      />
      <div className="mx-auto max-w-4xl space-y-8 px-4 py-10 sm:px-6">
        <TasmeePicker
          surahs={surahs.map((surah) => ({ id: surah.id, name: surah.name, ayahCount: getSurahAyahCount(surah.id) }))}
          selected={selected}
        />
        {session ??
          (surahId > 0 && (
            <p className="rounded-3xl border border-line bg-white p-6 text-center text-muted">
              تعذّر تحميل هذه السورة الآن، حاول مرة أخرى.
            </p>
          ))}
      </div>
    </>
  );
}
