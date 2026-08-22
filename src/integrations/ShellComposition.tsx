"use client";

import Link from "next/link";
import type { ScholarProfile, Topic } from "@/domain";
import { useTranslations } from "@/i18n/LocaleProvider";

export function ShellSearch() {
  const t = useTranslations("shell");
  return (
    <form className="shell-search" action="/search" method="get">
      <label className="ds-visually-hidden" htmlFor="shell-search-query">
        {t.searchLabel}
      </label>
      <input
        id="shell-search-query"
        name="q"
        type="search"
        inputMode="search"
        autoComplete="off"
        placeholder={t.searchPlaceholder}
      />
      <button type="submit">{t.searchSubmit}</button>
    </form>
  );
}

export function ShellActions() {
  const t = useTranslations("shell");
  return (
    <div className="shell-actions" aria-label={t.accountActions}>
      <Link href="/settings/privacy" aria-label={t.settings}>
        {t.settings}
      </Link>
      <Link href="/me/questions" aria-label={t.account}>
        {t.account}
      </Link>
    </div>
  );
}

export function DiscoveryRail({
  topics,
  scholars,
}: {
  topics: readonly Topic[];
  scholars: readonly ScholarProfile[];
}) {
  const t = useTranslations("shell");
  return (
    <div className="discovery-rail">
      <header>
        <p>{t.library}</p>
        <h2>{t.discoverMore}</h2>
      </header>

      <section aria-labelledby="discovery-topics-title">
        <h3 id="discovery-topics-title">{t.suggestedTopics}</h3>
        <ul>
          {topics.map((topic) => (
            <li key={topic.id}>
              <Link href={`/topics/${topic.slug}`}>{topic.name}</Link>
            </li>
          ))}
        </ul>
        <Link className="discovery-rail__more" href="/explore">
          {t.browseAllTopics}
        </Link>
      </section>

      <section aria-labelledby="discovery-scholars-title">
        <h3 id="discovery-scholars-title">{t.scholarsAndResearchers}</h3>
        <ul>
          {scholars.map((scholar) => (
            <li key={scholar.id}>
              <Link href={`/scholars/${scholar.slug}`}>
                <span aria-hidden="true">{scholar.displayName.slice(0, 2)}</span>
                <span>
                  <strong>{scholar.displayName}</strong>
                  <small>{t.trialVerifiedProfile}</small>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
