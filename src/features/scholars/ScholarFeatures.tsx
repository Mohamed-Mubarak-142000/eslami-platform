"use client";
import type { KnowledgeContent, ScholarProfile, Topic } from "@/domain";
import { useTranslations } from "@/i18n/LocaleProvider";
import { Button } from "@/components/ui";
import { ScholarIdentity, TrustMark } from "@/components/patterns";
import { ContentCard } from "../content/ContentFeatures";

export function ScholarProfileView({ scholar, content = [], onFollow }: { scholar: ScholarProfile; content?: readonly KnowledgeContent[]; onFollow?: () => void }) {
  const t = useTranslations("scholars");
  const status = scholar.verificationStatus === "approved" ? "approved" : scholar.verificationStatus === "suspended" ? "suspended" : scholar.verificationStatus === "revoked" ? "revoked" : "unverified";
  return <section aria-labelledby="scholar-title"><h1 id="scholar-title" className="ds-visually-hidden">{t.profileHiddenHeading}</h1><ScholarIdentity name={scholar.displayName} specialty={t.specialtyLabel} initials={scholar.displayName.slice(0, 2)} status={status} /><TrustMark status={status} /><p>{scholar.bio}</p><Button onClick={onFollow}>{t.follow}</Button><h2>{t.contentHeading}</h2>{content.map(item => <ContentCard key={item.id} content={item} />)}</section>;
}
export function TopicView({ topic, content, onFollow }: { topic: Topic; content: readonly KnowledgeContent[]; onFollow?: () => void }) {
  const t = useTranslations("scholars");
  return <section aria-labelledby="topic-title"><h1 id="topic-title">{topic.name}</h1><Button onClick={onFollow}>{t.followTopic}</Button>{content.map(item => <ContentCard key={item.id} content={item} />)}</section>;
}
