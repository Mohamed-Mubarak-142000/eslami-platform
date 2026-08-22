"use client";
import { useTranslations } from "@/i18n/LocaleProvider";
import { Button } from "@/components/ui";
import { FeatureState, type FeatureStatus } from "../shared/FeatureState";
export interface NotificationItem { id: string; title: string; occurredAt: string; unread: boolean; unavailable?: boolean; sensitive?: boolean }
export function Notifications({ items, status = "ready", onMarkAll }: { items: readonly NotificationItem[]; status?: FeatureStatus; onMarkAll?: () => void }) {
  const t = useTranslations("notifications");
  const actual = status === "ready" && items.length === 0 ? "empty" : status;
  return <section aria-labelledby="notifications-title"><h1 id="notifications-title">{t.title}</h1><Button variant="secondary" onClick={onMarkAll}>{t.markAllRead}</Button><FeatureState status={actual}><ul>{items.map(item => <li key={item.id}><strong>{item.sensitive ? t.sensitiveTitle : item.title}</strong><p>{item.unavailable ? t.unavailable : item.unread ? t.unread : t.read}</p><time dateTime={item.occurredAt}>{item.occurredAt}</time></li>)}</ul></FeatureState></section>;
}
