/**
 * Ibtihalat, tawasheeh, duas and adhan, read from public Internet Archive collections. There's no
 * dedicated API for these like mp3quran is for recitations, so each category is a hand-picked list of
 * archive.org items; the metadata API lists their files and archive.org serves the mp3s.
 */

export type SoundCategoryKey = "ibtihalat" | "tawasheeh" | "duas" | "adhan";

export interface SoundCategory {
  key: SoundCategoryKey;
  href: `/${SoundCategoryKey}`;
  label: string;
  title: string;
  description: string;
  /** archive.org item identifiers, shown in this order. */
  collections: readonly { id: string; label: string }[];
}

export const SOUND_CATEGORIES: Record<SoundCategoryKey, SoundCategory> = {
  ibtihalat: {
    key: "ibtihalat",
    href: "/ibtihalat",
    label: "ابتهالات",
    title: "ابتهالات كبار المبتهلين",
    description: "ابتهالات نادرة بأصوات محمد عمران ونصر الدين طوبار والبهتيمي والسمكري وغيرهم.",
    collections: [
      { id: "Ebtihalet_uP_bY_mUSLEm", label: "ابتهالات نادرة" },
      { id: "2071215", label: "كبار المبتهلين في السبعينات والثمانينات" },
    ],
  },
  tawasheeh: {
    key: "tawasheeh",
    href: "/tawasheeh",
    label: "تواشيح",
    title: "تواشيح الشيخ سيد النقشبندي",
    description: "مختارات من تواشيح وابتهالات الشيخ سيد النقشبندي.",
    collections: [{ id: "Naqshabandee", label: "تواشيح النقشبندي" }],
  },
  duas: {
    key: "duas",
    href: "/duas",
    label: "أدعية",
    title: "أدعية مسموعة",
    description: "أدعية القنوت وختم القرآن بأصوات أئمة الحرمين وكبار القرّاء، وأدعية الشيخ الشعراوي.",
    collections: [
      { id: "Du3a_uP_bY_mUSLEm", label: "أدعية القنوت وختم القرآن" },
      { id: "Islamic_Tape-258_uP_bY_mUSLEm", label: "من أدعية الشيخ الشعراوي" },
    ],
  },
  adhan: {
    key: "adhan",
    href: "/adhan",
    label: "أذان",
    title: "الأذان بأصوات من العالم الإسلامي",
    description: "أذان الحرمين ومساجد العالم الإسلامي بأصوات أشهر المؤذنين.",
    collections: [{ id: "Islamic_Tape-34_uP_bY_mUSLEm", label: "مختارات من الأذان" }],
  },
};

export interface SoundTrack {
  id: string;
  title: string;
  /** Seconds; 0 when the archive doesn't say. */
  duration: number;
  url: string;
}

export interface SoundCollection {
  id: string;
  label: string;
  tracks: SoundTrack[];
}

interface RawArchiveFile {
  name: string;
  source?: string;
  format?: string;
  title?: string;
  length?: string;
}

const METADATA_URL = "https://archive.org/metadata";
const DOWNLOAD_URL = "https://archive.org/download";
const REVALIDATE_SECONDS = 60 * 60 * 24 * 30;

// Latin-1 decoded UTF-8 (Ã, Ø, Ù…): some uploads have garbled titles, so the file name is used instead.
const MOJIBAKE = /[À-ÿ]{2,}/;
const ARABIC = /[؀-ۿ]/;

function parseDuration(length: string | undefined): number {
  if (!length) return 0;
  if (length.includes(":")) return length.split(":").reduce((total, part) => total * 60 + (Number(part) || 0), 0);
  return Math.round(Number(length) || 0);
}

/** Turns an upload's title or file name into a readable Arabic title. */
export function cleanSoundTitle(file: Pick<RawArchiveFile, "name" | "title">): string {
  const fromTitle = file.title && ARABIC.test(file.title) && !MOJIBAKE.test(file.title) ? file.title : "";
  const fromName = file.name
    .split("/")
    .pop()!
    .replace(/\.mp3$/i, "");
  const raw = fromTitle || (ARABIC.test(fromName) ? fromName : file.title || fromName);
  return raw
    .replace(/_?up_by_muslem(\.ettounssi)?/gi, "")
    .replace(/www\.[^\s]+/gi, "")
    .replace(/-?\d{6,}/g, "")
    .replace(/^\s*\d{1,3}\s*[-–.)]+\s*/, "")
    .replace(/\s*[—-]?\s*ابتهال نادر\s*\.*\s*حصريًا/g, "")
    .replace(/فيديو\s+/g, "")
    .replace(/ـ+/g, "")
    .replace(/\s*(--|\/\/|\||\s-\s)\s*/g, " — ")
    .replace(/([؀-ۿ])-([؀-ۿ\d])/g, "$1 — $2")
    .replace(/[_]+/g, " ")
    .replace(/^[\s—-]+|[\s—-]+$/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

async function getCollection({ id, label }: { id: string; label: string }): Promise<SoundCollection | null> {
  try {
    const response = await fetch(`${METADATA_URL}/${id}/files`, { next: { revalidate: REVALIDATE_SECONDS } });
    if (!response.ok) return null;
    const data = (await response.json()) as { result?: RawArchiveFile[] };
    const tracks = (data.result ?? [])
      .filter((file) => file.source === "original" && /mp3/i.test(file.format ?? "") && /\.mp3$/i.test(file.name))
      .map((file) => ({
        id: `${id}/${file.name}`,
        title: cleanSoundTitle(file),
        duration: parseDuration(file.length),
        url: `${DOWNLOAD_URL}/${id}/${file.name.split("/").map(encodeURIComponent).join("/")}`,
      }))
      .filter((track) => track.title.length > 1)
      .sort((a, b) => a.id.localeCompare(b.id, "ar", { numeric: true }));
    return { id, label, tracks };
  } catch {
    return null;
  }
}

/** Every collection of a category that could be read; an unreachable one is left out. */
export async function getSoundCollections(category: SoundCategoryKey): Promise<SoundCollection[]> {
  const collections = await Promise.all(SOUND_CATEGORIES[category].collections.map(getCollection));
  return collections.filter((collection): collection is SoundCollection => collection !== null && collection.tracks.length > 0);
}
