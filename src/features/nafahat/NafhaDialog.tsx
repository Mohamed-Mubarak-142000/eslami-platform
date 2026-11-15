"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Play, Sparkles, X } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { BrandMark } from "@/components/site/BrandMark";
import { useInstallArrival } from "@/features/pwa/install-store";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { armChime, playChime } from "./chime";
import { LAST_SEEN_KEY, NAFAHAT_TITLE, type Nafha } from "./shared";
import { useNafahatLive } from "./useNafahatLive";
import { recordNafhaViews } from "./views";
import { useAccount } from "@/features/account/AccountProvider";

/** Pages where the dialog never opens: the channel itself, admin, and the sign-in flow. */
const SKIP = /^\/(nafahat|admin|login|register|verify|forgot-password|reset-password|auth)(\/|$)/;
const DELAY_MS = 1500;

// Lets other prompts (KidsInviteDialog) wait while this one is open.
let dialogOpen = false;
const listeners = new Set<() => void>();
function setDialogOpen(value: boolean) {
  dialogOpen = value;
  listeners.forEach((listener) => listener());
}
export function useNafhaDialogOpen(): boolean {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => dialogOpen,
    () => false,
  );
}

function readLastSeen(): string | null {
  try {
    return localStorage.getItem(LAST_SEEN_KEY);
  } catch {
    return null;
  }
}
function markSeen(id: string) {
  try {
    localStorage.setItem(LAST_SEEN_KEY, id);
  } catch {}
}

/** Shows the newest nafha once, shortly after the site opens, until the visitor opens it or dismisses it. */
export function NafhaDialog() {
  const pathname = usePathname();
  const installOpen = useInstallArrival();
  const [nafha, setNafha] = useState<Nafha | null>(null);
  const [open, setOpen] = useState(false);
  const eligible = !SKIP.test(pathname) && !installOpen;

  // The newest post when the site opens, and again whenever the tab comes back to the front (in case the
  // live connection below dropped while it was in the background).
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    let cancelled = false;
    const check = () =>
      void supabase
        .from("nafahat")
        .select("id, title, body, media_type, media_url, created_at")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
        .then(({ data }) => {
          if (!cancelled && data && data.id !== readLastSeen()) setNafha(data);
        });
    check();
    const onVisible = () => document.visibilityState === "visible" && check();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  // The moment the admin publishes, everyone with the site open gets the dialog.
  useNafahatLive({
    onInsert: (fresh) => {
      if (fresh.id !== readLastSeen()) setNafha(fresh);
    },
    onDelete: (id) => setNafha((current) => (current?.id === id ? null : current)),
  });

  useEffect(() => {
    if (!nafha || !eligible) return;
    const id = setTimeout(() => {
      // Seen meanwhile (the channel was open when it arrived): nothing to announce.
      if (readLastSeen() === nafha.id) setNafha(null);
      else setOpen(true);
    }, DELAY_MS);
    return () => clearTimeout(id);
  }, [nafha, eligible]);

  const visible = open && eligible && nafha !== null;
  const account = useAccount();
  const viewer = account.status === "signed-in" && account.account.role !== "admin";
  // Seen in the dialog counts as seen (who saw it, for the admin).
  useEffect(() => {
    if (visible && viewer && nafha) recordNafhaViews([nafha.id]);
  }, [visible, viewer, nafha]);
  useEffect(() => {
    setDialogOpen(visible);
  }, [visible]);

  // Audio is only allowed after the visitor's first interaction, so get ready for it from the start.
  useEffect(() => {
    armChime();
  }, []);

  // Ring once each time a nafha pops up, to catch the visitor's attention.
  const visibleId = visible ? (nafha?.id ?? null) : null;
  useEffect(() => {
    if (visibleId) playChime();
  }, [visibleId]);

  function dismiss() {
    if (nafha) markSeen(nafha.id);
    setOpen(false);
    setNafha(null);
  }

  useEffect(() => {
    if (!visible) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && dismiss();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- dismiss only reads the current nafha
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-75 flex items-end justify-center bg-emerald-night/65 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={dismiss}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="nafha-dialog-title"
            className="relative max-h-[92dvh] w-full max-w-lg touch-pan-x overflow-hidden rounded-t-4xl bg-ivory shadow-lift"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            // Bottom sheet: swipe it down to dismiss, otherwise it springs back.
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.7 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 110 || info.velocity.y > 600) dismiss();
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative isolate overflow-hidden bg-gradient-to-br from-emerald-night via-emerald-deep to-emerald px-6 pb-7 pt-8 text-white">
              <span className="absolute left-1/2 top-2.5 h-1.5 w-12 -translate-x-1/2 rounded-full bg-white/40" aria-hidden />
              <div className="absolute -left-16 -top-20 -z-10 size-56 rounded-full bg-gold/25 blur-3xl" aria-hidden />
              <div className="absolute -bottom-24 -right-10 -z-10 size-56 rounded-full bg-emerald-soft/20 blur-3xl" aria-hidden />
              <button
                type="button"
                onClick={dismiss}
                className="absolute left-4 top-5 grid size-9 place-items-center rounded-full bg-white/10 text-white backdrop-blur hover:bg-white/20"
                aria-label="إغلاق"
              >
                <X className="size-5" aria-hidden />
              </button>
              <div className="flex items-center gap-3">
                <motion.span
                  className="grid size-14 place-items-center rounded-2xl bg-ivory shadow-gold"
                  initial={{ rotate: -8, scale: 0.8 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: "spring", damping: 12, stiffness: 180, delay: 0.15 }}
                >
                  <BrandMark className="h-10" />
                </motion.span>
                <span>
                  <span className="block font-display text-xl font-bold">{NAFAHAT_TITLE}</span>
                  <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-gold/20 px-2.5 py-0.5 text-xs font-bold text-gold-soft">
                    <Sparkles className="size-3.5" aria-hidden /> نفحة جديدة
                  </span>
                </span>
              </div>
            </div>

            <div
              className="-mt-4 rounded-t-[1.75rem] bg-ivory px-6 pt-5"
              style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
            >
              {nafha.media_url && (
                <div className="relative mb-4 overflow-hidden rounded-2xl bg-emerald-night">
                  {nafha.media_type === "image" ? (
                    // A user-uploaded image from the public bucket.
                    <img src={nafha.media_url} alt="" className="max-h-56 w-full object-cover" />
                  ) : (
                    <>
                      <video
                        src={`${nafha.media_url}#t=0.5`}
                        muted
                        playsInline
                        preload="metadata"
                        className="max-h-56 w-full object-cover opacity-80"
                      />
                      <span className="absolute inset-0 grid place-items-center">
                        <span className="grid size-14 place-items-center rounded-full bg-white/90 text-emerald-deep shadow-lift">
                          <Play className="size-6 translate-x-[-2px] fill-current" aria-hidden />
                        </span>
                      </span>
                    </>
                  )}
                </div>
              )}
              <h2 id="nafha-dialog-title" className="font-display text-2xl font-bold leading-snug text-emerald-deep" dir="auto">
                {nafha.title}
              </h2>
              {nafha.body && (
                <p className="mt-2 line-clamp-4 whitespace-pre-line text-[0.95rem] leading-8 text-ink" dir="auto">
                  {nafha.body}
                </p>
              )}
              <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
                <Link href={`/nafahat#nafha-${nafha.id}`} onClick={dismiss} autoFocus className={buttonClass("primary", "lg", "sm:flex-1")}>
                  افتح النفحة
                </Link>
                <button type="button" onClick={dismiss} className={buttonClass("ghost", "lg")}>
                  لاحقًا
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
