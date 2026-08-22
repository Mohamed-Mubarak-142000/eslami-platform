"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { useTranslations } from "@/i18n/LocaleProvider";

const noopSubscribe = () => () => {};
/** Reports whether hydration has completed, without the setState-in-effect anti-pattern. */
function useMounted(): boolean {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

export function ThemeToggle() {
  const t = useTranslations("shell");
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();
  const prefersReducedMotion = useReducedMotion();

  const isDark = mounted && resolvedTheme === "dark";
  const label = isDark ? t.switchToLight : t.switchToDark;

  return (
    <button
      type="button"
      className="ds-icon-button shell-control"
      aria-label={label}
      title={label}
      disabled={!mounted}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={isDark ? "moon" : "sun"}
          aria-hidden="true"
          initial={prefersReducedMotion ? false : { rotate: -90, opacity: 0, scale: 0.6 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          {...(prefersReducedMotion ? {} : { exit: { rotate: 90, opacity: 0, scale: 0.6 } })}
          transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
        >
          {isDark ? <Moon size={19} /> : <Sun size={19} />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
