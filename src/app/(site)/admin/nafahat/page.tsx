import type { Metadata } from "next";
import Link from "next/link";
import { Film, ImageIcon, Type } from "lucide-react";
import { requireAdmin } from "@/features/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DeleteNafhaButton, ReactorsButton } from "@/features/nafahat/AdminNafhaControls";
import { NafhaComposer } from "@/features/nafahat/NafhaComposer";
import { NAFAHAT_TITLE, formatNafhaDate, type ReactionCounts } from "@/features/nafahat/shared";

export const metadata: Metadata = { title: NAFAHAT_TITLE };

/** Post to the read-only "نفحات المنارة" channel, and see who reacted to each post. */
export default async function AdminNafahatPage() {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const [{ data }, { data: countRows }, { data: viewRows }] = await Promise.all([
    supabase.from("nafahat").select("id, title, body, media_type, created_at").order("created_at", { ascending: false }),
    supabase.from("nafahat_reaction_counts").select("nafha_id, emoji, count"),
    supabase.from("nafahat_views").select("nafha_id"),
  ]);
  const list = data ?? [];
  const counts: Record<string, ReactionCounts> = {};
  for (const row of countRows ?? []) (counts[row.nafha_id] ??= {})[row.emoji] = row.count;
  const views: Record<string, number> = {};
  for (const row of viewRows ?? []) views[row.nafha_id] = (views[row.nafha_id] ?? 0) + 1;

  return (
    <div className="space-y-6">
      <section className="rounded-4xl border border-line bg-white p-6 shadow-soft">
        <h2 className="mb-1 text-xl font-bold text-emerald-deep">نفحة جديدة</h2>
        <p className="mb-5 text-sm text-muted">
          تُنشر في قناة{" "}
          <Link href="/nafahat" className="font-bold text-emerald hover:underline">
            {NAFAHAT_TITLE}
          </Link>{" "}
          على الموقع والتطبيق. المستخدمون يتفاعلون ويشاركون وينزّلون فقط، ولا يكتبون فيها.
        </p>
        <NafhaComposer />
      </section>

      <div className="overflow-x-auto rounded-3xl border border-line bg-white shadow-soft">
        <table className="w-full min-w-3xl text-sm">
          <thead className="bg-ivory text-xs text-muted">
            <tr>
              <th className="px-4 py-3 text-start font-bold">النفحة</th>
              <th className="px-4 py-3 text-start font-bold">نُشرت</th>
              <th className="px-4 py-3 text-start font-bold">التفاعل</th>
              <th className="px-4 py-3 text-start font-bold">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {list.map((nafha) => {
              const Icon = nafha.media_type === "video" ? Film : nafha.media_type === "image" ? ImageIcon : Type;
              return (
                <tr key={nafha.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-start gap-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-mist text-emerald">
                        <Icon className="size-4" aria-hidden />
                      </span>
                      <span className="min-w-0">
                        <span className="block font-bold" dir="auto">
                          {nafha.title}
                        </span>
                        {nafha.body && (
                          <span className="line-clamp-1 block text-xs text-muted" dir="auto">
                            {nafha.body}
                          </span>
                        )}
                      </span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs">{formatNafhaDate(nafha.created_at)}</td>
                  <td className="px-4 py-3">
                    <ReactorsButton nafhaId={nafha.id} title={nafha.title} counts={counts[nafha.id] ?? {}} views={views[nafha.id] ?? 0} />
                  </td>
                  <td className="px-4 py-3">
                    <DeleteNafhaButton nafhaId={nafha.id} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {list.length === 0 && <p className="p-6 text-center text-muted">لا توجد نفحات هذا الشهر.</p>}
      </div>
    </div>
  );
}
