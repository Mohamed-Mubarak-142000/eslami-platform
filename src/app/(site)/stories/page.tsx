import type { Metadata } from "next";
import { Clapperboard } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireSession } from "@/features/auth/session";
import { loadStories } from "@/features/kids/stories/data";
import { StoryGrid, storiesProgressLine } from "@/features/kids/stories/StoryViews";

export const metadata: Metadata = { title: "قصص الأنبياء", robots: { index: false } };

export default async function StoriesPage() {
  const { activeLearner } = await requireSession("/stories");
  const { stories, watched } = await loadStories(activeLearner.id);

  return (
    <>
      <PageHeader
        kicker="القصص"
        icon={<Clapperboard className="size-4" aria-hidden />}
        title="قصص الأنبياء"
        description={storiesProgressLine(stories, watched)}
      />
      <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
        <StoryGrid stories={stories} watched={watched} basePath="/stories" />
      </div>
    </>
  );
}
