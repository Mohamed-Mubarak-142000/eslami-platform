import type { Locale } from "../locales";
import { adminDictionary } from "./admin";
import { authDictionary } from "./auth";
import { commonDictionary } from "./common";
import { exploreDictionary } from "./explore";
import { feedDictionary } from "./feed";
import { metaDictionary } from "./meta";
import { notificationsDictionary } from "./notifications";
import { patternsDictionary } from "./patterns";
import { questionsDictionary } from "./questions";
import { scholarsDictionary } from "./scholars";
import { shellDictionary } from "./shell";
import { stateDictionary } from "./state";
import { verificationDictionary } from "./verification";

function forLocale(locale: Locale) {
  return {
    meta: metaDictionary[locale],
    shell: shellDictionary[locale],
    common: commonDictionary[locale],
    state: stateDictionary[locale],
    patterns: patternsDictionary[locale],
    auth: authDictionary[locale],
    feed: feedDictionary[locale],
    explore: exploreDictionary[locale],
    questions: questionsDictionary[locale],
    notifications: notificationsDictionary[locale],
    scholars: scholarsDictionary[locale],
    verification: verificationDictionary[locale],
    admin: adminDictionary[locale],
  };
}

export const dictionaries = { ar: forLocale("ar"), en: forLocale("en") } as const satisfies Record<Locale, unknown>;

export type Dictionary = (typeof dictionaries)[Locale];
export type DictionaryNamespace = keyof Dictionary;
