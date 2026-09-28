import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Clapperboard } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireSession } from "@/features/auth/session";
import { loadStory } from "@/features/kids/stories/data";
import { StoryPlayer } from "@/features/kids/stories/StoryPlayer";
import { StoryFooter } from "@/features/kids/stories/StoryViews";

export const metadata: Metadata = { title: "قصة", robots: { index: false } };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function StoryPage({ params }: PageProps<"/stories/[id]">) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const { activeLearner } = await requireSession(`/stories/${id}`);
  const found = await loadStory(id, activeLearner.id);
  if (!found) notFound();
  const { story, next, watched } = found;

  return (
    <>
      <PageHeader kicker={story.prophet ?? "القصص"} icon={<Clapperboard className="size-4" aria-hidden />} title={story.title} />
      <div className="mx-auto max-w-4xl space-y-6 px-4 pt-10 sm:px-6">
        <StoryPlayer storyId={story.id} youtubeId={story.youtube_id} title={story.title} watched={watched} />
        <StoryFooter story={story} next={next} basePath="/stories" />
      </div>
    </>
  );
}
