import { SurahReaderPage, surahReaderMetadata } from "@/features/quran/SurahReaderPage";

export const revalidate = 604800;

/** Rendered on first visit and cached; none at build time. */
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: PageProps<"/quran/[surah]/[page]/[until]/[wird]">) {
  return surahReaderMetadata((await params).surah);
}

/** A day's portion, `/quran/2?page=50&until=55&wird=khatma`, rewritten here (next.config.ts) so it is cached. */
export default async function SurahPortionPage({ params }: PageProps<"/quran/[surah]/[page]/[until]/[wird]">) {
  const { surah, page, until, wird } = await params;
  return <SurahReaderPage surah={surah} page={page} until={until} wird={wird} />;
}
