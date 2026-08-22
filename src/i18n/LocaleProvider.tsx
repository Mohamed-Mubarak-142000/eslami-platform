"use client";

import { createContext, use, type ReactNode } from "react";
import { dictionaries, type Dictionary, type DictionaryNamespace } from "./dictionaries";
import { defaultLocale, dirFor, localeCookieName, type Locale } from "./locales";

interface LocaleContextValue {
  locale: Locale;
  dir: "rtl" | "ltr";
  dictionary: Dictionary;
  setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: defaultLocale,
  dir: dirFor[defaultLocale],
  dictionary: dictionaries[defaultLocale],
  setLocale: () => {},
});

/** Default context value covers unwrapped renders (e.g. unit tests) with the Arabic dictionary. */
export function LocaleProvider({ initialLocale, children }: { initialLocale: Locale; children: ReactNode }) {
  function setLocale(next: Locale) {
    document.cookie = `${localeCookieName}=${next}; path=/; max-age=31536000; samesite=lax`;
    window.location.reload();
  }

  return (
    <LocaleContext
      value={{ locale: initialLocale, dir: dirFor[initialLocale], dictionary: dictionaries[initialLocale], setLocale }}
    >
      {children}
    </LocaleContext>
  );
}

export function useLocale(): Omit<LocaleContextValue, "dictionary"> {
  const { locale, dir, setLocale } = use(LocaleContext);
  return { locale, dir, setLocale };
}

export function useTranslations<K extends DictionaryNamespace>(namespace: K): Dictionary[K] {
  return use(LocaleContext).dictionary[namespace];
}
