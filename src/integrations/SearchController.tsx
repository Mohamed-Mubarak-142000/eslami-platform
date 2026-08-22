"use client";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import type { KnowledgeContent } from "@/domain";
import { SearchResults } from "@/features";
import { trackSafe } from "./services";

export function SearchController({ items, query }: { items: readonly KnowledgeContent[]; query: string }) {
  const router = useRouter();
  return <SearchResults items={items} initialQuery={query} onSearch={(value) => { const params = new URLSearchParams(); const clean = value.trim(); if (clean) params.set("q", clean); trackSafe({ name: "search_submitted", properties: {} }); router.push(`/search${params.size ? `?${params}` : ""}` as Route); }} />;
}
