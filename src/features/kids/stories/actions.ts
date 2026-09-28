"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession } from "@/features/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Records that the selected child finished a story (idempotent). */
export async function markStoryWatchedAction(storyId: string): Promise<{ ok: boolean }> {
  if (!z.string().uuid().safeParse(storyId).success) return { ok: false };
  const session = await getSession();
  if (!session || session.activeLearner.kind !== "child") return { ok: false };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("story_views")
    .upsert({ learner_id: session.activeLearner.id, story_id: storyId, watched_at: new Date().toISOString() });
  if (error) return { ok: false };
  revalidatePath("/kids/stories");
  return { ok: true };
}
