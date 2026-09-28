import Link from "next/link";
import { Divider } from "@/components/ui/Ornament";
import { Logo } from "./Logo";
import { NAV_ITEMS } from "./nav";

export function SiteFooter() {
  return (
    <footer className="relative isolate mt-24 overflow-hidden bg-emerald-night text-white">
      <div className="pattern-stars-light absolute inset-0 -z-10" />
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo tone="light" />
          <p className="mt-5 max-w-sm text-sm leading-7 text-white/70">
            منصة عربية هادئة لقراءة القرآن الكريم والاستماع إليه، ومرافقة يومك بالذكر، ومساحة ممتعة يتعلّم فيها أطفالك.
          </p>
        </div>
        <nav aria-label="روابط التذييل">
          <h2 className="text-sm font-bold text-gold-soft">الأقسام</h2>
          <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-white/75 transition-colors hover:text-gold-soft">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <h2 className="text-sm font-bold text-gold-soft">مصادر المحتوى</h2>
          <ul className="mt-4 space-y-2.5 text-sm text-white/70">
            <li>نص المصحف والتفسير الميسّر: AlQuran Cloud</li>
            <li>أحكام التجويد: Quran.com</li>
            <li>التلاوات: mp3quran.net و everyayah.com</li>
            <li>المواقيت: AlAdhan</li>
          </ul>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 pb-8 sm:px-6">
        <Divider tone="light" />
        <p className="mt-6 flex justify-center gap-5 text-xs">
          <Link href="/privacy" className="text-white/70 transition-colors hover:text-gold-soft">
            سياسة الخصوصية
          </Link>
          <Link href="/terms" className="text-white/70 transition-colors hover:text-gold-soft">
            شروط الاستخدام
          </Link>
        </p>
        <p className="mt-3 text-center text-xs text-white/55">© {new Date().getFullYear()} المنارة — جميع الحقوق محفوظة</p>
      </div>
    </footer>
  );
}
