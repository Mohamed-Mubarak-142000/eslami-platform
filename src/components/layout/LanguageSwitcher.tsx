"use client";

import { useLocale, useTranslations } from "@/i18n/LocaleProvider";

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();
  const t = useTranslations("shell");
  const next = locale === "ar" ? "en" : "ar";
  const label = next === "en" ? "English" : "العربية";

  return (
    <button type="button" className="shell-control shell-control--language" aria-label={t.switchLanguage} title={t.switchLanguage} onClick={() => setLocale(next)}>
      {label}
    </button>
  );
}
