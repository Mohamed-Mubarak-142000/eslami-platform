import { HandHeart } from "lucide-react";
import { Divider } from "@/components/ui/Ornament";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL, isSupabaseConfigured } from "@/lib/supabase/env";
import type { SponsorRow } from "@/lib/supabase/database.types";

type Sponsor = Pick<SponsorRow, "id" | "name" | "message" | "link_url" | "logo_url">;

/** Refreshed every 10 minutes, and right away when /admin/sponsors changes something. */
export const SPONSORS_TAG = "sponsors";

/**
 * The running sponsors (RLS only returns those within their dates), read with the public key and
 * no cookies so the home page stays static. Null on any failure: the section then simply isn't there.
 */
async function loadSponsors(): Promise<Sponsor[] | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/sponsors?select=id,name,message,link_url,logo_url&order=starts_on.desc&limit=6`, {
      headers: { apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}` },
      next: { revalidate: 600, tags: [SPONSORS_TAG] },
    });
    if (!response.ok) return null;
    const sponsors = (await response.json()) as Sponsor[];
    return sponsors.length ? sponsors : null;
  } catch {
    return null;
  }
}

function SponsorCard({ sponsor }: { sponsor: Sponsor }) {
  const body = (
    <>
      {sponsor.logo_url ? (
        // A portrait frame big enough to recognise a face; it fills the frame from the top (photos are the usual upload).
        // External logos of any size; next/image would need every sponsor host allow-listed.
        <img
          src={sponsor.logo_url}
          alt={sponsor.name}
          className="h-36 w-28 shrink-0 rounded-2xl border border-line bg-white object-cover object-top sm:h-44 sm:w-36"
          loading="lazy"
        />
      ) : (
        <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-gold-mist text-gold-deep">
          <HandHeart className="size-7" aria-hidden />
        </span>
      )}
      <span className="min-w-0">
        <span className="block text-lg font-bold leading-7 text-emerald-deep">{sponsor.name}</span>
        <span className="mt-1 block text-sm leading-6 text-muted">{sponsor.message}</span>
      </span>
    </>
  );
  const className = "flex items-center gap-5 rounded-3xl border border-line bg-white p-5 shadow-soft transition-shadow sm:p-6";
  return sponsor.link_url ? (
    <a href={sponsor.link_url} target="_blank" rel="noopener sponsored" className={`${className} hover:shadow-lift`}>
      {body}
    </a>
  ) : (
    <div className={className}>{body}</div>
  );
}

/** "برعاية": the last section of the home page, right before the footer, when a sponsor is running. */
export async function HomeSponsors() {
  const sponsors = await loadSponsors();
  if (!sponsors) return null;
  return (
    <section aria-labelledby="sponsors-title" className="mx-auto max-w-6xl px-4 pb-16 pt-4 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-bold text-gold-deep">شركاء الخير</p>
        <h2 id="sponsors-title" className="mt-2 text-2xl font-bold text-emerald-deep sm:text-3xl">
          برعاية
        </h2>
        <Divider className="mx-auto mt-5 max-w-xs" />
      </div>
      {/* Two wide cards a row at most; a single sponsor gets one wide card in the middle. */}
      <div className={`mx-auto mt-8 grid gap-5 ${sponsors.length === 1 ? "max-w-2xl" : "max-w-5xl md:grid-cols-2"}`}>
        {sponsors.map((sponsor) => (
          <SponsorCard key={sponsor.id} sponsor={sponsor} />
        ))}
      </div>
    </section>
  );
}
