import { describe, expect, it } from "vitest";
import { assertNoSensitiveTelemetry, noopAnalytics, type AnalyticsEvent } from "./analytics";

describe("assertNoSensitiveTelemetry", () => {
  it("allows every declared PII-free Twister event shape", () => {
    const events: AnalyticsEvent[] = [
      { name: "add_to_cart", properties: { product_id: "p1", category_id: "pizza", price_bucket: "100-150", has_extras: true } },
      { name: "remove_from_cart", properties: { product_id: "p1" } },
      { name: "coupon_applied", properties: { coupon_code: "WELCOME10" } },
      { name: "coupon_rejected", properties: { coupon_code: "NOPE", reason: "not-found" } },
      { name: "begin_checkout", properties: { subtotal_bucket: "100-150", zone_id: "zone-downtown", item_count: 3 } },
      { name: "whatsapp_order_sent", properties: { order_ref: "TW-260101-0001", total_bucket: "150-200", payment_method: "cash" } },
      { name: "whatsapp_popup_blocked" },
      { name: "offer_viewed", properties: { offer_id: "grand-opening" } },
      { name: "admin_export_json" },
    ];
    for (const event of events) {
      expect(() => assertNoSensitiveTelemetry(event)).not.toThrow();
      noopAnalytics.track(event);
    }
  });

  it("still rejects the pre-existing sensitive keys (regression)", () => {
    expect(() => assertNoSensitiveTelemetry({ body: "private" })).toThrow();
    expect(() => assertNoSensitiveTelemetry({ email: "a@b.com" })).toThrow();
  });

  it("rejects order free-text fields if ever accidentally attached to a telemetry payload", () => {
    expect(() => assertNoSensitiveTelemetry({ notes: "من غير بصل" })).toThrow();
    expect(() => assertNoSensitiveTelemetry({ address: "شارع تجريبي" })).toThrow();
    expect(() => assertNoSensitiveTelemetry({ message: "طلب جديد من الموقع" })).toThrow();
  });
});
