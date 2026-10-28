import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Milestone } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { SeerahChapter } from "@/features/seerah/SeerahChapter";
import { CHAPTERS, eventById } from "@/features/seerah/seerahContent";

export function generateStaticParams() {
  return CHAPTERS.map((chapter) => ({ event: chapter.id }));
}

export async function generateMetadata({ params }: PageProps<"/seerah/[event]">): Promise<Metadata> {
  const event = eventById((await params).event);
  return event
    ? { title: `${event.title} — السيرة النبوية`, description: event.summary, alternates: { canonical: `/seerah/${event.id}` } }
    : {};
}

export default async function SeerahChapterPage({ params }: PageProps<"/seerah/[event]">) {
  const event = eventById((await params).event);
  if (!event || event.beats.length === 0) notFound();

  return (
    <>
      <PageHeader kicker={event.date} icon={<Milestone className="size-4" aria-hidden />} title={event.title} description={event.summary} />
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SeerahChapter event={event} />
      </div>
    </>
  );
}
