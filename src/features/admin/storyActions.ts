"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/features/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { FormState } from "@/features/auth/actions";
import { parseYoutubeId } from "@/features/kids/stories/youtube";

const FAILED = "تعذّر تنفيذ العملية.";

const storySchema = z.object({
  video: z.string().trim().min(1, "الصق رابط الفيديو"),
  title: z.string().trim().min(2, "اكتب عنوان القصة").max(120, "العنوان طويل جدًا"),
  prophet: z.string().trim().max(40, "الاسم طويل جدًا"),
  summary: z.string().trim().max(500, "النبذة ٥٠٠ حرف بحد أقصى"),
  lesson: z.string().trim().max(300, "الدرس ٣٠٠ حرف بحد أقصى"),
  sort_order: z.coerce.number().int().min(0).max(9999),
});

function revalidateStories() {
  revalidatePath("/admin/stories");
  revalidatePath("/stories", "layout");
  revalidatePath("/kids/stories", "layout");
}

export async function createStoryAction(_: FormState | undefined, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = storySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
    return { fieldErrors };
  }
  const youtubeId = parseYoutubeId(parsed.data.video);
  if (!youtubeId) return { fieldErrors: { video: "رابط يوتيوب غير صحيح" } };

  // Embedding can be disabled per video; oEmbed answers 401/403/404 for those.
  const check = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${youtubeId}&format=json`, {
    cache: "no-store",
  }).catch(() => null);
  if (check && !check.ok) return { fieldErrors: { video: "هذا الفيديو غير متاح للعرض داخل المواقع." } };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("kids_stories").insert({
    youtube_id: youtubeId,
    title: parsed.data.title,
    prophet: parsed.data.prophet || null,
    summary: parsed.data.summary,
    lesson: parsed.data.lesson,
    sort_order: parsed.data.sort_order,
    published: formData.get("published") === "on",
  });
  if (error) return { error: error.code === "23505" ? "هذا الفيديو مضاف بالفعل." : FAILED };
  revalidateStories();
  return { message: "أُضيفت القصة." };
}

export async function setStoryPublishedAction(storyId: string, published: boolean): Promise<FormState> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("kids_stories").update({ published }).eq("id", storyId);
  if (error) return { error: FAILED };
  revalidateStories();
  return { message: published ? "ظهرت القصة للأطفال." : "أُخفيت القصة." };
}

export async function deleteStoryAction(storyId: string): Promise<FormState> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("kids_stories").delete().eq("id", storyId);
  if (error) return { error: FAILED };
  revalidateStories();
  return { message: "حُذفت القصة." };
}
