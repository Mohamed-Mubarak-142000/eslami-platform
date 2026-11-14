"use server";

import { after } from "next/server";
import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/features/auth/session";
import type { FormState } from "@/features/auth/actions";
import { sendPushToAll } from "@/lib/push/expo";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { NafhaEmoji } from "@/lib/supabase/database.types";
import { NAFAHAT_BUCKET, NAFAHAT_MEDIA_TYPES, NAFAHAT_PATH, NAFAHAT_TAG, NAFAHAT_TITLE } from "./shared";

const FAILED = "تعذّر تنفيذ العملية.";

const nafhaSchema = z.object({
  title: z.string().trim().min(2, "اكتب عنوان النفحة").max(120, "العنوان ١٢٠ حرفًا بحد أقصى"),
  body: z.string().trim().max(4000, "الوصف ٤٠٠٠ حرف بحد أقصى"),
  media_path: z.string().trim(),
});

function revalidateNafahat() {
  revalidatePath("/admin/nafahat");
  revalidatePath("/nafahat");
  updateTag(NAFAHAT_TAG);
}

async function removeMedia(path: string | null) {
  if (!path) return;
  await createSupabaseAdminClient().storage.from(NAFAHAT_BUCKET).remove([path]);
}

/**
 * Publishes a nafha. The media file (if any) was already uploaded by the admin's browser straight to the
 * "nafahat" bucket (features/nafahat/NafhaComposer.tsx); here it is checked, then the row is saved and a
 * push goes to every registered device after the response.
 */
export async function createNafhaAction(_: FormState | undefined, formData: FormData): Promise<FormState> {
  const session = await requireAdmin();
  const parsed = nafhaSchema.safeParse({
    title: formData.get("title") ?? "",
    body: formData.get("body") ?? "",
    media_path: formData.get("media_path") ?? "",
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
    return { fieldErrors };
  }

  const { title, body, media_path: mediaPath } = parsed.data;
  let media: { media_type: "image" | "video"; media_url: string; media_path: string } | null = null;
  if (mediaPath) {
    if (!NAFAHAT_PATH.test(mediaPath)) return { fieldErrors: { media: "الملف غير صالح، ارفعه مرة أخرى." } };
    const storage = createSupabaseAdminClient().storage.from(NAFAHAT_BUCKET);
    const { data: exists } = await storage.exists(mediaPath);
    if (!exists) return { fieldErrors: { media: "لم يكتمل رفع الملف، ارفعه مرة أخرى." } };
    const ext = mediaPath.split(".").pop();
    const kind = Object.values(NAFAHAT_MEDIA_TYPES).find((type) => type.ext === ext)?.kind ?? "image";
    media = { media_type: kind, media_url: storage.getPublicUrl(mediaPath).data.publicUrl, media_path: mediaPath };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("nafahat").insert({
    title,
    body: body || null,
    created_by: session.userId,
    ...(media ?? {}),
  });
  if (error) {
    console.error("Saving nafha failed", error);
    await removeMedia(media?.media_path ?? null);
    return { error: FAILED };
  }

  revalidateNafahat();
  after(async () => {
    const result = await sendPushToAll({ title: NAFAHAT_TITLE, body: title, url: "/nafahat" });
    console.info("Nafha push", result);
  });
  return { message: "نُشرت النفحة، وتظهر الآن لكل المستخدمين في الموقع والتطبيق." };
}

/** Deletes a nafha, its reactions (cascade) and its media file. */
export async function deleteNafhaAction(nafhaId: string): Promise<FormState> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("nafahat").delete().eq("id", nafhaId).select("media_path").maybeSingle();
  if (error) return { error: FAILED };
  await removeMedia(data?.media_path ?? null);
  revalidateNafahat();
  return { message: "حُذفت النفحة." };
}

/** Removes a file the composer uploaded but did not publish (the admin cleared it or picked another). */
export async function discardNafhaUploadAction(mediaPath: string): Promise<void> {
  await requireAdmin();
  if (!NAFAHAT_PATH.test(mediaPath)) return;
  const { count } = await createSupabaseAdminClient()
    .from("nafahat")
    .select("id", { count: "exact", head: true })
    .eq("media_path", mediaPath);
  if (!count) await removeMedia(mediaPath);
}

export interface Reactor {
  userId: string;
  name: string;
  email: string | null;
  emoji: NafhaEmoji;
  at: string;
}

const REACTORS_PAGE = 50;

/** Who reacted to a nafha, newest first, 50 per page (admins only). */
export async function getNafhaReactorsAction(
  nafhaId: string,
  page: number,
  emoji: NafhaEmoji | null,
): Promise<{ reactors: Reactor[]; more: boolean } | { error: string }> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const from = Math.max(0, Math.floor(page)) * REACTORS_PAGE;
  let query = supabase
    .from("nafahat_reactions")
    .select("user_id, emoji, created_at")
    .eq("nafha_id", nafhaId)
    .order("created_at", { ascending: false })
    .range(from, from + REACTORS_PAGE); // one extra row tells whether there is a next page
  if (emoji) query = query.eq("emoji", emoji);
  const { data: rows, error } = await query;
  if (error) return { error: FAILED };

  const pageRows = (rows ?? []).slice(0, REACTORS_PAGE);
  const ids = pageRows.map((row) => row.user_id);
  const { data: profiles } = ids.length ? await supabase.from("profiles").select("id, full_name, email").in("id", ids) : { data: [] };
  const byId = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

  return {
    reactors: pageRows.map((row) => {
      const profile = byId.get(row.user_id);
      return {
        userId: row.user_id,
        name: profile?.full_name || "مستخدم بدون اسم",
        email: profile?.email ?? null,
        emoji: row.emoji,
        at: row.created_at,
      };
    }),
    more: (rows?.length ?? 0) > REACTORS_PAGE,
  };
}
