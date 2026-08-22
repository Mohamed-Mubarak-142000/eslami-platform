import type { Metadata } from "next";
import { SearchController, services } from "@/integrations";
export const metadata: Metadata = { title: "البحث", description: "ابحث في المعرفة الإسلامية الموثقة بالمصادر." };
export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string; type?: string; specialty?: string; topic?: string; date?: string; language?: string }> }) { const params = await searchParams; const query = params.q?.trim() ?? ""; const items = query ? services.data.content.filter(item => `${item.title} ${item.summary}`.includes(query)) : services.data.content; return <SearchController items={items} query={query} />; }
