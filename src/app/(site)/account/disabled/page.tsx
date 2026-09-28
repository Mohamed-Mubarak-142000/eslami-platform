import type { Metadata } from "next";
import { ShieldOff } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { signOutAction } from "@/features/auth/actions";

export const metadata: Metadata = { title: "الحساب موقوف", robots: { index: false } };

export default function AccountDisabledPage() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
      <span className="grid size-16 place-items-center rounded-3xl bg-rose/10 text-rose">
        <ShieldOff className="size-8" aria-hidden />
      </span>
      <h1 className="mt-6 text-3xl font-bold text-emerald-deep">هذا الحساب موقوف</h1>
      <p className="mt-3 text-muted">
        أوقفت إدارة المنصة هذا الحساب. يمكنك الاستمرار في استخدام الموقع كزائر، وسيبقى تقدّمك محفوظًا إن أُعيد تفعيل الحساب.
      </p>
      <form action={signOutAction} className="mt-8">
        <button type="submit" className={buttonClass("primary", "lg")}>
          تسجيل الخروج
        </button>
      </form>
    </div>
  );
}
