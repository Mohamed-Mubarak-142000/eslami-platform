"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useRef, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Award, BookOpenCheck, ChevronDown, GraduationCap, LogIn, LogOut, Settings, Shield } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { buttonClass } from "@/components/ui/button";
import { signOutAction } from "../actions";
import { useAccount, useAccountContext, type AccountSummary } from "@/features/account/AccountProvider";

const LINKS: { href: Route; label: string; icon: LucideIcon; admin?: boolean }[] = [
  { href: "/dashboard", label: "رحلتي", icon: BookOpenCheck },
  { href: "/exams", label: "اختبارات الأجزاء", icon: GraduationCap },
  { href: "/certificates/mine", label: "شهاداتي", icon: Award },
  { href: "/account", label: "حسابي", icon: Settings },
  { href: "/admin", label: "لوحة الإدارة", icon: Shield, admin: true },
];

function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      className={cn("grid size-9 shrink-0 place-items-center rounded-full bg-gold font-display font-bold text-emerald-night", className)}
    >
      {name.trim().charAt(0) || "؟"}
    </span>
  );
}

export function AccountLinks({ account, onNavigate }: { account: AccountSummary; onNavigate?: () => void }) {
  return (
    <>
      {LINKS.filter((link) => !link.admin || account.role === "admin").map((link) => {
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            {...(onNavigate ? { onClick: onNavigate } : {})}
            className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold text-ink hover:bg-emerald-mist"
          >
            <Icon className="size-4 text-gold-deep" aria-hidden /> {link.label}
          </Link>
        );
      })}
      <SignOutButton />
    </>
  );
}

function SignOutButton() {
  const { signOut } = useAccountContext();
  const [pending, startSignOut] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      // A plain button, not a <form>: the menu closes (and unmounts) on click, which could cancel a
      // form submission. The transition keeps running after unmount.
      onClick={() =>
        startSignOut(async () => {
          await signOut();
          await signOutAction(); // clears the server cookies too, then redirects home
        })
      }
      className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold text-rose hover:bg-rose/10 disabled:opacity-60"
    >
      <LogOut className="size-4" aria-hidden /> {pending ? "جارٍ الخروج…" : "تسجيل الخروج"}
    </button>
  );
}

/** Header account control: "دخول" when signed out, avatar + dropdown when signed in. */
export function AccountMenu() {
  const state = useAccount();
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

  if (state.status === "disabled") return null;
  if (state.status === "loading") return <span className="size-10 animate-pulse rounded-full bg-line" aria-hidden />;
  if (state.status === "signed-out") {
    return (
      <Link href="/login" className={buttonClass("primary", "sm")}>
        <LogIn aria-hidden /> دخول
      </Link>
    );
  }

  const { account } = state;
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-full border border-line bg-white py-1 pe-3 ps-1 shadow-soft"
      >
        <Avatar name={account.name} />
        <span className="hidden max-w-28 truncate text-sm font-bold text-ink sm:block">{account.name}</span>
        <ChevronDown className={cn("size-4 text-muted transition-transform", open && "rotate-180")} aria-hidden />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            className="absolute left-0 top-12 z-50 w-60 rounded-3xl border border-line bg-white p-2 shadow-lift"
          >
            <div className="flex items-center gap-3 border-b border-line px-3 pb-3 pt-2">
              <Avatar name={account.name} />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{account.name}</p>
                <p className="truncate text-xs text-muted" dir="ltr">
                  {account.email}
                </p>
              </div>
            </div>
            <div className="pt-1" onClick={() => setOpen(false)}>
              <AccountLinks account={account} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
