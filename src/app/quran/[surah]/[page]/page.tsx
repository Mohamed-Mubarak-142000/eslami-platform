import { SurahReaderPage, surahReaderMetadata } from "@/features/quran/SurahReaderPage";

export const revalidate = 604800;

/** Rendered on first visit and cached; none at build time. */
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: PageProps<"/quran/[surah]/[page]">) {
  return surahReaderMetadata((await params).surah);
}

/** `/quran/2?page=50`, rewritten here (next.config.ts) so each page is cached. */
export default async function SurahAtPage({ params }: PageProps<"/quran/[surah]/[page]">) {
  const { surah, page } = await params;
  return <SurahReaderPage surah={surah} page={page} />;
}
