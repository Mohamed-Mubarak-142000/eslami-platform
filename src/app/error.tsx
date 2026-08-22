"use client";
import { useEffect } from "react";
import { useTranslations } from "@/i18n/LocaleProvider";
import { services } from "@/integrations";
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("common");
  useEffect(() => services.errors.capture(error, { area: "app", ...(error.digest ? { code: error.digest } : {}) }), [error]);
  return <section role="alert"><h1>{t.errorPageTitle}</h1><p>{t.errorPageMessage}</p><button onClick={reset}>{t.retry}</button></section>;
}
