import type { Route } from "next";
import { BookOpen, CalendarDays, Clock, Headphones, Home, Radio, Sparkles, Trees } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  href: Route;
  label: string;
  icon: LucideIcon;
  description: string;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/", label: "الرئيسية", icon: Home, description: "البداية" },
  { href: "/quran", label: "المصحف", icon: BookOpen, description: "اقرأ القرآن الكريم في مصحف مصفّح" },
  { href: "/listen", label: "الاستماع", icon: Headphones, description: "تلاوات لأكثر من مئتي قارئ" },
  { href: "/radio", label: "الإذاعة", icon: Radio, description: "إذاعة القرآن الكريم بث مباشر" },
  { href: "/kids", label: "الأطفال", icon: Trees, description: "حديقة القرآن للأطفال" },
  { href: "/prayer-times", label: "المواقيت", icon: Clock, description: "مواقيت الصلاة واتجاه القبلة" },
  { href: "/calendar", label: "التقويم", icon: CalendarDays, description: "التقويم الهجري والميلادي" },
  { href: "/adhkar", label: "الأذكار", icon: Sparkles, description: "أذكار وأدعية يومك" },
];

export function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
