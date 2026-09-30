"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { isActivePath, isGroupActive, type NavGroup } from "./nav";

const HOVER_CLOSE_DELAY = 150;

/** A header entry that opens a panel of links. Open state lives in the header (one open at a time). */
export function NavDropdown({
  group,
  pathname,
  open,
  onOpenChange,
}: {
  group: NavGroup;
  pathname: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const ref = useRef<HTMLLIElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number | undefined>(undefined);
  // The header passes a fresh callback each render; the listeners below read the latest one.
  const onOpenChangeRef = useRef(onOpenChange);
  useEffect(() => {
    onOpenChangeRef.current = onOpenChange;
  });
  const active = isGroupActive(pathname, group);
  const items = group.items ?? [];

  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) onOpenChangeRef.current(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      onOpenChangeRef.current(false);
      triggerRef.current?.focus();
    };
    document.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  // Set when hover opened the panel, so the click that usually follows doesn't toggle it shut again.
  const openedByHover = useRef(false);

  const hoverOpen = (event: React.PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    window.clearTimeout(closeTimer.current);
    if (!open) openedByHover.current = true;
    onOpenChange(true);
  };
  const onTriggerClick = () => {
    onOpenChange(openedByHover.current || !open);
    openedByHover.current = false;
  };
  const hoverClose = (event: React.PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => {
      openedByHover.current = false;
      onOpenChangeRef.current(false);
    }, HOVER_CLOSE_DELAY);
  };

  const focusItem = (step: 1 | -1 | "first" | "last") => {
    const links = Array.from(panelRef.current?.querySelectorAll<HTMLElement>("a[href]") ?? []);
    if (links.length === 0) return;
    const current = links.indexOf(document.activeElement as HTMLElement);
    const next = step === "first" ? 0 : step === "last" ? links.length - 1 : (current + step + links.length) % links.length;
    links[next]?.focus();
  };

  const onTriggerKey = (event: React.KeyboardEvent) => {
    if (event.key !== "ArrowDown") return;
    event.preventDefault();
    onOpenChange(true);
    // The panel mounts on the next frame.
    requestAnimationFrame(() => focusItem("first"));
  };

  const onPanelKey = (event: React.KeyboardEvent) => {
    const moves: Record<string, 1 | -1 | "first" | "last"> = { ArrowDown: 1, ArrowUp: -1, Home: "first", End: "last" };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    focusItem(move);
  };

  return (
    <li ref={ref} className="relative" onPointerEnter={hoverOpen} onPointerLeave={hoverClose}>
      <button
        ref={triggerRef}
        type="button"
        onClick={onTriggerClick}
        onKeyDown={onTriggerKey}
        aria-expanded={open}
        aria-haspopup="menu"
        className={cn(
          "relative flex items-center gap-1 rounded-full px-2.5 py-2 text-sm font-semibold transition-colors xl:px-3.5 xl:text-[0.95rem]",
          active || open ? "text-emerald-deep" : "text-muted hover:text-ink",
        )}
      >
        {active && (
          <motion.span
            layoutId="nav-pill"
            className="absolute inset-0 -z-10 rounded-full bg-emerald-soft"
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
          />
        )}
        {group.label}
        <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} aria-hidden />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            role="menu"
            aria-label={group.label}
            onKeyDown={onPanelKey}
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.16 }}
            // pt-2 instead of a margin keeps the hover bridge between trigger and panel unbroken.
            className="absolute inset-s-0 top-full z-50 w-72 max-w-[calc(100vw-2rem)] pt-2"
          >
            <div className="rounded-3xl border border-line bg-white p-2 shadow-lift">
              {items.map((item) => {
                const Icon = item.icon;
                const current = isActivePath(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    role="menuitem"
                    onClick={() => onOpenChange(false)}
                    aria-current={current ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl p-2.5 outline-none transition-colors focus-visible:bg-emerald-mist",
                      current ? "bg-emerald-soft" : "hover:bg-emerald-mist",
                    )}
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gold-mist text-gold-deep">
                      <Icon className="size-[1.1rem]" aria-hidden />
                    </span>
                    <span className="min-w-0">
                      <span className={cn("block text-sm font-bold", current ? "text-emerald-deep" : "text-ink")}>{item.label}</span>
                      <span className="block truncate text-xs text-muted">{item.description}</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}
