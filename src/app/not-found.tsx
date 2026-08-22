import { cookies } from "next/headers";
import { dictionaries } from "@/i18n/dictionaries";
import { defaultLocale, isLocale, localeCookieName } from "@/i18n/locales";

export default async function NotFound() {
  const store = await cookies();
  const cookieLocale = store.get(localeCookieName)?.value;
  const t = dictionaries[isLocale(cookieLocale) ? cookieLocale : defaultLocale].common;
  return <section><h1>{t.notFoundTitle}</h1><p>{t.notFoundMessage}</p></section>;
}
