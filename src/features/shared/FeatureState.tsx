"use client";

import type { ReactNode } from "react";
import { useTranslations } from "@/i18n/LocaleProvider";
import { Button } from "@/components/ui";
import { StatePanel, type StateKind } from "@/components/patterns";

export type FeatureStatus = "ready" | StateKind;

export function FeatureState({ status, children, onRetry }: { status?: FeatureStatus; children: ReactNode; onRetry?: () => void }) {
  const t = useTranslations("state");
  if (!status || status === "ready") return <>{children}</>;
  const value = t[status];
  return <StatePanel kind={status} title={value.title} message={value.message} action={onRetry && (status === "error" || status === "offline") ? <Button onClick={onRetry}>{t.retry}</Button> : undefined} />;
}

export function OfflineNotice({ cachedAt }: { cachedAt?: string }) {
  const t = useTranslations("state");
  return <aside role="status" aria-live="polite">{t.offlineNotice}{cachedAt && <> {t.lastVersion} <time dateTime={cachedAt}>{cachedAt}</time></>}</aside>;
}
