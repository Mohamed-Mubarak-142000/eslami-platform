import { Bell, Bookmark, Compass, Home, PenSquare, Search, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import "@/lib/styles/tailwind.css";
import "@/styles/tokens.css";
import "@/styles/foundations.css";
import "./layout.css";

export interface NavigationItem { href: string; label: string; active?: boolean }

const navIcons: Record<string, LucideIcon> = {
  "/": Home,
  "/explore": Compass,
  "/search": Search,
  "/saved": Bookmark,
};

function iconFor(href: string): LucideIcon {
  if (navIcons[href]) return navIcons[href];
  if (href.startsWith("/ask")) return PenSquare;
  return Compass;
}

function NavLinks({ navigation, variant }: { navigation: readonly NavigationItem[]; variant: "top" | "bottom" }) {
  return (
    <>
      {navigation.map((item) => {
        const Icon = iconFor(item.href);
        return (
          <a key={item.href} href={item.href} aria-current={item.active ? "page" : undefined} data-active={item.active || undefined} title={variant === "top" ? item.label : undefined}>
            <span className="app-shell__nav-icon" aria-hidden="true"><Icon size={variant === "top" ? 22 : 20} strokeWidth={2.25} /></span>
            <span className="app-shell__nav-label">{item.label}</span>
          </a>
        );
      })}
    </>
  );
}

export interface AppShellProps {
  children: ReactNode;
  navigation: readonly NavigationItem[];
  title?: string;
  navigationRail?: ReactNode;
  contextualRail?: ReactNode;
  unreadNotifications?: number;
  nested?: boolean;
  search?: ReactNode;
  actions?: ReactNode;
  controls?: ReactNode;
  compactHeader?: boolean;
  navigationLabel?: string;
  navigationRailLabel?: string;
  railLabel?: string;
  skipToContentLabel?: string;
  notificationsLabel?: string;
  unreadNotificationsLabel?: (count: number) => string;
}

export function AppShell({
  children,
  navigation,
  title = "بصيرة",
  navigationRail,
  contextualRail,
  unreadNotifications = 0,
  nested = false,
  search,
  actions,
  controls,
  compactHeader = false,
  navigationLabel = "التنقل الأساسي",
  navigationRailLabel = navigationLabel,
  railLabel = "اكتشف المزيد",
  skipToContentLabel = "تجاوز إلى المحتوى",
  notificationsLabel = "الإشعارات",
  unreadNotificationsLabel = (count) => `لديك ${count} إشعارات غير مقروءة`,
}: AppShellProps) {
  const content = nested
    ? <div className="app-shell__main">{children}</div>
    : <main className="app-shell__main" id="main-content" tabIndex={-1}>{children}</main>;

  return (
    <div
      className={cn("app-shell", "bg-background text-foreground")}
      data-nested={nested || undefined}
      data-compact-header={compactHeader || undefined}
      data-leading-rail={navigationRail ? "visible" : undefined}
      data-rail={contextualRail ? "visible" : undefined}
    >
      {!nested && <a className="app-shell__skip" href="#main-content">{skipToContentLabel}</a>}
      <header className="app-shell__header">
        <div className="app-shell__header-start">
          <a href="/" className="app-shell__brand" aria-label={`${title} — الصفحة الرئيسية`}>
            <span className="app-shell__brand-mark" aria-hidden="true">{title.slice(0, 1)}</span>
          </a>
          {search && <div className="app-shell__search" role="search">{search}</div>}
        </div>
        <nav className="app-shell__topnav" aria-label={navigationLabel}>
          <NavLinks navigation={navigation} variant="top" />
        </nav>
        <div className="app-shell__actions">
          {actions}
          {unreadNotifications > 0 && (
            <a className="app-shell__notifications" href="/notifications" aria-label={unreadNotificationsLabel(unreadNotifications)}>
              <Bell aria-hidden="true" size={20} />
              <span className="app-shell__notifications-label">{notificationsLabel}</span>
              <span className="app-shell__notifications-badge" aria-hidden="true">{unreadNotifications}</span>
            </a>
          )}
          {controls}
        </div>
      </header>
      <nav className="app-shell__nav" aria-label={navigationLabel}>
        <NavLinks navigation={navigation} variant="bottom" />
      </nav>
      {navigationRail && <aside className="app-shell__leading-rail" aria-label={navigationRailLabel}>{navigationRail}</aside>}
      {content}
      {contextualRail && <aside className="app-shell__rail" aria-label={railLabel}>{contextualRail}</aside>}
    </div>
  );
}
