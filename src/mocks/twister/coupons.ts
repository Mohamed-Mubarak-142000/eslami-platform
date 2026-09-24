import type { Coupon } from "@/domain/twister";

/** Demo coupons for local development/testing — not real promotions. */
export const coupons: readonly Coupon[] = [
  { code: "WELCOME10", kind: "percent", value: 10, minSubtotal: 100, expiresAt: "2027-12-31T21:59:59.000Z", stackable: false },
  { code: "SAVE20", kind: "fixed", value: 20, minSubtotal: 150, expiresAt: "2027-12-31T21:59:59.000Z", stackable: false },
];
