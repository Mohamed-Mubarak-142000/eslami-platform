"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { RefreshCw, Sparkles, X } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { BUILD_ID } from "./buildId";

/** Also checked whenever the app comes back to the foreground or back online. */
const CHECK_EVERY_MS = 15 * 60 * 1000;
/** "Later" hides it for this new version until the app is opened again. */
const DISMISSED_KEY = "al-manara:update-dismissed";

async function liveBuild(): Promise<string | null> {
  try {
    const response = await fetch("/api/version", { cache: "no-store" });
    if (!response.ok) return null;
    const { build } = (await response.json()) as { build?: unknown };
    return typeof build === "string" ? build : null;
  } catch {
    return null;
  }
}

function dismissed(build: string): boolean {
  try {
    return sessionStorage.getItem(DISMISSED_KEY) === build;
  } catch {
    return false;
  }
}

/**
 * Installed apps (and tabs left open for days) keep running the version they were opened with. This
 * asks the server which build is live and, when it's newer, offers a reload.
 */
export function UpdatePrompt() {
  const [available, setAvailable] = useState<string | null>(null);

  useEffect(() => {
    if (BUILD_ID === "dev") return;
    let stopped = false;
    async function check() {
      if (document.visibilityState !== "visible") return;
      const build = await liveBuild();
      if (stopped || !build || build === BUILD_ID || dismissed(build)) return;
      setAvailable(build);
      // Let the service worker pick up its newest copy too.
      navigator.serviceWorker
        ?.getRegistration()
        .then((registration) => registration?.update())
        .catch(() => {});
    }
    const first = setTimeout(check, 5000);
    const timer = setInterval(check, CHECK_EVERY_MS);
    document.addEventListener("visibilitychange", check);
    window.addEventListener("online", check);
    return () => {
      stopped = true;
      clearTimeout(first);
      clearInterval(timer);
      document.removeEventListener("visibilitychange", check);
      window.removeEventListener("online", check);
    };
  }, []);

  function later() {
    try {
      if (available) sessionStorage.setItem(DISMISSED_KEY, available);
    } catch {
      // Then it simply comes back on the next check.
    }
    setAvailable(null);
  }

  return (
    <AnimatePresence>
      {available && (
        <motion.div
          role="alertdialog"
          aria-labelledby="update-title"
          aria-describedby="update-text"
          className="fixed inset-x-3 bottom-3 z-[85] mx-auto max-w-md rounded-3xl border border-gold/40 bg-ivory p-5 shadow-lift sm:bottom-6"
          style={{ marginBottom: "env(safe-area-inset-bottom)" }}
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <button
            type="button"
            onClick={later}
            className="absolute left-3 top-3 grid size-9 place-items-center rounded-full text-muted hover:bg-emerald-mist"
          >
            <X className="size-4" aria-hidden />
            <span className="sr-only">إغلاق</span>
          </button>
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gold-mist text-gold-deep">
              <Sparkles className="size-5" aria-hidden />
            </span>
            <div className="pe-6">
              <h2 id="update-title" className="font-bold text-emerald-deep">
                تحديث جديد للمنارة
              </h2>
              <p id="update-text" className="mt-1 text-sm leading-6 text-muted">
                أضفنا تحسينات ومميزات جديدة. حدّث الآن لتصلك آخر نسخة.
              </p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => window.location.reload()} className={buttonClass("primary", "md", "w-full")}>
              <RefreshCw aria-hidden /> حدّث الآن
            </button>
            <button type="button" onClick={later} className={buttonClass("outline", "md", "w-full")}>
              لاحقًا
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
