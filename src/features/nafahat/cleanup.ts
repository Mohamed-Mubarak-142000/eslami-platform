import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { NAFAHAT_BUCKET } from "./shared";

const CHUNK = 100;
const PAGE = 1000;

/** 00:00 UTC on the first day of the current month. */
export function startOfMonth(now = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

/**
 * Deletes every nafha published before `cutoff` (their reactions go with them, on delete cascade), their media
 * files, and any file left in the bucket from before `cutoff` that no remaining nafha uses (an upload the admin
 * never published).
 */
export async function cleanupNafahat(cutoff: Date, dryRun = false): Promise<{ deleted: number; filesRemoved: number }> {
  const admin = createSupabaseAdminClient();
  const storage = admin.storage.from(NAFAHAT_BUCKET);
  const before = cutoff.toISOString();

  const old: { id: string; media_path: string | null }[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await admin
      .from("nafahat")
      .select("id, media_path")
      .lt("created_at", before)
      .order("created_at")
      .range(from, from + PAGE - 1);
    if (error) throw error;
    old.push(...(data ?? []));
    if (!data || data.length < PAGE) break;
  }

  // Files of the posts that stay, so the orphan sweep below never touches them.
  const { data: kept, error: keptError } = await admin.from("nafahat").select("media_path").gte("created_at", before);
  if (keptError) throw keptError;
  const inUse = new Set((kept ?? []).map((row) => row.media_path).filter(Boolean));

  const files = new Set(old.map((row) => row.media_path).filter((path): path is string => Boolean(path)));
  for (let offset = 0; ; offset += PAGE) {
    const { data, error } = await storage.list("", { limit: PAGE, offset, sortBy: { column: "created_at", order: "asc" } });
    if (error) throw error;
    for (const object of data ?? []) {
      if (object.id && object.created_at && object.created_at < before && !inUse.has(object.name)) files.add(object.name);
    }
    if (!data || data.length < PAGE) break;
  }

  if (dryRun) return { deleted: old.length, filesRemoved: files.size };

  for (let index = 0; index < old.length; index += CHUNK) {
    const { error } = await admin
      .from("nafahat")
      .delete()
      .in(
        "id",
        old.slice(index, index + CHUNK).map((row) => row.id),
      );
    if (error) throw error;
  }
  const paths = [...files];
  let filesRemoved = 0;
  for (let index = 0; index < paths.length; index += CHUNK) {
    const { data, error } = await storage.remove(paths.slice(index, index + CHUNK));
    if (error) console.error("Removing nafahat files failed", error);
    filesRemoved += data?.length ?? 0;
  }
  return { deleted: old.length, filesRemoved };
}
