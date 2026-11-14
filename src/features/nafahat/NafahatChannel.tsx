"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, Loader2, Lock, Share2, Users } from "lucide-react";
import { cn } from "@/lib/cn";
import { useAccount } from "@/features/account/AccountProvider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { NafhaEmoji } from "@/lib/supabase/database.types";
import { NafhaCard } from "./NafhaCard";
import { ReactorsPanel } from "./ReactorsPanel";
import { LAST_SEEN_KEY, NAFAHAT_EMOJIS, NAFAHAT_TITLE, downloadName, type Nafha, type ReactionCounts } from "./shared";

function useReactions(ids: string[], userId: string | null) {
  const [counts, setCounts] = useState<Record<string, ReactionCounts>>({});
  const [mine, setMine] = useState<Record<string, NafhaEmoji>>({});

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || ids.length === 0) return;
    let cancelled = false;
    void (async () => {
      const [{ data: rows }, own] = await Promise.all([
        supabase.from("nafahat_reaction_counts").select("nafha_id, emoji, count").in("nafha_id", ids),
        userId
          ? supabase.from("nafahat_reactions").select("nafha_id, emoji").eq("user_id", userId).in("nafha_id", ids)
          : Promise.resolve({ data: [] as { nafha_id: string; emoji: NafhaEmoji }[] }),
      ]);
      if (cancelled) return;
      const next: Record<string, ReactionCounts> = {};
      for (const row of rows ?? []) (next[row.nafha_id] ??= {})[row.emoji] = row.count;
      setCounts(next);
      setMine(Object.fromEntries((own.data ?? []).map((row) => [row.nafha_id, row.emoji])));
    })();
    return () => {
      cancelled = true;
    };
  }, [ids, userId]);

  /** Optimistic: the bar changes at once and rolls back if the write fails. Same emoji again removes it. */
  const react = useCallback(
    async (nafhaId: string, emoji: NafhaEmoji) => {
      const supabase = getSupabaseBrowserClient();
      if (!supabase || !userId) return;
      const before = { counts: counts[nafhaId] ?? {}, mine: mine[nafhaId] };
      const removing = before.mine === emoji;
      const nextCounts = { ...before.counts };
      if (before.mine) nextCounts[before.mine] = Math.max(0, (nextCounts[before.mine] ?? 1) - 1);
      if (!removing) nextCounts[emoji] = (nextCounts[emoji] ?? 0) + 1;
      setCounts((current) => ({ ...current, [nafhaId]: nextCounts }));
      setMine((current) => {
        const next = { ...current };
        if (removing) delete next[nafhaId];
        else next[nafhaId] = emoji;
        return next;
      });

      const { error } = removing
        ? await supabase.from("nafahat_reactions").delete().eq("nafha_id", nafhaId).eq("user_id", userId)
        : await supabase
            .from("nafahat_reactions")
            .upsert({ nafha_id: nafhaId, user_id: userId, emoji }, { onConflict: "nafha_id,user_id" });
      if (error) {
        setCounts((current) => ({ ...current, [nafhaId]: before.counts }));
        setMine((current) => {
          const next = { ...current };
          if (before.mine) next[nafhaId] = before.mine;
          else delete next[nafhaId];
          return next;
        });
      }
    },
    [counts, mine, userId],
  );

  return { counts, mine, react };
}

async function share(nafha: Nafha): Promise<"shared" | "copied" | "cancelled"> {
  const url = `${window.location.origin}/nafahat#nafha-${nafha.id}`;
  const text = [nafha.title, nafha.body].filter(Boolean).join("\n\n");
  if (nafha.media_url && navigator.canShare) {
    try {
      const blob = await (await fetch(nafha.media_url)).blob();
      const file = new File([blob], downloadName(nafha), { type: blob.type });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: nafha.title, text: `${text}\n\n${url}` });
        return "shared";
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return "cancelled";
    }
  }
  if (navigator.share) {
    try {
      await navigator.share({ title: nafha.title, text, url });
      return "shared";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return "cancelled";
    }
  }
  await navigator.clipboard.writeText(`${text}\n\n${url}`);
  return "copied";
}

function NafhaActions({
  nafha,
  counts,
  mine,
  signedIn,
  isAdmin,
  onReact,
  onShowReactors,
}: {
  nafha: Nafha;
  counts: ReactionCounts;
  mine: NafhaEmoji | undefined;
  signedIn: boolean;
  isAdmin: boolean;
  onReact: (emoji: NafhaEmoji) => void;
  onShowReactors: () => void;
}) {
  const [note, setNote] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const total = Object.values(counts).reduce((sum, count) => sum + (count ?? 0), 0);

  useEffect(() => {
    if (!note) return;
    const id = setTimeout(() => setNote(null), 3500);
    return () => clearTimeout(id);
  }, [note]);

  return (
    <div className="border-t border-line bg-ivory/60 px-3 py-2.5">
      <div className="flex flex-wrap items-center gap-1.5">
        {NAFAHAT_EMOJIS.map((emoji) => {
          const count = counts[emoji.id] ?? 0;
          const active = mine === emoji.id;
          return (
            <button
              key={emoji.id}
              type="button"
              aria-pressed={active}
              aria-label={`${emoji.label}${count ? ` (${count})` : ""}`}
              title={emoji.label}
              onClick={() => (signedIn ? onReact(emoji.id) : setNote("signin"))}
              className={cn(
                "inline-flex h-9 items-center gap-1 rounded-full border px-2.5 text-sm transition-[transform,background-color,border-color] active:scale-90",
                active ? "border-gold bg-gold-mist font-bold text-gold-deep" : "border-line bg-white text-ink hover:border-gold-soft",
              )}
            >
              <span className="text-base leading-none">{emoji.char}</span>
              {count > 0 && <span className="text-xs tabular-nums">{count.toLocaleString("ar-EG")}</span>}
            </button>
          );
        })}
        <span className="ms-auto flex items-center gap-1">
          {isAdmin && (
            <button
              type="button"
              onClick={onShowReactors}
              className="inline-flex h-9 items-center gap-1 rounded-full px-2.5 text-xs font-bold text-emerald hover:bg-emerald-mist"
            >
              <Users className="size-4" aria-hidden /> {total.toLocaleString("ar-EG")}
            </button>
          )}
          <button
            type="button"
            disabled={sharing}
            onClick={async () => {
              setSharing(true);
              try {
                const result = await share(nafha);
                if (result === "copied") setNote("تم نسخ النفحة والرابط");
              } catch {
                setNote("تعذّرت المشاركة");
              } finally {
                setSharing(false);
              }
            }}
            className="grid size-9 place-items-center rounded-full text-ink hover:bg-emerald-mist disabled:opacity-50"
            aria-label="مشاركة"
            title="مشاركة"
          >
            {sharing ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Share2 className="size-4" aria-hidden />}
          </button>
          {nafha.media_url && (
            // Supabase serves the file as an attachment with this name when ?download= is set.
            <a
              href={`${nafha.media_url}?download=${encodeURIComponent(downloadName(nafha))}`}
              className="grid size-9 place-items-center rounded-full text-ink hover:bg-emerald-mist"
              aria-label={nafha.media_type === "video" ? "تنزيل الفيديو" : "تنزيل الصورة"}
              title="تنزيل"
            >
              <Download className="size-4" aria-hidden />
            </a>
          )}
        </span>
      </div>
      {note && (
        <p role="status" className="mt-2 text-xs font-bold text-emerald-deep">
          {note === "signin" ? (
            <>
              <Link href={`/login?next=${encodeURIComponent("/nafahat")}`} className="text-emerald underline">
                سجّل الدخول
              </Link>{" "}
              لتتفاعل مع النفحات.
            </>
          ) : (
            note
          )}
        </p>
      )}
    </div>
  );
}

/** The channel: the posts oldest-to-newest like a chat, then a closed composer bar (admins post from /admin/nafahat). */
export function NafahatChannel({ nafahat }: { nafahat: Nafha[] }) {
  const account = useAccount();
  const userId = account.status === "signed-in" ? account.account.id : null;
  const isAdmin = account.status === "signed-in" && account.account.role === "admin";
  const ids = useMemo(() => nafahat.map((nafha) => nafha.id), [nafahat]);
  const { counts, mine, react } = useReactions(ids, userId);
  const [reactorsOf, setReactorsOf] = useState<Nafha | null>(null);
  const closeReactors = useCallback(() => setReactorsOf(null), []);

  // Opening the channel counts as seeing the newest nafha (no dialog for it afterwards); land on the
  // linked post, else on the newest.
  useEffect(() => {
    const latest = nafahat.at(-1);
    if (!latest) return;
    try {
      localStorage.setItem(LAST_SEEN_KEY, latest.id);
    } catch {}
    const target = (window.location.hash && document.querySelector(window.location.hash)) || document.getElementById(`nafha-${latest.id}`);
    target?.scrollIntoView({ block: window.location.hash ? "start" : "end" });
  }, [nafahat]);

  return (
    <>
      {nafahat.length === 0 ? (
        <div className="rounded-4xl border border-dashed border-line bg-white/70 p-10 text-center">
          <p className="font-display text-xl font-bold text-emerald-deep">لا توجد نفحات بعد</p>
          <p className="mt-2 text-sm text-muted">ترقّب أول نفحة من {NAFAHAT_TITLE} قريبًا بإذن الله.</p>
        </div>
      ) : (
        <ol className="space-y-5">
          {nafahat.map((nafha) => (
            <li key={nafha.id}>
              <NafhaCard
                nafha={nafha}
                footer={
                  <NafhaActions
                    nafha={nafha}
                    counts={counts[nafha.id] ?? {}}
                    mine={mine[nafha.id]}
                    signedIn={Boolean(userId)}
                    isAdmin={isAdmin}
                    onReact={(emoji) => void react(nafha.id, emoji)}
                    onShowReactors={() => setReactorsOf(nafha)}
                  />
                }
              />
            </li>
          ))}
        </ol>
      )}

      <div className="sticky bottom-3 mt-8 flex items-center justify-center gap-2 rounded-full border border-line bg-white/90 px-4 py-3 text-sm font-bold text-muted shadow-soft backdrop-blur">
        <Lock className="size-4" aria-hidden /> النشر في هذه القناة للإدارة فقط
        {isAdmin && (
          <Link href="/admin/nafahat" className="ms-2 text-emerald underline">
            انشر نفحة
          </Link>
        )}
      </div>

      {isAdmin && (
        <ReactorsPanel
          nafhaId={reactorsOf?.id ?? null}
          title={reactorsOf?.title ?? ""}
          counts={reactorsOf ? (counts[reactorsOf.id] ?? {}) : {}}
          onClose={closeReactors}
        />
      )}
    </>
  );
}
