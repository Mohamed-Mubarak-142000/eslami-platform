import { Heart } from "lucide-react";
import { Divider } from "@/components/ui/Ornament";
import { SupportButton } from "@/features/support/SupportButton";
import { SUPPORTERS_TAG } from "@/features/support/supportInfo";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL, isSupabaseConfigured } from "@/lib/supabase/env";
import type { PublicSupporterRow } from "@/lib/supabase/database.types";

type Supporter = Pick<PublicSupporterRow, "id" | "name" | "message">;

/** Approved supporters (the public_supporters view), read with the public key so the home page stays static. */
async function loadSupporters(): Promise<Supporter[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/public_supporters?select=id,name,message&limit=12`, {
      headers: { apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}` },
      next: { revalidate: 600, tags: [SUPPORTERS_TAG] },
    });
    return response.ok ? ((await response.json()) as Supporter[]) : [];
  } catch {
    return [];
  }
}

/** "شكرًا لداعمي المنارة": the approved names and prayers, and the way to join them. */
export async function HomeSupporters() {
  const supporters = await loadSupporters();
  return (
    <section aria-labelledby="supporters-title" className="mx-auto max-w-6xl px-4 pb-16 pt-4 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-bold text-gold-deep">صدقة جارية</p>
        <h2 id="supporters-title" className="mt-2 text-2xl font-bold text-emerald-deep sm:text-3xl">
          {supporters.length ? "شكرًا لداعمي المنارة" : "كن أول داعمي المنارة"}
        </h2>
        <p className="mt-3 text-sm leading-7 text-muted">المنارة مجانية لكل مسلم، ويبقيها كذلك دعم أهل الخير بعد فضل الله.</p>
        <Divider className="mx-auto mt-5 max-w-xs" />
      </div>
      {supporters.length > 0 && (
        <ul className="mx-auto mt-8 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {supporters.map((supporter) => (
            <li key={supporter.id} className="rounded-3xl border border-line bg-white p-5 shadow-soft">
              <p className="flex items-center gap-2 font-bold text-emerald-deep">
                <Heart className="size-4 shrink-0 fill-gold text-gold" aria-hidden />
                <span className="truncate">{supporter.name}</span>
              </p>
              {supporter.message && <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted">{supporter.message}</p>}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-8 flex justify-center">
        <SupportButton size="lg">{supporters.length ? "كن منهم" : "ادعم المنارة"}</SupportButton>
      </div>
    </section>
  );
}
