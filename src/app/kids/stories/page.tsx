import type { Metadata } from "next";
import { Clapperboard } from "lucide-react";
import { requireSession } from "@/features/auth/session";
import { kidsPanel } from "@/features/kids/ui/kidsStyles";
import { loadStories } from "@/features/kids/stories/data";
import { StoryGrid, storiesProgressLine } from "@/features/kids/stories/StoryViews";

export const metadata: Metadata = { title: "قصص الأنبياء" };

export default async function KidsStoriesPage() {
  const { activeLearner } = await requireSession("/kids/stories");
  const { stories, watched } = await loadStories(activeLearner.id);

  return (
    <div className="space-y-6">
      <div className={`${kidsPanel} text-center`}>
        <Clapperboard className="mx-auto size-12 text-[#7a5af5]" aria-hidden />
        <h1 className="mt-2 text-3xl font-extrabold text-emerald-deep sm:text-4xl">قصص الأنبياء</h1>
        <p className="mt-2 text-lg text-muted">{storiesProgressLine(stories, watched)}</p>
      </div>
      <StoryGrid stories={stories} watched={watched} basePath="/kids/stories" />
    </div>
  );
}
