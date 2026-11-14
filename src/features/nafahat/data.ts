import "server-only";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL, isSupabaseConfigured } from "@/lib/supabase/env";
import { NAFAHAT_TAG, type Nafha } from "./shared";

const COLUMNS = "id,title,body,media_type,media_url,created_at";

/**
 * The channel's posts, oldest first (a chat reads downwards), read with the public key and cached under the
 * "nafahat" tag: publishing or deleting refreshes it (features/nafahat/actions.ts), so pages stay cheap.
 */
export async function loadNafahat(): Promise<Nafha[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/nafahat?select=${COLUMNS}&order=created_at.desc&limit=200`, {
      headers: { apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}` },
      next: { revalidate: 3600, tags: [NAFAHAT_TAG] },
    });
    return response.ok ? ((await response.json()) as Nafha[]).reverse() : [];
  } catch {
    return [];
  }
}
