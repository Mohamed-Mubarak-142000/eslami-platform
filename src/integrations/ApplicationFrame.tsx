"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import type { ScholarProfile, Topic } from "@/domain";
import { useTranslations } from "@/i18n/LocaleProvider";
import { AppShell, ThemeToggle, type NavigationItem } from "@/components/layout";
import { DiscoveryRail, ShellActions, ShortcutsRail } from "./ShellComposition";

const focusedAuthRoutes = new Set([
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
]);

function isFocusedAuthRoute(pathname: string): boolean {
  return pathname.startsWith("/auth/") || focusedAuthRoutes.has(pathname);
}

function isActiveHref(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function ApplicationFrame({
  children,
  navigation,
  topics,
  scholars,
  unreadNotifications = 0,
}: {
  children: ReactNode;
  navigation: readonly NavigationItem[];
  topics: readonly Topic[];
  scholars: readonly ScholarProfile[];
  unreadNotifications?: number;
}) {
  const pathname = usePathname();
  const t = useTranslations("shell");

  if (isFocusedAuthRoute(pathname)) return children;

  const activeNavigation = navigation.map((item) => ({ ...item, active: isActiveHref(pathname, item.href) }));

  return (
    <AppShell
      title={t.brand}
      navigation={activeNavigation}
      actions={<ShellActions />}
      navigationRail={<ShortcutsRail navigation={activeNavigation} topics={topics} />}
      contextualRail={<DiscoveryRail scholars={scholars} />}
      unreadNotifications={unreadNotifications}
      skipToContentLabel={t.skipToContent}
      notificationsLabel={t.notifications}
      unreadNotificationsLabel={t.unreadNotifications}
      navigationLabel={t.primaryNavigation}
      navigationRailLabel={t.primaryNavigation}
      railLabel={t.discoverMore}
      controls={<ThemeToggle />}
    >
      {children}
    </AppShell>
  );
}
