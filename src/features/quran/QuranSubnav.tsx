import Link from "next/link";
import "./quran.css";

const TABS = [
  { key: "listen", href: "/quran", label: "الاستماع" },
  { key: "kids", href: "/quran/kids", label: "تعليم الأطفال" },
  { key: "read", href: "/quran/read", label: "قراءة القرآن" },
] as const;

export function QuranSubnav({ active }: { active: (typeof TABS)[number]["key"] }) {
  return (
    <nav className="quran-subnav" aria-label="أقسام القرآن الكريم">
      {TABS.map((tab) => (
        <Link key={tab.key} href={tab.href} aria-current={tab.key === active || undefined}>
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
