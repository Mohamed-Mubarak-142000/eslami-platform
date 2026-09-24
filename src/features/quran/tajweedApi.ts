export interface TajweedSegment {
  text: string;
  ruleClass: string | null;
}

export interface TajweedAyah {
  numberInSurah: number;
  segments: TajweedSegment[];
}

export interface TajweedRuleInfo {
  label: string;
  color: string;
}

export const TAJWEED_RULES: Record<string, TajweedRuleInfo> = {
  ghunnah: { label: "غنة", color: "#2f9e44" },
  idgham_ghunnah: { label: "إدغام بغنة", color: "#2f9e44" },
  idgham_wo_ghunnah: { label: "إدغام بغير غنة", color: "#37b24d" },
  idgham_shafawi: { label: "إدغام شفوي", color: "#40c057" },
  idgham_mutajanisayn: { label: "إدغام متجانسين", color: "#51cf66" },
  idgham_mutaqaribayn: { label: "إدغام متقاربين", color: "#69db7c" },
  ikhafa: { label: "إخفاء", color: "#d9822b" },
  ikhafa_shafawi: { label: "إخفاء شفوي", color: "#c2760a" },
  iqlab: { label: "إقلاب", color: "#1098ad" },
  qalaqah: { label: "قلقلة", color: "#e8590c" },
  madda_normal: { label: "مد طبيعي", color: "#e64980" },
  madda_permissible: { label: "مد جائز", color: "#e03131" },
  madda_obligatory: { label: "مد واجب", color: "#c92a2a" },
  madda_necessary: { label: "مد لازم", color: "#9c1c1c" },
  laam_shamsiyah: { label: "لام شمسية", color: "#868e96" },
  ham_wasl: { label: "همزة وصل", color: "#adb5bd" },
  slnt: { label: "حرف ساكن لا يُنطق", color: "#adb5bd" },
};

interface RawTajweedVerse {
  verse_key: string;
  text_uthmani_tajweed: string;
}

const TAJWEED_URL = "https://api.quran.com/api/v4/quran/verses/uthmani_tajweed";
const TAJWEED_REVALIDATE_SECONDS = 60 * 60 * 24 * 30;
const TAJWEED_TOKEN_PATTERN = /<tajweed class=([a-z_]+)>([^<]*)<\/tajweed>|<span class=end>[^<]*<\/span>/g;

export function parseTajweedMarkup(markup: string): TajweedSegment[] {
  const segments: TajweedSegment[] = [];
  let lastIndex = 0;
  for (const match of markup.matchAll(TAJWEED_TOKEN_PATTERN)) {
    const [fullMatch, ruleClass, ruleText] = match;
    const start = match.index ?? 0;
    if (start > lastIndex) segments.push({ text: markup.slice(lastIndex, start), ruleClass: null });
    if (ruleClass !== undefined) segments.push({ text: ruleText ?? "", ruleClass });
    lastIndex = start + fullMatch.length;
  }
  if (lastIndex < markup.length) segments.push({ text: markup.slice(lastIndex), ruleClass: null });
  return segments.filter((segment) => segment.text.length > 0);
}

export async function getSurahTajweedAyahs(surahNumber: number): Promise<TajweedAyah[]> {
  try {
    const response = await fetch(`${TAJWEED_URL}?chapter_number=${surahNumber}`, { next: { revalidate: TAJWEED_REVALIDATE_SECONDS } });
    if (!response.ok) return [];
    const data = (await response.json()) as { verses: RawTajweedVerse[] };
    return data.verses.map((verse) => {
      const numberInSurah = Number.parseInt(verse.verse_key.split(":")[1] ?? "0", 10);
      return { numberInSurah, segments: parseTajweedMarkup(verse.text_uthmani_tajweed) };
    });
  } catch {
    return [];
  }
}
