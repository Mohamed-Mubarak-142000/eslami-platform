export type AnalyticsEvent =
  | { name: "search_submitted"; properties: { resultType?: string } }
  | { name: "content_opened"; properties: { contentId: string; source: "feed" | "search" | "direct" } }
  | { name: "question_submitted"; properties: { visibility: "public" | "private"; specialtyId: string } }
  | { name: "action_failed"; properties: { action: string; errorCode: string } };
export interface Analytics { track(event: AnalyticsEvent): void }
export const noopAnalytics: Analytics = { track: () => undefined };
export function assertNoSensitiveTelemetry(value: unknown): void { const serialized = JSON.stringify(value).toLowerCase(); if (["details", "body", "email", "phone", "questiontext"].some((key) => serialized.includes(`\"${key}\"`))) throw new Error("Sensitive telemetry field rejected"); }
