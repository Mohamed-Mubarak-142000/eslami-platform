import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Shield } from "lucide-react";
import { requireAdmin } from "@/features/auth/session";
import { AdminNav } from "@/features/admin/AdminNav";

export const metadata: Metadata = { title: { default: "لوحة الإدارة", template: "%s — لوحة الإدارة" }, robots: { index: false } };

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // Pages and actions re-check the role too; a layout alone is not an authorization boundary.
  await requireAdmin();
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="flex items-center gap-2 text-3xl font-bold text-emerald-deep">
          <Shield className="size-7 text-gold-deep" aria-hidden /> لوحة الإدارة
        </h1>
        <AdminNav />
      </div>
      {children}
    </div>
  );
}
