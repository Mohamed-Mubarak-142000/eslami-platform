import type { CartLine, CartTotals, Product, Zone } from "./schemas";
import { CartTotalsSchema } from "./schemas";

/** PROD-BR-01: `unitPrice = basePrice + (size?.priceDelta ?? 0) + sum(extras[].price)`. */
export function priceLine(line: CartLine, product: Product): number {
  if (line.isGift) return 0;
  const size = product.sizes?.find((candidate) => candidate.id === line.sizeId);
  const extrasTotal = (product.extras ?? [])
    .filter((extra) => line.extraIds.includes(extra.id))
    .reduce((sum, extra) => sum + extra.price, 0);
  const unitPrice = product.basePrice + (size?.priceDelta ?? 0) + extrasTotal;
  return Math.round(unitPrice * line.quantity);
}

export type ProductLookup = ReadonlyMap<string, Product> | Readonly<Record<string, Product>>;

/** Normalizes either accepted shape into a single `Map`, sidestepping TS's union-narrowing limits on `instanceof`. */
export function toProductMap(lookup: ProductLookup): ReadonlyMap<string, Product> {
  return lookup instanceof Map ? lookup : new Map(Object.entries(lookup));
}

function resolveProduct(lookup: ProductLookup, productId: string): Product {
  const product = toProductMap(lookup).get(productId);
  if (!product) throw new Error(`cartTotals: unknown productId "${productId}"`);
  return product;
}

export function subtotalFor(lines: readonly CartLine[], products: ProductLookup): number {
  return lines.reduce((sum, line) => sum + priceLine(line, resolveProduct(products, line.productId)), 0);
}

export interface CartTotalsInput {
  lines: readonly CartLine[];
  products: ProductLookup;
  /** Already-resolved EGP discount amount (see `validateCoupon`); defaults to 0. */
  discount?: number;
  /** Undefined means no zone chosen yet, so no delivery fee is charged. */
  zone?: Zone;
}

/** Aggregates line pricing into subtotal/discount/delivery/total per `business-rules.md`. */
export function cartTotals({ lines, products, discount = 0, zone }: CartTotalsInput): CartTotals {
  const subtotal = subtotalFor(lines, products);
  const clampedDiscount = Math.min(Math.max(Math.round(discount), 0), subtotal);
  const deliveryFee = zone && zone.isServed ? zone.deliveryFee : 0;
  const total = Math.max(subtotal - clampedDiscount + deliveryFee, 0);
  return CartTotalsSchema.parse({ subtotal, discount: clampedDiscount, deliveryFee, total });
}
