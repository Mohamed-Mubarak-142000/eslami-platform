"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Menu, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { Logo } from "./Logo";
import { NAV_GROUPS, isActivePath, isGroupActive, visibleGroups, type NavGroup, type NavItem } from "./nav";
import { NavDropdown } from "./NavDropdown";
import { AccountLinks, AccountMenu } from "@/features/auth/ui/AccountMenu";
import { useAccount } from "@/features/account/AccountProvider";
import { InstallAppButton } from "@/features/pwa/InstallAppButton";

const noopSubscribe = () => () => {};

export function SiteHeader() {
  const pathname = usePathname();
  const account = useAccount();
  const childSelected = account.status === "signed-in" && account.activeLearner.kind === "child";
  const signedIn = account.status === "signed-in";
  const groups = visibleGroups(NAV_GROUPS, { signedIn, childSelected });
  // Remember which page the menu was opened on, so navigating closes it without an effect.
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const open = openedOn === pathname;
  // Same trick for the desktop dropdowns: only one open, and navigating closes it.
  const [openGroup, setOpenGroup] = useState<{ id: string; on: string } | null>(null);
  const openGroupId = openGroup?.on === pathname ? openGroup.id : null;
  const setGroupOpen = (id: string, value: boolean) =>
    setOpenGroup((previous) => (value ? { id, on: pathname } : previous?.id === id ? null : previous));
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
            {groups.map((group) => {
              if (!group.href) {
                return (
                  <NavDropdown
                    key={group.id}
                    group={group}
                    pathname={pathname}
                    open={openGroupId === group.id}
                    onOpenChange={(value) => setGroupOpen(group.id, value)}
                  />
                );
              }
              const active = isActivePath(pathname, group.href);
              return (
                <li key={group.id}>
                  <Link
                    href={group.href}
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
                    {group.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="ms-auto flex items-center gap-2 lg:ms-3">
          <InstallAppButton />
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
                  <div className="flex-1 overflow-y-auto overscroll-contain p-3">
                    <MobileNavGroups groups={groups} pathname={pathname} onNavigate={close} />
                    {account.status === "signed-in" && (
                      <div className="mt-3 border-t border-line pt-3">
                        <AccountLinks account={account.account} onNavigate={close} />
                      </div>
                    )}
                  </div>
                  <div className="space-y-3 border-t border-line px-5 py-4">
                    <InstallAppButton variant="block" onDone={close} />
                    <p className="text-center text-xs text-muted">المنارة — قرآن · علم · ذكر</p>
                  </div>
                </motion.nav>
              </div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </header>
  );
}

function DrawerLink({ item, active, onNavigate }: { item: NavItem; active: boolean; onNavigate: () => void }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-14 items-center gap-3 rounded-2xl p-3 transition-colors",
        active ? "bg-emerald text-white" : "hover:bg-emerald-mist active:bg-emerald-mist",
      )}
    >
      <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", active ? "bg-white/15" : "bg-gold-mist text-gold-deep")}>
        <Icon className="size-5" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block font-bold">{item.label}</span>
        <span className={cn("block truncate text-xs", active ? "text-white/75" : "text-muted")}>{item.description}</span>
      </span>
    </Link>
  );
}

/** The drawer's grouped list: the current page's group starts expanded, the others fold away. */
function MobileNavGroups({ groups, pathname, onNavigate }: { groups: NavGroup[]; pathname: string; onNavigate: () => void }) {
  // Mounted fresh each time the drawer opens, so the initial state always follows the current page.
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(
    () => new Set(groups.filter((group) => !group.href && isGroupActive(pathname, group)).map((group) => group.id)),
  );
  const toggle = (id: string) =>
    setExpanded((previous) => {
      const next = new Set(previous);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  return (
    <ul className="space-y-1">
      {groups.map((group, index) => {
        const Icon = group.icon;
        const motionProps = {
          initial: { opacity: 0, x: 24 },
          animate: { opacity: 1, x: 0 },
          transition: { delay: 0.035 * index },
        };

        if (group.href) {
          const item = { href: group.href, label: group.label, icon: group.icon, description: group.description ?? "" };
          return (
            <motion.li key={group.id} {...motionProps}>
              <DrawerLink item={item} active={isActivePath(pathname, group.href)} onNavigate={onNavigate} />
            </motion.li>
          );
        }

        const isOpen = expanded.has(group.id);
        const active = isGroupActive(pathname, group);
        return (
          <motion.li key={group.id} {...motionProps}>
            <button
              type="button"
              onClick={() => toggle(group.id)}
              aria-expanded={isOpen}
              aria-controls={`mobile-nav-${group.id}`}
              className="flex min-h-12 w-full items-center gap-3 rounded-2xl px-3 py-2 text-start transition-colors hover:bg-emerald-mist active:bg-emerald-mist"
            >
              <Icon className={cn("size-5", active ? "text-emerald-deep" : "text-gold-deep")} aria-hidden />
              <span className={cn("flex-1 font-bold", active ? "text-emerald-deep" : "text-ink")}>{group.label}</span>
              <span className="text-xs text-muted">{group.items?.length}</span>
              <ChevronDown className={cn("size-4 text-muted transition-transform", isOpen && "rotate-180")} aria-hidden />
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.ul
                  id={`mobile-nav-${group.id}`}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22 }}
                  className="space-y-1 overflow-hidden ps-3"
                >
                  {group.items?.map((item) => (
                    <li key={item.href} className="first:pt-1">
                      <DrawerLink item={item} active={isActivePath(pathname, item.href)} onNavigate={onNavigate} />
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </motion.li>
        );
      })}
    </ul>
  );
}
