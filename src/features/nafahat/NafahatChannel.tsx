"use client";

import Link from "next/link";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, ArrowRight, Download, Loader2, Lock, PenLine, Send, Share2, SmilePlus } from "lucide-react";
import { cn } from "@/lib/cn";
import { BrandMark } from "@/components/site/BrandMark";
import { useAccount } from "@/features/account/AccountProvider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { NafhaEmoji } from "@/lib/supabase/database.types";
import { NafhaCard } from "./NafhaCard";
import { ReactorsPanel } from "./ReactorsPanel";
import {
  CHAT_WALLPAPER,
  LAST_SEEN_KEY,
  NAFAHAT_EMOJIS,
  NAFAHAT_TITLE,
  downloadName,
  nafhaDayKey,
  nafhaDayLabel,
  type Nafha,
  type ReactionCounts,
} from "./shared";
import { useHydrated, useNafahatLive } from "./useNafahatLive";

const CHAR = Object.fromEntries(NAFAHAT_EMOJIS.map((emoji) => [emoji.id, emoji.char])) as Record<NafhaEmoji, string>;

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

  /** Optimistic: the pill changes at once and rolls back if the write fails. Same emoji again removes it. */
  const react = useCallback(
    async (nafhaId: string, emoji: NafhaEmoji) => {
      const supabase = getSupabaseBrowserClient();
      if (!supabase || !userId) return;
      const before = { counts: counts[nafhaId] ?? {}, mine: mine[nafhaId] };
      const removing = before.mine === emoji;
      const nextCounts = { ...before.counts };
      if (before.mine) nextCounts[before.mine] = Math.max(0, (nextCounts[before.mine] ?? 1) - 1);
      if (!removing) nextCounts[emoji] = (nextCounts[emoji] ?? 0) + 1;
      const apply = (value: ReactionCounts, own: NafhaEmoji | undefined) => {
        setCounts((current) => ({ ...current, [nafhaId]: value }));
        setMine((current) => {
          const next = { ...current };
          if (own) next[nafhaId] = own;
          else delete next[nafhaId];
          return next;
        });
      };
      apply(nextCounts, removing ? undefined : emoji);

      const { error } = removing
        ? await supabase.from("nafahat_reactions").delete().eq("nafha_id", nafhaId).eq("user_id", userId)
        : await supabase
            .from("nafahat_reactions")
            .upsert({ nafha_id: nafhaId, user_id: userId, emoji }, { onConflict: "nafha_id,user_id" });
      if (error) apply(before.counts, before.mine);
    },
    [counts, mine, userId],
  );

  return { counts, mine, react };
}

async function share(nafha: Nafha): Promise<"shared" | "copied" | "cancelled"> {
  const url = `${window.location.origin}/nafahat#nafha-${nafha.id}`;
  const text = [nafha.title, nafha.body].filter(Boolean).join("\n\n");
  const aborted = (error: unknown) => error instanceof DOMException && error.name === "AbortError";
  if (nafha.media_url && navigator.canShare) {
    try {
      const blob = await (await fetch(nafha.media_url)).blob();
      const file = new File([blob], downloadName(nafha), { type: blob.type });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: nafha.title, text: `${text}\n\n${url}` });
        return "shared";
      }
    } catch (error) {
      if (aborted(error)) return "cancelled";
    }
  }
  if (navigator.share) {
    try {
      await navigator.share({ title: nafha.title, text, url });
      return "shared";
    } catch (error) {
      if (aborted(error)) return "cancelled";
    }
  }
  await navigator.clipboard.writeText(`${text}\n\n${url}`);
  return "copied";
}

const sideButton =
  "grid size-8 place-items-center rounded-full bg-white/80 text-muted shadow-[0_1px_1px_rgba(1,42,34,0.12)] backdrop-blur transition hover:bg-white hover:text-emerald disabled:opacity-60";

/** The emoji tray that pops above a bubble, WhatsApp-style. */
function ReactionPicker({
  mine,
  onPick,
  onClose,
}: {
  mine: NafhaEmoji | undefined;
  onPick: (emoji: NafhaEmoji) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDown = (event: PointerEvent) => !ref.current?.contains(event.target as Node) && onClose();
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <motion.div
      ref={ref}
      role="menu"
      aria-label="اختر تفاعلك"
      initial={{ opacity: 0, scale: 0.6, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.6, y: 8 }}
      transition={{ type: "spring", damping: 20, stiffness: 380 }}
      className="absolute bottom-full start-0 z-20 mb-2 flex origin-bottom-right gap-0.5 rounded-full bg-white p-1.5 shadow-lift"
    >
      {NAFAHAT_EMOJIS.map((emoji, index) => (
        <motion.button
          key={emoji.id}
          type="button"
          role="menuitemradio"
          aria-checked={mine === emoji.id}
          aria-label={emoji.label}
          title={emoji.label}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.035 }}
          onClick={() => onPick(emoji.id)}
          className={cn(
            "grid size-10 place-items-center rounded-full text-2xl transition-transform hover:scale-125",
            mine === emoji.id && "bg-emerald-mist",
          )}
        >
          {emoji.char}
        </motion.button>
      ))}
    </motion.div>
  );
}

function Message({
  nafha,
  counts,
  mine,
  signedIn,
  isAdmin,
  highlighted,
  onReact,
  onShowReactors,
}: {
  nafha: Nafha;
  counts: ReactionCounts;
  mine: NafhaEmoji | undefined;
  signedIn: boolean;
  isAdmin: boolean;
  highlighted: boolean;
  onReact: (emoji: NafhaEmoji) => void;
  onShowReactors: () => void;
}) {
  const [picking, setPicking] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const closePicker = useCallback(() => setPicking(false), []);
  const used = NAFAHAT_EMOJIS.filter((emoji) => (counts[emoji.id] ?? 0) > 0);
  const total = used.reduce((sum, emoji) => sum + (counts[emoji.id] ?? 0), 0);

  useEffect(() => {
    if (!note) return;
    const id = setTimeout(() => setNote(null), 3500);
    return () => clearTimeout(id);
  }, [note]);

  return (
    <motion.li
      id={`nafha-${nafha.id}`}
      layout="position"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex scroll-mt-4 flex-col items-start"
    >
      <div className="flex max-w-[92%] items-center gap-2 sm:max-w-[80%]">
        <NafhaCard nafha={nafha} highlighted={highlighted} className="min-w-0">
          <AnimatePresence>
            {picking && (
              <ReactionPicker
                mine={mine}
                onClose={closePicker}
                onPick={(emoji) => {
                  setPicking(false);
                  onReact(emoji);
                }}
              />
            )}
          </AnimatePresence>
          {total > 0 && (
            <button
              type="button"
              onClick={() => (isAdmin ? onShowReactors() : signedIn ? setPicking(true) : setNote("signin"))}
              aria-label={isAdmin ? `عرض المتفاعلين (${total})` : `التفاعلات (${total})`}
              className={cn(
                "relative z-10 -mt-1.5 ms-2 inline-flex h-7 items-center gap-1 rounded-full border bg-white px-2 text-sm shadow-[0_1px_2px_rgba(1,42,34,0.15)]",
                mine ? "border-gold-soft" : "border-white",
              )}
            >
              <span className="flex -space-x-0.5 leading-none rtl:space-x-reverse">
                {used.slice(0, 3).map((emoji) => (
                  <span key={emoji.id}>{emoji.char}</span>
                ))}
              </span>
              <span className="text-xs font-bold tabular-nums text-muted">{total.toLocaleString("ar-EG")}</span>
            </button>
          )}
        </NafhaCard>

        <div className="flex shrink-0 flex-col gap-1.5 self-center">
          <button
            type="button"
            onClick={() => (signedIn ? setPicking((value) => !value) : setNote("signin"))}
            className={cn(sideButton, mine && "text-gold-deep")}
            aria-label={mine ? `تفاعلك ${CHAR[mine]}، غيّره` : "تفاعل"}
            title="تفاعل"
          >
            {mine ? <span className="text-base leading-none">{CHAR[mine]}</span> : <SmilePlus className="size-4" aria-hidden />}
          </button>
          <button
            type="button"
            disabled={sharing}
            onClick={async () => {
              setSharing(true);
              try {
                if ((await share(nafha)) === "copied") setNote("تم نسخ النفحة والرابط");
              } catch {
                setNote("تعذّرت المشاركة");
              } finally {
                setSharing(false);
              }
            }}
            className={sideButton}
            aria-label="مشاركة"
            title="مشاركة"
          >
            {sharing ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Share2 className="size-4" aria-hidden />}
          </button>
          {nafha.media_url && (
            // Supabase serves the file as an attachment with this name when ?download= is set.
            <a
              href={`${nafha.media_url}?download=${encodeURIComponent(downloadName(nafha))}`}
              className={sideButton}
              aria-label={nafha.media_type === "video" ? "تنزيل الفيديو" : "تنزيل الصورة"}
              title="تنزيل"
            >
              <Download className="size-4" aria-hidden />
            </a>
          )}
        </div>
      </div>

      {note && (
        <p role="status" className="mt-1.5 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-emerald-deep shadow-soft">
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
    </motion.li>
  );
}

/** The channel as a WhatsApp-style chat: green header, patterned wallpaper, day separators, a locked composer. */
export function NafahatChannel({ nafahat }: { nafahat: Nafha[] }) {
  const account = useAccount();
  const hydrated = useHydrated();
  const userId = account.status === "signed-in" ? account.account.id : null;
  const isAdmin = account.status === "signed-in" && account.account.role === "admin";

  const [items, setItems] = useState(nafahat);
  const ids = useMemo(() => items.map((nafha) => nafha.id), [items]);
  const { counts, mine, react } = useReactions(ids, userId);
  const [reactorsOf, setReactorsOf] = useState<Nafha | null>(null);
  const closeReactors = useCallback(() => setReactorsOf(null), []);
  const [highlight, setHighlight] = useState<string | null>(null);
  const [unread, setUnread] = useState(0);
  const scroller = useRef<HTMLDivElement>(null);
  const pendingScroll = useRef(false);

  const nearBottom = () => {
    const el = scroller.current;
    return !el || el.scrollHeight - el.scrollTop - el.clientHeight < 160;
  };
  const toBottom = (smooth: boolean) => {
    const el = scroller.current;
    el?.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  };
  const markSeen = (id: string) => {
    try {
      localStorage.setItem(LAST_SEEN_KEY, id);
    } catch {}
  };

  // A post the admin publishes right now appears at the bottom; a deleted one disappears.
  useNafahatLive({
    onInsert: (nafha) => {
      setItems((current) => (current.some((item) => item.id === nafha.id) ? current : [...current, nafha]));
      markSeen(nafha.id);
      if (nearBottom()) pendingScroll.current = true;
      else setUnread((count) => count + 1);
    },
    onDelete: (id) => setItems((current) => current.filter((item) => item.id !== id)),
  });

  useEffect(() => {
    if (!pendingScroll.current) return;
    pendingScroll.current = false;
    toBottom(true);
  }, [items]);

  // On open: the linked post (highlighted for a moment), else the newest at the bottom; that counts as seen.
  useEffect(() => {
    const latest = nafahat.at(-1);
    if (latest) markSeen(latest.id);
    const hash = window.location.hash.slice(1);
    const target = hash ? document.getElementById(hash) : null;
    if (target) {
      target.scrollIntoView({ block: "center" });
      const id = hash.replace(/^nafha-/, "");
      const show = setTimeout(() => setHighlight(id), 0);
      const hide = setTimeout(() => setHighlight(null), 2600);
      return () => {
        clearTimeout(show);
        clearTimeout(hide);
      };
    }
    toBottom(false);
  }, [nafahat]);

  const now = hydrated ? new Date() : null;

  return (
    <div className="mx-auto flex h-[calc(100dvh-4rem)] max-w-3xl flex-col overflow-hidden bg-ivory sm:my-4 sm:h-[calc(100dvh-6.5rem)] sm:rounded-3xl sm:border sm:border-line sm:shadow-soft">
      <header className="flex items-center gap-3 bg-emerald-deep px-3 py-2.5 text-white sm:px-4">
        <Link href="/" className="grid size-9 place-items-center rounded-full hover:bg-white/10" aria-label="الرئيسية">
          <ArrowRight className="size-5" aria-hidden />
        </Link>
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-ivory ring-2 ring-gold/60">
          <BrandMark className="h-8" />
        </span>
        <div className="min-w-0 flex-1 leading-tight">
          <h1 className="truncate font-display text-lg font-bold">{NAFAHAT_TITLE}</h1>
          <p className="truncate text-xs text-white/70">
            قناة · {items.length ? `${items.length.toLocaleString("ar-EG")} نفحة هذا الشهر` : "ينشر فيها فريق المنارة"}
          </p>
        </div>
        {isAdmin && (
          <Link
            href="/admin/nafahat"
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/10 px-3 text-sm font-bold hover:bg-white/20"
          >
            <PenLine className="size-4" aria-hidden /> انشر
          </Link>
        )}
      </header>

      <div
        ref={scroller}
        onScroll={() => unread > 0 && nearBottom() && setUnread(0)}
        className="relative flex-1 overflow-y-auto overscroll-contain"
        style={CHAT_WALLPAPER}
      >
        <div className="flex min-h-full flex-col gap-3 px-3 py-4 sm:px-6">
          <p className="mx-auto max-w-sm rounded-xl bg-gold-mist/95 px-3 py-2 text-center text-xs leading-6 text-gold-deep shadow-[0_1px_0.5px_rgba(1,42,34,0.1)]">
            <Lock className="me-1 inline size-3.5 align-[-2px]" aria-hidden />
            قناة للقراءة فقط: ينشر فيها فريق المنارة وحده، وتتجدد النفحات أول كل شهر. تفاعل وشارك ونزّل ما يعجبك.
          </p>

          {items.length === 0 ? (
            <div className="m-auto rounded-2xl bg-white/90 px-6 py-5 text-center shadow-soft">
              <p className="font-display text-lg font-bold text-emerald-deep">لا توجد نفحات بعد</p>
              <p className="mt-1 text-sm text-muted">ترقّب أول نفحة قريبًا بإذن الله.</p>
            </div>
          ) : (
            <ol className="flex flex-col gap-3">
              {items.map((nafha, index) => {
                const day = nafhaDayKey(nafha.created_at);
                const newDay = index === 0 || nafhaDayKey(items[index - 1]!.created_at) !== day;
                return (
                  <Fragment key={nafha.id}>
                    {newDay && (
                      <li className="sticky top-2 z-10 flex justify-center" aria-hidden>
                        <span className="rounded-lg bg-white/95 px-3 py-1 text-xs font-bold text-muted shadow-[0_1px_0.5px_rgba(1,42,34,0.13)]">
                          {nafhaDayLabel(nafha.created_at, now)}
                        </span>
                      </li>
                    )}
                    <Message
                      nafha={nafha}
                      counts={counts[nafha.id] ?? {}}
                      mine={mine[nafha.id]}
                      signedIn={Boolean(userId)}
                      isAdmin={isAdmin}
                      highlighted={highlight === nafha.id}
                      onReact={(emoji) => void react(nafha.id, emoji)}
                      onShowReactors={() => setReactorsOf(nafha)}
                    />
                  </Fragment>
                );
              })}
            </ol>
          )}
        </div>

        <AnimatePresence>
          {unread > 0 && (
            <motion.button
              type="button"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              onClick={() => {
                toBottom(true);
                setUnread(0);
              }}
              className="sticky bottom-3 start-full me-3 ms-auto flex items-center gap-1.5 rounded-full bg-emerald px-3.5 py-2 text-sm font-bold text-white shadow-lift"
            >
              <ArrowDown className="size-4" aria-hidden /> {unread.toLocaleString("ar-EG")} نفحة جديدة
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <footer className="flex items-center gap-2 border-t border-line bg-ivory px-3 py-2.5 sm:px-4">
        <div className="flex h-11 flex-1 items-center gap-2 rounded-full bg-white px-4 text-sm text-muted shadow-[0_1px_0.5px_rgba(1,42,34,0.1)]">
          <Lock className="size-4 shrink-0" aria-hidden />
          <span className="truncate">النشر في هذه القناة للإدارة فقط</span>
        </div>
        {isAdmin ? (
          <Link
            href="/admin/nafahat"
            className="grid size-11 shrink-0 place-items-center rounded-full bg-emerald text-white shadow-soft hover:bg-emerald-deep"
            aria-label="انشر نفحة"
          >
            <Send className="size-5 -scale-x-100" aria-hidden />
          </Link>
        ) : (
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-line text-muted" aria-hidden>
            <Send className="size-5 -scale-x-100" />
          </span>
        )}
      </footer>

      {isAdmin && (
        <ReactorsPanel
          nafhaId={reactorsOf?.id ?? null}
          title={reactorsOf?.title ?? ""}
          counts={reactorsOf ? (counts[reactorsOf.id] ?? {}) : {}}
          onClose={closeReactors}
        />
      )}
    </div>
  );
}
