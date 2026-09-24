import type { CartLine, Coupon } from "./schemas";
import { toProductMap, type ProductLookup } from "./pricing";

export type CouponRejectionReason = "not-found" | "expired" | "below-minimum";

export type CouponValidation = { ok: true; coupon: Coupon; discount: number } | { ok: false; reason: CouponRejectionReason };

export interface ValidateCouponParams {
  /** Raw text as typed by the customer; never mutated or cleared by this function. */
  code: string;
  subtotal: number;
  coupons: readonly Coupon[];
  /** Needed to resolve a `freeItem` coupon's value against what's actually in the cart. */
  lines?: readonly CartLine[];
  products?: ProductLookup;
  now?: Date;
}

/**
 * PROD-BR-01: an unknown/expired/below-minimum coupon is never applied and never clears the
 * customer's typed input — the caller keeps the text as-is and shows a reason-specific message
 * (see `docs/ux/states-and-microcopy.md` STA-COUPON-INVALID).
 */
export function validateCoupon({
  code,
  subtotal,
  coupons,
  lines = [],
  products,
  now = new Date(),
}: ValidateCouponParams): CouponValidation {
  const normalized = code.trim().toLowerCase();
  const coupon = coupons.find((candidate) => candidate.code.toLowerCase() === normalized);
  if (!coupon) return { ok: false, reason: "not-found" };
  if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < now.getTime()) return { ok: false, reason: "expired" };
  if (subtotal < coupon.minSubtotal) return { ok: false, reason: "below-minimum" };

  if (coupon.kind === "percent") {
    const discount = Math.round(subtotal * (Number(coupon.value) / 100));
    return { ok: true, coupon, discount: Math.min(discount, subtotal) };
  }
  if (coupon.kind === "fixed") {
    return { ok: true, coupon, discount: Math.min(Math.round(Number(coupon.value)), subtotal) };
  }

  // freeItem: only has monetary effect if the named product is actually in the cart.
  const freeProductId = String(coupon.value);
  const matchingLine = lines.find((line) => line.productId === freeProductId && !line.isGift);
  if (!matchingLine || !products) return { ok: true, coupon, discount: 0 };
  const product = toProductMap(products).get(freeProductId);
  const unitPrice = product?.basePrice ?? 0;
  return { ok: true, coupon, discount: Math.min(unitPrice, subtotal) };
}
