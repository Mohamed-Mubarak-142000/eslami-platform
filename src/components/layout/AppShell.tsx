import type { ReactNode } from "react";
import "@/styles/tokens.css";
import "@/styles/foundations.css";
import "./layout.css";

export interface NavigationItem { href: string; label: string }
export interface AppShellProps { children: ReactNode; navigation: readonly NavigationItem[]; title?: string; contextualRail?: ReactNode; unreadNotifications?: number; nested?: boolean }
export function AppShell({ children, navigation, title = "بصيرة", contextualRail, unreadNotifications = 0, nested = false }: AppShellProps) {
  const content = nested
    ? <div className="app-shell__main">{children}</div>
    : <main className="app-shell__main" id="main-content" tabIndex={-1}>{children}</main>;
  return <div className="app-shell" dir="rtl">{!nested && <a className="app-shell__skip" href="#main-content">تجاوز إلى المحتوى</a>}<header className="app-shell__header"><a href="/" className="app-shell__brand">{title}</a>{unreadNotifications > 0 && <a href="/notifications" aria-label={`لديك ${unreadNotifications} إشعارات غير مقروءة`}>الإشعارات ({unreadNotifications})</a>}</header><nav className="app-shell__nav" aria-label="التنقل الأساسي">{navigation.map((item) => <a key={item.href} href={item.href}>{item.label}</a>)}</nav>{content}{contextualRail && <aside className="app-shell__rail">{contextualRail}</aside>}</div>;
}
