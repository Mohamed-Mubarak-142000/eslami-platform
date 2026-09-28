"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { Logo } from "./Logo";
import { NAV_ITEMS, isActivePath } from "./nav";

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-[background-color,box-shadow] duration-300",
        scrolled ? "glass shadow-soft" : "bg-ivory/80",
      )}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:right-4 focus:top-3 focus:rounded-lg focus:bg-emerald focus:px-4 focus:py-2 focus:text-white"
      >
        انتقل إلى المحتوى
      </a>
      <div className="mx-auto flex h-18 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Logo />

        <nav aria-label="التنقل الرئيسي" className="ms-auto hidden xl:block">
          <ul className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const active = isActivePath(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative block rounded-full px-3.5 py-2 text-[0.95rem] font-semibold transition-colors",
                      active ? "text-emerald-deep" : "text-muted hover:text-ink",
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="nav-pill"
                        className="absolute inset-0 -z-10 rounded-full bg-emerald-soft"
                        transition={{ type: "spring", stiffness: 380, damping: 32 }}
                      />
                    )}
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          className="ms-auto grid size-11 place-items-center rounded-full border border-line bg-white text-ink xl:hidden"
        >
          <Menu className="size-5" aria-hidden />
          <span className="sr-only">فتح القائمة</span>
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <>
            <motion.button
              type="button"
              aria-hidden
              tabIndex={-1}
              className="fixed inset-0 z-40 bg-emerald-night/50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.nav
              id="mobile-nav"
              aria-label="القائمة"
              className="fixed inset-y-0 right-0 z-50 flex w-[min(86vw,22rem)] flex-col bg-ivory shadow-lift"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
            >
              <div className="flex items-center justify-between border-b border-line px-5 py-4">
                <Logo />
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="grid size-10 place-items-center rounded-full hover:bg-emerald-mist"
                >
                  <X className="size-5" aria-hidden />
                  <span className="sr-only">إغلاق القائمة</span>
                </button>
              </div>
              <ul className="flex-1 space-y-1 overflow-y-auto p-3">
                {NAV_ITEMS.map((item, index) => {
                  const active = isActivePath(pathname, item.href);
                  const Icon = item.icon;
                  return (
                    <motion.li
                      key={item.href}
                      initial={{ opacity: 0, x: 24 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.04 * index }}
                    >
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-3 rounded-2xl p-3 transition-colors",
                          active ? "bg-emerald text-white" : "hover:bg-emerald-mist",
                        )}
                      >
                        <span
                          className={cn(
                            "grid size-10 place-items-center rounded-xl",
                            active ? "bg-white/15" : "bg-gold-mist text-gold-deep",
                          )}
                        >
                          <Icon className="size-5" aria-hidden />
                        </span>
                        <span>
                          <span className="block font-bold">{item.label}</span>
                          <span className={cn("block text-xs", active ? "text-white/75" : "text-muted")}>{item.description}</span>
                        </span>
                      </Link>
                    </motion.li>
                  );
                })}
              </ul>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
