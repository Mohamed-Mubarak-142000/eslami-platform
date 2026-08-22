"use client";
import { useState, type FormEvent } from "react";
import { BookOpen, Search, Sparkles, UsersRound } from "lucide-react";
import type { KnowledgeContent, ScholarProfile, Topic } from "@/domain";
import { useTranslations } from "@/i18n/LocaleProvider";
import { Button, TextField } from "@/components/ui";
import { ScholarIdentity } from "@/components/patterns";
import { ContentCard } from "../content/ContentFeatures";
import { FeatureState, type FeatureStatus } from "../shared/FeatureState";
import "../shared/social-pages.css";

export function Explore({ topics, scholars }: { topics: readonly Topic[]; scholars: readonly ScholarProfile[] }) {
  const t = useTranslations("explore");
  return <section className="social-page" aria-labelledby="explore-title"><header className="social-page__hero"><span><Sparkles aria-hidden="true" /></span><div><p>مساحات معرفية موثوقة</p><h1 id="explore-title">{t.exploreTitle}</h1></div></header><section className="social-panel" aria-labelledby="topics-title"><div className="social-panel__heading"><BookOpen aria-hidden="true" /><h2 id="topics-title">{t.topicsHeading}</h2></div><ul className="topic-grid">{topics.map(topic => <li key={topic.id}><a href={`/topics/${topic.slug}`}>{topic.name}<span aria-hidden="true">←</span></a></li>)}</ul></section><section className="social-panel" aria-labelledby="scholars-title"><div className="social-panel__heading"><UsersRound aria-hidden="true" /><h2 id="scholars-title">{t.scholarsHeading}</h2></div><div className="scholar-grid">{scholars.map(item => <ScholarIdentity key={item.id} name={item.displayName} specialty={t.specialtyLabel} initials={item.displayName.slice(0, 2)} status={item.verificationStatus === "approved" ? "approved" : "unverified"} />)}</div></section></section>;
}

export function SearchResults({ items, initialQuery = "", status = "ready", onSearch }: { items: readonly KnowledgeContent[]; initialQuery?: string; status?: FeatureStatus; onSearch?: (query: string) => void }) {
  const t = useTranslations("explore");
  const [query, setQuery] = useState(initialQuery);
  function submit(e: FormEvent) { e.preventDefault(); onSearch?.(query); }
  const actual = status === "ready" && items.length === 0 ? "empty" : status;
  return <section className="social-page social-search" aria-labelledby="search-title"><header className="social-page__hero"><span><Search aria-hidden="true" /></span><div><p>ابحث في المصادر والمحتوى</p><h1 id="search-title">{t.searchTitle}</h1></div></header><form className="social-search__form" role="search" onSubmit={submit}><TextField id="knowledge-search" label={t.searchLabel} value={query} onChange={e => setQuery(e.currentTarget.value)} /><Button type="submit"><Search size={18} aria-hidden="true" />{t.searchSubmit}</Button></form><div className="social-search__results"><FeatureState status={actual}>{items.map(item => <ContentCard key={item.id} content={item} />)}</FeatureState>{actual === "empty" && <p className="social-page__empty">{t.emptyTip}</p>}</div></section>;
}
