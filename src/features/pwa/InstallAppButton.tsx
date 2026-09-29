"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Download, Share, SquarePlus, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { buttonClass } from "@/components/ui/button";
import { promptInstall, registerServiceWorker, useInstallMode } from "./install-store";

type Props = {
  /** "compact" is the header pill; "block" is the full-width row in the mobile drawer. */
  variant?: "compact" | "block";
  className?: string;
  onDone?: () => void;
};

/** Shown only where installing is actually possible: Chromium's prompt, or iOS "Add to Home Screen" steps. */
export function InstallAppButton({ variant = "compact", className, onDone }: Props) {
  const mode = useInstallMode();
  const [showIosHelp, setShowIosHelp] = useState(false);

  useEffect(registerServiceWorker, []);

  if (mode === "installed" || mode === "unsupported") return null;

  const onClick = async () => {
    if (mode === "ios") {
      setShowIosHelp(true);
      return;
    }
    await promptInstall();
    onDone?.();
  };

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        aria-label="ثبّت التطبيق"
        className={
          variant === "block"
            ? buttonClass("gold", "md", cn("w-full", className))
            : buttonClass("outline", "sm", cn("shadow-soft", className))
        }
      >
        <Download aria-hidden />
        <span className={variant === "compact" ? "hidden sm:inline" : undefined}>ثبّت التطبيق</span>
      </button>
      {createPortal(
        <AnimatePresence>{showIosHelp && <IosInstallHelp onClose={() => setShowIosHelp(false)} />}</AnimatePresence>,
        document.body,
      )}
    </>
  );
}

function IosInstallHelp({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-90 flex items-end justify-center sm:items-center">
      <motion.button
        type="button"
        aria-hidden
        tabIndex={-1}
        className="absolute inset-0 bg-emerald-night/55 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ios-install-title"
        className="relative m-3 w-full max-w-sm rounded-3xl bg-ivory p-6 shadow-lift"
        style={{ marginBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
      >
        <button
          type="button"
          onClick={onClose}
          autoFocus
          className="absolute left-4 top-4 grid size-10 place-items-center rounded-full hover:bg-emerald-mist"
        >
          <X className="size-5" aria-hidden />
          <span className="sr-only">إغلاق</span>
        </button>
        <h2 id="ios-install-title" className="text-lg font-bold text-ink">
          ثبّت المنارة على جهازك
        </h2>
        <ol className="mt-4 space-y-3 text-sm text-ink">
          <li className="flex items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gold-mist text-gold-deep">
              <Share className="size-5" aria-hidden />
            </span>
            اضغط زر المشاركة في شريط Safari
          </li>
          <li className="flex items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gold-mist text-gold-deep">
              <SquarePlus className="size-5" aria-hidden />
            </span>
            اختر «إضافة إلى الشاشة الرئيسية» ثم «إضافة»
          </li>
        </ol>
      </motion.div>
    </div>
  );
}
