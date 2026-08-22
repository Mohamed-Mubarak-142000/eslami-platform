import type { ReactNode } from "react";
import { AppShell, type NavigationItem } from "./AppShell";

export function AdminShell({ children, navigation }: { children: ReactNode; navigation: readonly NavigationItem[] }) { return <AppShell title="المنارة — الإدارة" navigation={navigation} nested>{children}</AppShell>; }
