export const locales = ["ar", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "ar";
export const dirFor: Record<Locale, "rtl" | "ltr"> = { ar: "rtl", en: "ltr" };
export const localeCookieName = "basira-locale";

export function isLocale(value: string | undefined): value is Locale {
  return value !== undefined && (locales as readonly string[]).includes(value);
}
