"use client";
import type { KnowledgeContent, ScholarProfile, Topic } from "@/domain";
import { Button } from "@/components/ui";
import { ScholarIdentity, TrustMark } from "@/components/patterns";
import { ContentCard } from "../content/ContentFeatures";

export function ScholarProfileView({ scholar, content = [], onFollow }: { scholar: ScholarProfile; content?: readonly KnowledgeContent[]; onFollow?: () => void }) { const status = scholar.verificationStatus === "approved" ? "approved" : scholar.verificationStatus === "suspended" ? "suspended" : scholar.verificationStatus === "revoked" ? "revoked" : "unverified"; return <section aria-labelledby="scholar-title"><h1 id="scholar-title" className="ds-visually-hidden">ملف الباحث</h1><ScholarIdentity name={scholar.displayName} specialty="متخصص" initials={scholar.displayName.slice(0, 2)} status={status} /><TrustMark status={status} /><p>{scholar.bio}</p><Button onClick={onFollow}>متابعة</Button><h2>المحتوى</h2>{content.map(item => <ContentCard key={item.id} content={item} />)}</section>; }
export function TopicView({ topic, content, onFollow }: { topic: Topic; content: readonly KnowledgeContent[]; onFollow?: () => void }) { return <section aria-labelledby="topic-title"><h1 id="topic-title">{topic.name}</h1><Button onClick={onFollow}>متابعة الموضوع</Button>{content.map(item => <ContentCard key={item.id} content={item} />)}</section>; }
