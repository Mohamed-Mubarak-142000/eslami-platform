import Link from "next/link";
import { buttonClass } from "@/components/ui/button";
import { StarMark } from "@/components/ui/Ornament";

export default function NotFound() {
  return (
    <main className="pattern-stars grid min-h-dvh place-items-center px-4 text-center">
      <div>
        <StarMark className="mx-auto size-16 text-gold" />
        <h1 className="mt-6 text-3xl font-bold text-emerald-deep">الصفحة غير موجودة</h1>
        <p className="mt-3 text-muted">ربما نُقلت الصفحة أو تغيّر رابطها.</p>
        <Link href="/" className={buttonClass("primary", "lg", "mt-8")}>
          العودة للرئيسية
        </Link>
      </div>
    </main>
  );
}
