import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { getReciters, getRiwayat, getSurahs } from "@/features/quran/api";
import { ReciterPlayer } from "@/features/listen/ReciterPlayer";

export const revalidate = 86400;

async function findReciter(id: string) {
  const reciters = await getReciters();
  return reciters.find((reciter) => String(reciter.id) === id) ?? null;
}

export async function generateMetadata({ params }: PageProps<"/listen/[reciterId]">): Promise<Metadata> {
  const reciter = await findReciter((await params).reciterId);
  if (!reciter) return {};
  return {
    title: `تلاوات ${reciter.name}`,
    description: `استمع للقرآن الكريم بصوت القارئ ${reciter.name}.`,
    alternates: { canonical: `/listen/${reciter.id}` },
  };
}

export default async function ReciterPage({ params }: PageProps<"/listen/[reciterId]">) {
  const { reciterId } = await params;
  const [reciter, surahs, riwayat] = await Promise.all([findReciter(reciterId), getSurahs(), getRiwayat()]);
  if (!reciter) notFound();

  return (
    <div className="pt-8">
      <div className="mx-auto mb-6 max-w-7xl px-4 sm:px-6">
        <Link
          href="/listen"
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-bold text-muted hover:bg-emerald-mist hover:text-ink"
        >
          <ArrowRight className="size-4" aria-hidden /> كل القرّاء
        </Link>
        <h1 className="mt-2 text-3xl font-bold text-emerald-deep">تلاوات {reciter.name}</h1>
      </div>
      <ReciterPlayer reciter={reciter} surahs={surahs} riwayat={riwayat} href={`/listen/${reciter.id}`} />
    </div>
  );
}
