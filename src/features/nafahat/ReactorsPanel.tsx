"use client";

import { useEffect, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Users, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { buttonClass } from "@/components/ui/button";
import type { NafhaEmoji } from "@/lib/supabase/database.types";
import { getNafhaReactorsAction, type Reactor } from "./actions";
import { NAFAHAT_EMOJIS, formatNafhaDate, type ReactionCounts } from "./shared";

const CHAR = Object.fromEntries(NAFAHAT_EMOJIS.map((emoji) => [emoji.id, emoji.char])) as Record<NafhaEmoji, string>;

interface PanelProps {
  title: string;
  counts: ReactionCounts;
  onClose: () => void;
}

/** Admins only: who reacted to a nafha and with what, filterable by emoji, 50 at a time. */
export function ReactorsPanel({ nafhaId, ...rest }: PanelProps & { nafhaId: string | null }) {
  const { onClose } = rest;
  useEffect(() => {
    if (!nafhaId) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [nafhaId, onClose]);

  // Keyed by the post, so each opening starts with fresh state.
  return <AnimatePresence>{nafhaId && <ReactorsDialog key={nafhaId} nafhaId={nafhaId} {...rest} />}</AnimatePresence>;
}

function ReactorsDialog({ nafhaId, title, counts, onClose }: PanelProps & { nafhaId: string }) {
  const [filter, setFilter] = useState<NafhaEmoji | null>(null);
  const [reactors, setReactors] = useState<Reactor[]>([]);
  const [page, setPage] = useState(0);
  const [more, setMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, start] = useTransition();

  const load = (nextPage: number, emoji: NafhaEmoji | null) =>
    start(async () => {
      const result = await getNafhaReactorsAction(nafhaId, nextPage, emoji);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setError(null);
      setReactors((current) => (nextPage === 0 ? result.reactors : [...current, ...result.reactors]));
      setMore(result.more);
      setPage(nextPage);
    });

  // The first page, once, when the panel opens.
  const [initial] = useState(() => ({ load }));
  useEffect(() => initial.load(0, null), [initial]);

  function choose(emoji: NafhaEmoji | null) {
    if (emoji === filter) return;
    setFilter(emoji);
    setReactors([]);
    setMore(false);
    load(0, emoji);
  }

  const total = Object.values(counts).reduce((sum, count) => sum + (count ?? 0), 0);
  const tabs: { id: NafhaEmoji | null; label: string; count: number }[] = [
    { id: null, label: "الكل", count: total },
    ...NAFAHAT_EMOJIS.map((emoji) => ({ id: emoji.id, label: emoji.char, count: counts[emoji.id] ?? 0 })),
  ];

  return (
    <motion.div
      className="fixed inset-0 z-80 flex items-end justify-center bg-emerald-night/60 p-3 backdrop-blur-sm sm:items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reactors-title"
        className="flex max-h-[min(40rem,calc(100dvh-1.5rem))] w-full max-w-lg flex-col overflow-hidden rounded-4xl bg-ivory shadow-lift"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: "spring", damping: 26, stiffness: 280 }}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-start gap-3 border-b border-line bg-white px-5 py-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-emerald-mist text-emerald">
            <Users className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="reactors-title" className="font-bold text-emerald-deep">
              المتفاعلون ({total.toLocaleString("ar-EG")})
            </h2>
            <p className="truncate text-xs text-muted" dir="auto">
              {title}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            autoFocus
            className="grid size-9 place-items-center rounded-full text-ink hover:bg-emerald-mist"
            aria-label="إغلاق"
          >
            <X className="size-5" aria-hidden />
          </button>
        </header>

        <div role="tablist" aria-label="تصفية حسب التفاعل" className="flex gap-2 overflow-x-auto border-b border-line bg-white px-5 py-3">
          {tabs.map((tab) => (
            <button
              key={tab.id ?? "all"}
              type="button"
              role="tab"
              aria-selected={filter === tab.id}
              onClick={() => choose(tab.id)}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold",
                filter === tab.id ? "bg-emerald-deep text-white" : "border border-line bg-white text-ink hover:bg-emerald-mist",
              )}
            >
              <span>{tab.label}</span>
              <span className={cn("text-xs", filter === tab.id ? "text-white/80" : "text-muted")}>{tab.count.toLocaleString("ar-EG")}</span>
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2">
          {error && <p className="p-4 text-center text-sm font-bold text-rose">{error}</p>}
          {!error && reactors.length === 0 && !loading && <p className="p-8 text-center text-sm text-muted">لا يوجد تفاعل بعد.</p>}
          <ul className="divide-y divide-line">
            {reactors.map((reactor) => (
              <li key={reactor.userId} className="flex items-center gap-3 px-2 py-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-xl shadow-soft" aria-hidden>
                  {CHAR[reactor.emoji]}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold text-ink" dir="auto">
                    {reactor.name}
                  </span>
                  {reactor.email && (
                    <span className="block truncate text-xs text-muted" dir="ltr">
                      {reactor.email}
                    </span>
                  )}
                </span>
                <time dateTime={reactor.at} className="shrink-0 text-[0.7rem] text-muted">
                  {formatNafhaDate(reactor.at)}
                </time>
              </li>
            ))}
          </ul>
          {loading && (
            <p className="flex justify-center p-4 text-muted">
              <Loader2 className="size-5 animate-spin" aria-label="جارٍ التحميل" />
            </p>
          )}
          {more && !loading && (
            <div className="flex justify-center p-3">
              <button type="button" onClick={() => load(page + 1, filter)} className={buttonClass("outline", "sm")}>
                عرض المزيد
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
