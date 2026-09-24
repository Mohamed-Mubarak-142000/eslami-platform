/**
 * Display formatting shared across the Twister storefront. Kept separate from
 * `src/domain/twister` so domain math stays free of locale/formatting concerns.
 */

/** `123 ج.م` — no decimals, Western digits, thousands separator when needed (whatsapp-order-message.md). */
export function formatEgp(amount: number): string {
  const rounded = Math.round(amount);
  return `${rounded.toLocaleString("en-US")} ج.م`;
}

/** Same formatting without the currency suffix, for inline composition (e.g. "خصم 20"). */
export function formatEgpAmount(amount: number): string {
  return Math.round(amount).toLocaleString("en-US");
}
