import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type StoriesPath = "/stories" | "/kids/stories";

/** Published stories in display order, plus which of them this learner has watched. */
export async function loadStories(learnerId: string) {
  const supabase = await createSupabaseServerClient();
  const [{ data: stories }, { data: views }] = await Promise.all([
    supabase
      .from("kids_stories")
      .select("id, title, prophet, youtube_id, summary, lesson")
      .eq("published", true)
      .order("sort_order")
      .order("created_at"),
    supabase.from("story_views").select("story_id").eq("learner_id", learnerId),
  ]);
  return { stories: stories ?? [], watched: new Set((views ?? []).map((view) => view.story_id)) };
}

export type StorySummary = Awaited<ReturnType<typeof loadStories>>["stories"][number];

/** One published story with the one after it, or null when it doesn't exist or is hidden. */
export async function loadStory(id: string, learnerId: string) {
  const { stories, watched } = await loadStories(learnerId);
  const index = stories.findIndex((story) => story.id === id);
  if (index < 0) return null;
  return { story: stories[index]!, next: stories[index + 1] ?? null, watched: watched.has(id) };
}
