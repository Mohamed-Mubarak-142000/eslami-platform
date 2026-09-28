"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { Logo } from "./Logo";
import { NAV_ITEMS, isActivePath } from "./nav";
import { AccountMenu } from "@/features/auth/ui/AccountMenu";

const noopSubscribe = () => () => {};

export function SiteHeader() {
  const pathname = usePathname();
  // Remember which page the menu was opened on, so navigating closes it without an effect.
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const open = openedOn === pathname;
  const [scrolled, setScrolled] = useState(false);
  const isClient = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
  const toggleRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    const previous = { html: html.style.overflow, body: document.body.style.overflow };
    // Locking <html> as well as <body> is what actually stops background scroll on iOS Safari.
    html.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const toggle = toggleRef.current;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenedOn(null);
        return;
      }
      if (event.key !== "Tab" || !drawerRef.current) return;
      const focusable = drawerRef.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled])");
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      html.style.overflow = previous.html;
      document.body.style.overflow = previous.body;
      window.removeEventListener("keydown", onKey);
      toggle?.focus();
    };
  }, [open]);

  const close = () => setOpenedOn(null);

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
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:h-18 sm:px-6">
        <Logo />

        <nav aria-label="التنقل الرئيسي" className="ms-auto hidden lg:block">
          <ul className="flex items-center gap-0.5 xl:gap-1">
            {NAV_ITEMS.map((item) => {
              const active = isActivePath(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative block rounded-full px-2.5 py-2 text-sm font-semibold transition-colors xl:px-3.5 xl:text-[0.95rem]",
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

        <div className="ms-auto lg:ms-3">
          <AccountMenu />
        </div>

        <button
          ref={toggleRef}
          type="button"
          onClick={() => setOpenedOn(pathname)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          className="grid size-11 place-items-center rounded-full border border-line bg-white text-ink shadow-soft active:scale-95 lg:hidden"
        >
          <Menu className="size-5" aria-hidden />
          <span className="sr-only">فتح القائمة</span>
        </button>
      </div>

      {/* Portaled to <body>: the header's backdrop-filter would otherwise trap this "fixed" drawer
          inside the header on some browsers, and its z-index would sit under toasts/players. */}
      {isClient &&
        createPortal(
          <AnimatePresence>
            {open && (
              <div className="fixed inset-0 z-[80] lg:hidden">
                <motion.button
                  type="button"
                  aria-hidden
                  tabIndex={-1}
                  className="absolute inset-0 bg-emerald-night/55 backdrop-blur-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={close}
                />
                <motion.nav
                  ref={drawerRef}
                  id="mobile-nav"
                  role="dialog"
                  aria-modal="true"
                  aria-label="القائمة"
                  className="absolute inset-y-0 right-0 flex h-dvh w-[min(88vw,22rem)] flex-col overscroll-contain bg-ivory shadow-lift"
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", stiffness: 320, damping: 34 }}
                  style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
                >
                  <div className="flex items-center justify-between border-b border-line px-5 py-4">
                    <Logo />
                    <button
                      ref={closeRef}
                      type="button"
                      onClick={close}
                      className="grid size-11 place-items-center rounded-full hover:bg-emerald-mist"
                    >
                      <X className="size-5" aria-hidden />
                      <span className="sr-only">إغلاق القائمة</span>
                    </button>
                  </div>
                  <ul className="flex-1 space-y-1 overflow-y-auto overscroll-contain p-3">
                    {NAV_ITEMS.map((item, index) => {
                      const active = isActivePath(pathname, item.href);
                      const Icon = item.icon;
                      return (
                        <motion.li
                          key={item.href}
                          initial={{ opacity: 0, x: 24 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.035 * index }}
                        >
                          <Link
                            href={item.href}
                            onClick={close}
                            aria-current={active ? "page" : undefined}
                            className={cn(
                              "flex min-h-14 items-center gap-3 rounded-2xl p-3 transition-colors",
                              active ? "bg-emerald text-white" : "hover:bg-emerald-mist active:bg-emerald-mist",
                            )}
                          >
                            <span
                              className={cn(
                                "grid size-10 shrink-0 place-items-center rounded-xl",
                                active ? "bg-white/15" : "bg-gold-mist text-gold-deep",
                              )}
                            >
                              <Icon className="size-5" aria-hidden />
                            </span>
                            <span className="min-w-0">
                              <span className="block font-bold">{item.label}</span>
                              <span className={cn("block truncate text-xs", active ? "text-white/75" : "text-muted")}>
                                {item.description}
                              </span>
                            </span>
                          </Link>
                        </motion.li>
                      );
                    })}
                  </ul>
                  <p className="border-t border-line px-5 py-4 text-center text-xs text-muted">المنارة — قرآن · علم · ذكر</p>
                </motion.nav>
              </div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </header>
  );
}
