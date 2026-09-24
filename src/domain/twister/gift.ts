import { offerStatus } from "./hours";
import type { CartLine, Offer, Product } from "./schemas";

export const FREE_FRIES_GIFT_LINE_ID = "gift-free-fries";

export interface FreeFriesGiftParams {
  subtotal: number;
  /** Owner-confirm pending default per business-rules.md; 200 EGP proposed. */
  threshold: number;
  now?: Date;
  /** The active "Thursday offer", if any — its window also unlocks the gift regardless of subtotal. */
  thursdayOffer?: Offer;
  /** The classic-fries product used as the gift (menu-catalog.md: no separate gift SKU). */
  friesProduct: Product;
}

/**
 * PROD-BR-01: adds one auto `isGift` line when `subtotal >= threshold` OR the Thursday-offer
 * window is active — never both stacked. Returns `null` when neither condition holds, so the
 * caller (cart store) removes any existing gift line silently (STA-GIFT-REMOVED).
 */
export function freeFriesGift({
  subtotal,
  threshold,
  now = new Date(),
  thursdayOffer,
  friesProduct,
}: FreeFriesGiftParams): CartLine | null {
  const thursdayActive = thursdayOffer ? offerStatus(thursdayOffer, now) === "active" : false;
  if (subtotal < threshold && !thursdayActive) return null;
  return {
    id: FREE_FRIES_GIFT_LINE_ID,
    productId: friesProduct.id,
    extraIds: [],
    quantity: 1,
    isGift: true,
  };
}
