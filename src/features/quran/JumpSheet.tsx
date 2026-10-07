"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bookmark, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { toArabicDigits } from "@/lib/arabic";
import { normalizeArabic } from "@/lib/normalizeArabic";
import type { MushafIndex } from "./mushafPageTypes";
import { TOTAL_PAGES } from "./mushafPageTypes";
import type { PageBookmark } from "./readerPrefs";

type Tab = "surah" | "juz" | "page" | "bookmarks";

const TABS: { key: Tab; label: string }[] = [
  { key: "surah", label: "سورة" },
  { key: "juz", label: "جزء" },
  { key: "page", label: "صفحة" },
  { key: "bookmarks", label: "العلامات" },
];

const LATIN = (value: string) => value.replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));

/** "Go to": a surah, a juz, a page number, or one of the reader's bookmarked pages. */
export function JumpSheet({
  open,
  index,
  currentPage,
  bookmarks,
  onJump,
  onClose,
}: {
  open: boolean;
  index: MushafIndex;
  currentPage: number;
  bookmarks: PageBookmark[];
  onJump: (page: number) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<Tab>("surah");
  const [query, setQuery] = useState("");
  const [pageText, setPageText] = useState("");
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const surahs = useMemo(() => {
    const term = normalizeArabic(LATIN(query.trim()));
    if (!term) return index.surahs;
    return index.surahs.filter((surah) => normalizeArabic(surah.name).includes(term) || String(surah.id) === term);
  }, [index.surahs, query]);

  const pageNumber = Number(LATIN(pageText.trim()));
  const pageValid = Number.isInteger(pageNumber) && pageNumber >= 1 && pageNumber <= TOTAL_PAGES;

  function jump(page: number) {
    onJump(page);
    onClose();
  }

  function submitPage(event: FormEvent) {
    event.preventDefault();
    if (pageValid) jump(pageNumber);
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] text-ink">
          <motion.button
            type="button"
            aria-hidden
            tabIndex={-1}
            className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="انتقل إلى"
            className="absolute inset-x-0 bottom-0 mx-auto flex max-h-[85dvh] max-w-2xl flex-col overflow-clip rounded-t-4xl bg-ivory shadow-lift"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 36 }}
          >
            <div className="shrink-0 px-5 pt-3">
              <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-line" aria-hidden />
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-emerald-deep">انتقل إلى</h2>
                <button
                  ref={closeRef}
                  type="button"
                  onClick={onClose}
                  className="grid size-10 place-items-center rounded-full hover:bg-emerald-mist"
                >
                  <X className="size-5" aria-hidden />
                  <span className="sr-only">إغلاق</span>
                </button>
              </div>
              <div className="mt-3 grid grid-cols-4 gap-1 rounded-full bg-white p-1 shadow-soft" role="tablist">
                {TABS.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    role="tab"
                    aria-selected={tab === item.key}
                    onClick={() => setTab(item.key)}
                    className={cn(
                      "h-9 rounded-full text-sm font-bold transition-colors",
                      tab === item.key ? "bg-emerald text-white" : "text-muted hover:text-ink",
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-6 pt-4">
              {tab === "surah" && (
                <>
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="ابحث باسم السورة أو رقمها"
                    className="h-11 w-full rounded-2xl border border-line bg-white px-4 text-sm outline-none focus:border-emerald/50"
                  />
                  <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
                    {surahs.map((surah) => (
                      <li key={surah.id}>
                        <button
                          type="button"
                          onClick={() => jump(surah.startPage)}
                          className="flex w-full items-center gap-3 rounded-2xl bg-white px-3 py-2.5 text-start shadow-soft hover:bg-emerald-mist"
                        >
                          <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-gold-mist text-xs font-bold text-gold-deep">
                            {toArabicDigits(surah.id)}
                          </span>
                          <span className="flex-1 font-bold">{surah.name}</span>
                          <span className="text-xs text-muted">ص {toArabicDigits(surah.startPage)}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {tab === "juz" && (
                <ul className="grid grid-cols-5 gap-2 sm:grid-cols-6">
                  {index.juzStartPages.map((page, juzIndex) => (
                    <li key={juzIndex}>
                      <button
                        type="button"
                        onClick={() => jump(page)}
                        className="flex w-full flex-col items-center rounded-2xl bg-white py-2.5 shadow-soft hover:bg-emerald-mist"
                      >
                        <span className="text-lg font-bold text-emerald-deep">{toArabicDigits(juzIndex + 1)}</span>
                        <span className="text-[0.7rem] text-muted">ص {toArabicDigits(page)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {tab === "page" && (
                <form onSubmit={submitPage} className="flex gap-2">
                  <input
                    value={pageText}
                    onChange={(event) => setPageText(event.target.value)}
                    inputMode="numeric"
                    placeholder={`رقم الصفحة (١–٦٠٤) — أنت في ${toArabicDigits(currentPage)}`}
                    className="h-12 flex-1 rounded-2xl border border-line bg-white px-4 outline-none focus:border-emerald/50"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={!pageValid}
                    className="h-12 rounded-2xl bg-emerald px-6 font-bold text-white disabled:opacity-50"
                  >
                    انتقل
                  </button>
                </form>
              )}

              {tab === "bookmarks" &&
                (bookmarks.length === 0 ? (
                  <p className="rounded-3xl bg-white p-6 text-center text-sm leading-7 text-muted shadow-soft">
                    لا علامات بعد. اضغط <Bookmark className="inline size-4" aria-hidden /> أعلى الصفحة لتحفظ موضعك.
                  </p>
                ) : (
                  <ul className="grid gap-1.5">
                    {bookmarks.map((bookmark) => (
                      <li key={`${bookmark.riwaya}-${bookmark.page}`}>
                        <button
                          type="button"
                          onClick={() => jump(bookmark.page)}
                          className="flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-3 text-start shadow-soft hover:bg-emerald-mist"
                        >
                          <Bookmark className="size-4 shrink-0 fill-gold text-gold" aria-hidden />
                          <span className="flex-1 font-bold">سورة {bookmark.surahName}</span>
                          <span className="text-sm text-muted">صفحة {toArabicDigits(bookmark.page)}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
