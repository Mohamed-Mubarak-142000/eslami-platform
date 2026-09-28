import Link from "next/link";
import type { Metadata, Route } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Lightbulb } from "lucide-react";
import { requireSession } from "@/features/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { kidsButton, kidsPanel } from "@/features/kids/ui/kidsStyles";
import { StoryPlayer } from "@/features/kids/stories/StoryPlayer";

export const metadata: Metadata = { title: "قصة" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function KidsStoryPage({ params }: PageProps<"/kids/stories/[id]">) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const { activeLearner } = await requireSession(`/kids/stories/${id}`);
  const supabase = await createSupabaseServerClient();
  const [{ data: stories }, { data: view }] = await Promise.all([
    supabase
      .from("kids_stories")
      .select("id, title, prophet, youtube_id, summary, lesson")
      .eq("published", true)
      .order("sort_order")
      .order("created_at"),
    supabase.from("story_views").select("story_id").eq("learner_id", activeLearner.id).eq("story_id", id).maybeSingle(),
  ]);
  const list = stories ?? [];
  const index = list.findIndex((story) => story.id === id);
  const story = list[index];
  if (!story) notFound();
  const next = list[index + 1];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="text-center">
        {story.prophet && <p className="text-lg font-bold text-white drop-shadow">{story.prophet}</p>}
        <h1 className="text-3xl font-extrabold text-white drop-shadow sm:text-4xl">{story.title}</h1>
      </div>

      <StoryPlayer storyId={story.id} youtubeId={story.youtube_id} title={story.title} watched={Boolean(view)} />

      {(story.summary || story.lesson) && (
        <div className={`${kidsPanel} space-y-4`}>
          {story.summary && <p className="text-lg leading-9 text-ink">{story.summary}</p>}
          {story.lesson && (
            <p className="flex items-start gap-3 rounded-3xl bg-[#fff6d8] p-4 text-lg font-bold text-[#6b4a00]">
              <Lightbulb className="mt-1 size-6 shrink-0 text-[#e0a800]" aria-hidden />
              <span>ماذا تعلّمنا؟ {story.lesson}</span>
            </p>
          )}
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/kids/stories" className={kidsButton("white")}>
          <ArrowRight aria-hidden /> كل القصص
        </Link>
        {next && (
          <Link href={`/kids/stories/${next.id}` as Route} className={kidsButton("violet")}>
            القصة التالية <ArrowLeft aria-hidden />
          </Link>
        )}
      </div>
    </div>
  );
}
