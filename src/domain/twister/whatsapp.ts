import { cairoParts } from "./cairo-time";

/** PROD-WA-01: `TW-YYMMDD-XXXX` — Cairo-local date plus a 4-digit sequence, created client-side. */
export function orderRef(now: Date = new Date(), randomSource: () => number = Math.random): string {
  const parts = cairoParts(now);
  const yy = String(parts.year % 100).padStart(2, "0");
  const mm = String(parts.month).padStart(2, "0");
  const dd = String(parts.day).padStart(2, "0");
  const sequence = String(Math.floor(randomSource() * 10_000)).padStart(4, "0");
  return `TW-${yy}${mm}${dd}-${sequence}`;
}

export interface WhatsAppLineView {
  productName: string;
  sizeLabel?: string;
  quantity: number;
  extraLabels: readonly string[];
  spicyLabel?: string;
  notes?: string;
  isGift: boolean;
}

export interface WhatsAppCustomerView {
  name: string;
  phone: string;
  address: string;
  zoneName: string;
  landmark?: string;
}

export interface WhatsAppCouponView {
  code: string;
  amountFormatted: string;
}

export interface WhatsAppMessageInput {
  orderRef: string;
  customer: WhatsAppCustomerView;
  lines: readonly WhatsAppLineView[];
  coupon?: WhatsAppCouponView;
  paymentMethodLabel: string;
  orderNotes?: string;
  subtotalFormatted: string;
  deliveryFeeFormatted: string;
  totalFormatted: string;
}

/**
 * PROD-WA-01: builds the literal Arabic WhatsApp order message. The template's blank lines are
 * fixed structural separators (not conditional); only the `{if ...}` content lines themselves
 * are dropped when not applicable — never rendered as an empty line or "N/A".
 */
export function buildWhatsAppMessage(input: WhatsAppMessageInput): string {
  const lines: string[] = [];
  lines.push("طلب جديد من الموقع");
  lines.push(`رقم الطلب: ${input.orderRef}`);
  lines.push("");
  lines.push(`الاسم: ${input.customer.name}`);
  lines.push(`رقم الهاتف: ${input.customer.phone}`);
  lines.push(`العنوان: ${input.customer.address}`);
  lines.push(`المنطقة: ${input.customer.zoneName}`);
  if (input.customer.landmark) lines.push(`أقرب علامة: ${input.customer.landmark}`);
  lines.push("");
  lines.push("الطلبات:");
  for (const line of input.lines.filter((candidate) => !candidate.isGift)) {
    const sizePart = line.sizeLabel ? ` (${line.sizeLabel})` : "";
    lines.push(`- ${line.productName}${sizePart} × ${line.quantity}`);
    if (line.extraLabels.length > 0) lines.push(`  إضافات: ${line.extraLabels.join("، ")}`);
    if (line.spicyLabel) lines.push(`  درجة الحرارة: ${line.spicyLabel}`);
    if (line.notes) lines.push(`  ملاحظات: ${line.notes}`);
  }
  if (input.lines.some((line) => line.isGift)) lines.push("- 🎁 بطاطس هدية × 1 (مجاناً)");
  lines.push("");
  if (input.coupon) lines.push(`الكوبون: ${input.coupon.code} (خصم ${input.coupon.amountFormatted})`);
  lines.push("");
  lines.push(`طريقة الدفع: ${input.paymentMethodLabel}`);
  if (input.orderNotes) lines.push(`ملاحظات الطلب: ${input.orderNotes}`);
  lines.push("");
  lines.push(`الإجمالي الفرعي: ${input.subtotalFormatted} ج.م`);
  lines.push(`رسوم التوصيل: ${input.deliveryFeeFormatted} ج.م`);
  lines.push(`الإجمالي: ${input.totalFormatted} ج.م`);
  return lines.join("\n");
}

/**
 * PROD-WA-01: the caller must invoke `window.open(buildWhatsAppUrl(...), "_blank")` synchronously
 * inside the click handler (never after an `await`) so browsers don't block the popup.
 */
export function buildWhatsAppUrl(message: string, whatsappNumber: string): string {
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
}
