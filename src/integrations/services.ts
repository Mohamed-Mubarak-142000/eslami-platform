import type { Session } from "@/domain";
import { memberSession, privateQuestion, publicContent, scholarProfile, topics } from "@/mocks";
import { assertNoSensitiveTelemetry, noopAnalytics, type Analytics, type AnalyticsEvent } from "@/lib/analytics";

export interface ErrorMonitor { capture(error: unknown, context: { area: string; code?: string }): void }
export interface IntegrationServices { session: Session; analytics: Analytics; errors: ErrorMonitor; data: { content: readonly [typeof publicContent]; scholars: readonly [typeof scholarProfile]; topics: typeof topics; privateQuestion: typeof privateQuestion } }
const errors: ErrorMonitor = { capture: (error, context) => { if (process.env.NODE_ENV === "development") console.error("integration_error", context, error); } };
export const services: IntegrationServices = { session: memberSession, analytics: noopAnalytics, errors, data: { content: [publicContent], scholars: [scholarProfile], topics, privateQuestion } };
export function trackSafe(event: AnalyticsEvent): void { assertNoSensitiveTelemetry(event); services.analytics.track(event); }
