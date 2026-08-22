"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import type { ScholarProfile, Topic } from "@/domain";
import { AppShell, type NavigationItem } from "@/components/layout";
import { DiscoveryRail, ShellActions, ShellSearch } from "./ShellComposition";

const focusedAuthRoutes = new Set([
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
]);

function isFocusedAuthRoute(pathname: string): boolean {
  return pathname.startsWith("/auth/") || focusedAuthRoutes.has(pathname);
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

  if (isFocusedAuthRoute(pathname)) return children;

  return (
    <AppShell
      navigation={navigation}
      search={<ShellSearch />}
      actions={<ShellActions />}
      contextualRail={<DiscoveryRail topics={topics} scholars={scholars} />}
      unreadNotifications={unreadNotifications}
    >
      {children}
    </AppShell>
  );
}
