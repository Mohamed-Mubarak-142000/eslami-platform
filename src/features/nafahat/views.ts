"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * "Who saw it": a signed-in reader is recorded once per post (table nafahat_views, insert-own RLS) the first
 * time it is on their screen, in the channel or the dialog. Batched, and each id sent once per page load.
 */
const sent = new Set<string>();
let pending = new Set<string>();
let timer: ReturnType<typeof setTimeout> | null = null;

export function recordNafhaViews(ids: string[]) {
  for (const id of ids) if (!sent.has(id)) pending.add(id);
  if (!pending.size || timer) return;
  timer = setTimeout(() => {
    timer = null;
    const batch = [...pending];
    pending = new Set();
    batch.forEach((id) => sent.add(id));
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    void supabase
      .from("nafahat_views")
      .upsert(
        batch.map((nafha_id) => ({ nafha_id })),
        { onConflict: "nafha_id,user_id", ignoreDuplicates: true },
      )
      .then(({ error }) => {
        // Not signed in, or offline: let a later sighting try again.
        if (error) batch.forEach((id) => sent.delete(id));
      });
  }, 800);
}
