"use client";
import { useState, type FormEvent } from "react";
import type { KnowledgeContent, ScholarProfile, Topic } from "@/domain";
import { Button, TextField } from "@/components/ui";
import { ScholarIdentity } from "@/components/patterns";
import { ContentCard } from "../content/ContentFeatures";
import { FeatureState, type FeatureStatus } from "../shared/FeatureState";

export function Explore({ topics, scholars }: { topics: readonly Topic[]; scholars: readonly ScholarProfile[] }) { return <section aria-labelledby="explore-title"><h1 id="explore-title">استكشف</h1><h2>موضوعات</h2><ul>{topics.map(topic => <li key={topic.id}>{topic.name}</li>)}</ul><h2>علماء وباحثون</h2>{scholars.map(item => <ScholarIdentity key={item.id} name={item.displayName} specialty="متخصص" initials={item.displayName.slice(0, 2)} status={item.verificationStatus === "approved" ? "approved" : "unverified"} />)}</section>; }

export function SearchResults({ items, initialQuery = "", status = "ready", onSearch }: { items: readonly KnowledgeContent[]; initialQuery?: string; status?: FeatureStatus; onSearch?: (query: string) => void }) { const [query, setQuery] = useState(initialQuery); function submit(e: FormEvent) { e.preventDefault(); onSearch?.(query); } const actual = status === "ready" && items.length === 0 ? "empty" : status; return <section aria-labelledby="search-title"><h1 id="search-title">البحث</h1><form role="search" onSubmit={submit}><TextField id="knowledge-search" label="ابحث في المعرفة" value={query} onChange={e => setQuery(e.currentTarget.value)} /><Button type="submit">بحث</Button></form><FeatureState status={actual}>{items.map(item => <ContentCard key={item.id} content={item} />)}</FeatureState>{actual === "empty" && <p>جرّب تقليل الفلاتر أو اطرح سؤالك.</p>}</section>; }
