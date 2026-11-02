import { SurahReaderPage, surahReaderMetadata } from "@/features/quran/SurahReaderPage";

export const revalidate = 604800;

/** Rendered on first visit and cached; none at build time. */
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: PageProps<"/quran/[surah]">) {
  return surahReaderMetadata((await params).surah);
}

/** The mushaf opened where the surah begins (`?page=` links are rewritten to the routes below). */
export default async function SurahPage({ params }: PageProps<"/quran/[surah]">) {
  return <SurahReaderPage surah={(await params).surah} />;
}
