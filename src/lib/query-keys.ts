export const queryKeys = {
  session: () => ["session"] as const,
  feed: (tab: string) => ["feed", { tab }] as const,
  content: (id: string) => ["content", id] as const,
  question: (id: string) => ["question", id] as const,
  scholar: (slug: string) => ["scholar", slug] as const,
  search: (query: string, filters: Readonly<Record<string, string>>) => ["search", { query, filters }] as const,
} as const;
