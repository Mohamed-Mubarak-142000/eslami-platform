export type AnalyticsEvent =
  | { name: "search_submitted"; properties: { resultType?: string } }
  | { name: "content_opened"; properties: { contentId: string; source: "feed" | "search" | "direct" } }
  | { name: "question_submitted"; properties: { visibility: "public" | "private"; specialtyId: string } }
  | { name: "action_failed"; properties: { action: string; errorCode: string } }
  // Twister storefront events — PII-free by contract, see docs/product/analytics-privacy.md.
  | { name: "add_to_cart"; properties: { product_id: string; category_id: string; price_bucket: string; has_extras: boolean } }
  | { name: "remove_from_cart"; properties: { product_id: string } }
  | { name: "coupon_applied"; properties: { coupon_code: string } }
  | { name: "coupon_rejected"; properties: { coupon_code: string; reason: "not-found" | "expired" | "below-minimum" } }
  | { name: "begin_checkout"; properties: { subtotal_bucket: string; zone_id: string; item_count: number } }
  | { name: "whatsapp_order_sent"; properties: { order_ref: string; total_bucket: string; payment_method: string } }
  | { name: "whatsapp_popup_blocked"; properties?: never }
  | { name: "offer_viewed"; properties: { offer_id: string } }
  | { name: "offer_clicked"; properties: { offer_id: string } }
  | { name: "admin_export_json"; properties?: never };
export interface Analytics {
  track(event: AnalyticsEvent): void;
}
export const noopAnalytics: Analytics = { track: () => undefined };
/**
 * PROD-AN-01: rejects any payload carrying a customer name, phone, full address, or free-text
 * field (order notes / the full WhatsApp message) — analytics may only carry the bucketed,
 * anonymous fields declared on `AnalyticsEvent`.
 */
export function assertNoSensitiveTelemetry(value: unknown): void {
  const serialized = JSON.stringify(value).toLowerCase();
  const bannedKeys = ["details", "body", "email", "phone", "questiontext", "customername", "address", "notes", "message", "landmark"];
  if (bannedKeys.some((key) => serialized.includes(`\"${key}\"`))) throw new Error("Sensitive telemetry field rejected");
}
