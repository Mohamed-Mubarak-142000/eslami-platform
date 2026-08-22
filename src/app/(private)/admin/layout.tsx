import type { ReactNode } from "react";
import { AdminShell } from "@/components/layout";
const navigation = [{ href: "/admin/moderation", label: "الإشراف" }, { href: "/admin/verification", label: "التوثيق" }, { href: "/admin/taxonomy", label: "التصنيفات" }];
export default function Layout({ children }: { children: ReactNode }) { return <AdminShell navigation={navigation}>{children}</AdminShell>; }
