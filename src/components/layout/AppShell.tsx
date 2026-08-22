import type { ReactNode } from "react";
import "@/styles/tokens.css";
import "@/styles/foundations.css";
import "./layout.css";

export interface NavigationItem { href: string; label: string }

export interface AppShellProps {
  children: ReactNode;
  navigation: readonly NavigationItem[];
  title?: string;
  contextualRail?: ReactNode;
  unreadNotifications?: number;
  nested?: boolean;
  search?: ReactNode;
  actions?: ReactNode;
  navigationLabel?: string;
  railLabel?: string;
}

export function AppShell({
  children,
  navigation,
  title = "بصيرة",
  contextualRail,
  unreadNotifications = 0,
  nested = false,
  search,
  actions,
  navigationLabel = "التنقل الأساسي",
  railLabel = "اكتشف المزيد",
}: AppShellProps) {
  const content = nested
    ? <div className="app-shell__main">{children}</div>
    : <main className="app-shell__main" id="main-content" tabIndex={-1}>{children}</main>;

  return (
    <div className="app-shell" data-nested={nested || undefined} data-rail={contextualRail ? "visible" : undefined} dir="rtl">
      {!nested && <a className="app-shell__skip" href="#main-content">تجاوز إلى المحتوى</a>}
      <header className="app-shell__header">
        <a href="/" className="app-shell__brand" aria-label={`${title} — الصفحة الرئيسية`}>
          <span className="app-shell__brand-mark" aria-hidden="true">ب</span>
          <span>{title}</span>
        </a>
        {search && <div className="app-shell__search" role="search">{search}</div>}
        {(actions || unreadNotifications > 0) && (
          <div className="app-shell__actions">
            {actions}
            {unreadNotifications > 0 && (
              <a className="app-shell__notifications" href="/notifications" aria-label={`لديك ${unreadNotifications} إشعارات غير مقروءة`}>
                الإشعارات <span aria-hidden="true">({unreadNotifications})</span>
              </a>
            )}
          </div>
        )}
      </header>
      <nav className="app-shell__nav" aria-label={navigationLabel}>
        {navigation.map((item) => <a key={item.href} href={item.href}>{item.label}</a>)}
      </nav>
      {content}
      {contextualRail && <aside className="app-shell__rail" aria-label={railLabel}>{contextualRail}</aside>}
    </div>
  );
}
