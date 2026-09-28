import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireSession } from "@/features/auth/session";
import { loadStory } from "@/features/kids/stories/data";
import { StoryPlayer } from "@/features/kids/stories/StoryPlayer";
import { StoryFooter } from "@/features/kids/stories/StoryViews";

export const metadata: Metadata = { title: "قصة" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function KidsStoryPage({ params }: PageProps<"/kids/stories/[id]">) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const { activeLearner } = await requireSession(`/kids/stories/${id}`);
  const found = await loadStory(id, activeLearner.id);
  if (!found) notFound();
  const { story, next, watched } = found;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="text-center">
        {story.prophet && <p className="text-lg font-bold text-white drop-shadow">{story.prophet}</p>}
        <h1 className="text-3xl font-extrabold text-white drop-shadow sm:text-4xl">{story.title}</h1>
      </div>
      <StoryPlayer storyId={story.id} youtubeId={story.youtube_id} title={story.title} watched={watched} />
      <StoryFooter story={story} next={next} basePath="/kids/stories" />
    </div>
  );
}
