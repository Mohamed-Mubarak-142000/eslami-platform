"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { Award, BellRing, Clapperboard, LayoutDashboard, Mail, Users } from "lucide-react";
import { cn } from "@/lib/cn";

const TABS: { href: Route; label: string; icon: typeof Users }[] = [
  { href: "/admin", label: "نظرة عامة", icon: LayoutDashboard },
  { href: "/admin/users", label: "المستخدمون", icon: Users },
  { href: "/admin/certificates", label: "الشهادات", icon: Award },
  { href: "/admin/stories", label: "قصص الأطفال", icon: Clapperboard },
  { href: "/admin/emails", label: "الرسائل", icon: Mail },
  { href: "/admin/reminders", label: "التذكيرات", icon: BellRing },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="أقسام الإدارة" className="flex gap-2 overflow-x-auto pb-1">
      {TABS.map(({ href, label, icon: Icon }) => {
        const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-bold",
              active ? "bg-emerald-deep text-white" : "border border-line bg-white text-ink hover:bg-emerald-mist",
            )}
          >
            <Icon className="size-4" aria-hidden /> {label}
          </Link>
        );
      })}
    </nav>
  );
}
