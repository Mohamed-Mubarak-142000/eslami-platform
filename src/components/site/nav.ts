import type { Route } from "next";
import {
  Award,
  BookOpen,
  BookOpenCheck,
  CalendarDays,
  CalendarRange,
  Clapperboard,
  Clock,
  Compass,
  GraduationCap,
  Headphones,
  Home,
  Radio,
  ScrollText,
  Sparkles,
  Sun,
  Trees,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  href: Route;
  label: string;
  icon: LucideIcon;
  description: string;
  /** Only shown while a signed-in account has one of its children selected. */
  kidsOnly?: boolean;
  /** Only shown to signed-in users. */
  signedInOnly?: boolean;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/", label: "الرئيسية", icon: Home, description: "البداية" },
  { href: "/quran", label: "المصحف", icon: BookOpen, description: "اقرأ القرآن الكريم في مصحف مصفّح" },
  { href: "/listen", label: "الاستماع", icon: Headphones, description: "تلاوات لأكثر من مئتي قارئ" },
  { href: "/radio", label: "الإذاعة", icon: Radio, description: "إذاعة القرآن الكريم بث مباشر" },
  { href: "/hadith", label: "الأحاديث", icon: ScrollText, description: "أحاديث نبوية مع شرحها وفوائدها" },
  { href: "/stories", label: "القصص", icon: Clapperboard, description: "قصص الأنبياء المصوّرة", signedInOnly: true },
  { href: "/kids", label: "الأطفال", icon: Trees, description: "حديقة القرآن للأطفال", kidsOnly: true },
  { href: "/prayer-times", label: "المواقيت", icon: Clock, description: "مواقيت الصلاة واتجاه القبلة" },
  { href: "/calendar", label: "التقويم", icon: CalendarDays, description: "التقويم الهجري والميلادي" },
  { href: "/adhkar", label: "الأذكار", icon: Sparkles, description: "أذكار وأدعية يومك" },
];

/** The learner's own pages — header only, kept out of the footer and home sections. */
export const JOURNEY_ITEMS: readonly NavItem[] = [
  { href: "/dashboard", label: "رحلتي", icon: BookOpenCheck, description: "حفظك وتسميعك وإنجازاتك", signedInOnly: true },
  { href: "/plan", label: "خطة الحفظ", icon: CalendarRange, description: "وردك اليومي وخطتك", signedInOnly: true },
  { href: "/exams", label: "اختبارات الأجزاء", icon: GraduationCap, description: "اختبر حفظك جزءًا جزءًا", signedInOnly: true },
  { href: "/certificates/mine", label: "شهاداتي", icon: Award, description: "شهادات الأجزاء التي أتممتها", signedInOnly: true },
];

export interface NavGroup {
  id: string;
  label: string;
  icon: LucideIcon;
  description?: string;
  /** A direct link instead of a dropdown. */
  href?: Route;
  items?: readonly NavItem[];
}

const byHref = (href: string) => {
  const item = [...NAV_ITEMS, ...JOURNEY_ITEMS].find((entry) => entry.href === href);
  if (!item) throw new Error(`Unknown nav item ${href}`);
  return item;
};

export const NAV_GROUPS: readonly NavGroup[] = [
  { id: "home", label: "الرئيسية", icon: Home, description: "البداية", href: "/" },
  { id: "quran", label: "القرآن والسنة", icon: BookOpen, items: ["/quran", "/listen", "/radio", "/hadith"].map(byHref) },
  { id: "journey", label: "رحلتي", icon: Compass, items: JOURNEY_ITEMS },
  { id: "stories", label: "القصص والأطفال", icon: Clapperboard, items: ["/stories", "/kids"].map(byHref) },
  { id: "daily", label: "يومي", icon: Sun, items: ["/prayer-times", "/calendar", "/adhkar"].map(byHref) },
];

/**
 * Groups the current visitor can see: hidden items dropped, empty groups removed, and a group left
 * with a single item collapsed into a direct link to it.
 */
export function visibleGroups(
  groups: readonly NavGroup[],
  { signedIn, childSelected }: { signedIn: boolean; childSelected: boolean },
): NavGroup[] {
  return groups.flatMap((group): NavGroup[] => {
    if (!group.items) return [group];
    const items = group.items.filter((item) => (!item.kidsOnly || childSelected) && (!item.signedInOnly || signedIn));
    if (items.length === 0) return [];
    if (items.length === 1) {
      const [only] = items as [NavItem];
      return [{ id: group.id, label: only.label, icon: only.icon, description: only.description, href: only.href }];
    }
    return [{ ...group, items }];
  });
}

export function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isGroupActive(pathname: string, group: NavGroup): boolean {
  if (group.href) return isActivePath(pathname, group.href);
  return group.items?.some((item) => isActivePath(pathname, item.href)) ?? false;
}
