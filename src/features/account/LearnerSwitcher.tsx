"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, CloudUpload, Loader2, Users, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { buttonClass } from "@/components/ui/button";
import { useKidsProgress } from "@/features/kids/progress/KidsProgressProvider";
import { useAccountContext } from "./AccountProvider";

function learnerLabel(kind: "self" | "child", name: string): string {
  return kind === "self" ? `أنا (${name})` : name;
}

/** Picks whose progress is shown and saved (the account holder or one of their children). */
export function LearnerSwitcher({ variant = "site", className }: { variant?: "site" | "kids"; className?: string }) {
  const { state, setActiveLearner } = useAccountContext();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (state.status !== "signed-in" || state.learners.length < 2) return null;
  const { learners, activeLearner } = state;
  const kids = variant === "kids";

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={cn(
          "inline-flex max-w-52 items-center gap-2 rounded-full font-extrabold",
          kids
            ? "bg-white/95 px-4 py-2.5 text-base text-emerald-deep shadow-lift ring-4 ring-white/60"
            : "border border-line bg-white px-4 py-2 text-sm text-ink shadow-soft",
        )}
      >
        <Users className="size-4 shrink-0 text-gold-deep" aria-hidden />
        <span className="truncate">{activeLearner.kind === "self" ? "أنا" : activeLearner.display_name}</span>
        <ChevronDown className={cn("size-4 shrink-0 transition-transform", open && "rotate-180")} aria-hidden />
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            aria-label="اختر الملف"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="absolute right-0 top-full z-50 mt-2 w-60 rounded-3xl border border-line bg-white p-2 font-sans shadow-lift"
          >
            {learners.map((learner) => {
              const selected = learner.id === activeLearner.id;
              return (
                <li key={learner.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => {
                      setActiveLearner(learner.id);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-start text-sm font-bold",
                      selected ? "bg-emerald-mist text-emerald-deep" : "text-ink hover:bg-ivory",
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-8 shrink-0 place-items-center rounded-full font-display",
                        learner.kind === "self" ? "bg-gold text-emerald-night" : "bg-sky/15 text-sky",
                      )}
                    >
                      {learner.display_name.charAt(0)}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{learnerLabel(learner.kind, learner.display_name)}</span>
                    {selected && <Check className="size-4 text-emerald" aria-hidden />}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Offers, once per account and device, to move progress made as a guest into the active learner. */
export function GuestMergeBanner({ className }: { className?: string }) {
  const { state } = useAccountContext();
  const { guestMergeAvailable, mergeGuestProgress, dismissGuestMerge } = useKidsProgress();
  const [merging, setMerging] = useState(false);

  if (!guestMergeAvailable || state.status !== "signed-in") return null;
  const target = state.activeLearner.kind === "self" ? "حسابك" : `ملف ${state.activeLearner.display_name}`;

  return (
    <div
      role="status"
      className={cn(
        "flex flex-wrap items-center gap-3 rounded-3xl border border-gold/40 bg-gold-mist p-4 font-sans text-ink shadow-soft",
        className,
      )}
    >
      <CloudUpload className="size-6 shrink-0 text-gold-deep" aria-hidden />
      <p className="min-w-48 flex-1 text-sm font-bold">لديك تقدّم محفوظ على هذا الجهاز من قبل تسجيل الدخول. هل تنقله إلى {target}؟</p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={merging}
          onClick={async () => {
            setMerging(true);
            try {
              await mergeGuestProgress();
            } finally {
              setMerging(false);
            }
          }}
          className={buttonClass("primary", "sm")}
        >
          {merging && <Loader2 className="animate-spin" aria-hidden />} انقله
        </button>
        <button type="button" onClick={dismissGuestMerge} className={buttonClass("ghost", "sm")}>
          <X aria-hidden /> لا، شكرًا
        </button>
      </div>
    </div>
  );
}
