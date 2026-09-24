import { describe, expect, it } from "vitest";
import {
  buildWhatsAppMessage,
  buildWhatsAppUrl,
  cartTotals,
  freeFriesGift,
  isOpenNow,
  offerStatus,
  orderRef,
  priceLine,
  validateCoupon,
  type CartLine,
  type Coupon,
  type Offer,
  type Product,
  type WeeklyHours,
} from "./index";

const pizza: Product = {
  id: "pizza-margherita",
  categoryId: "pizza",
  name: "بيتزا مارجريتا",
  description: "",
  images: [],
  basePrice: 110,
  sizes: [
    { id: "small", label: "صغير", priceDelta: 0 },
    { id: "large", label: "كبير", priceDelta: 80 },
  ],
  extras: [{ id: "extra-cheese", label: "جبنة إضافية", price: 15 }],
  isBestseller: false,
  isAvailable: true,
  verified: false,
};

const fries: Product = {
  id: "fries-classic",
  categoryId: "fries",
  name: "بطاطس كلاسيك",
  description: "",
  images: [],
  basePrice: 35,
  isBestseller: false,
  isAvailable: true,
  verified: false,
};

const products = new Map([
  [pizza.id, pizza],
  [fries.id, fries],
]);

describe("priceLine", () => {
  it("computes unitPrice from basePrice + size delta + extras, times quantity", () => {
    const line: CartLine = { id: "l1", productId: pizza.id, sizeId: "large", extraIds: ["extra-cheese"], quantity: 2, isGift: false };
    expect(priceLine(line, pizza)).toBe((110 + 80 + 15) * 2);
  });

  it("ignores size/extras pricing for gift lines", () => {
    const line: CartLine = { id: "gift-free-fries", productId: fries.id, extraIds: [], quantity: 1, isGift: true };
    expect(priceLine(line, fries)).toBe(0);
  });
});

describe("cartTotals", () => {
  it("sums subtotal, clamps discount to subtotal, adds a served zone's delivery fee", () => {
    const lines: CartLine[] = [{ id: "l1", productId: pizza.id, sizeId: "small", extraIds: [], quantity: 1, isGift: false }];
    const totals = cartTotals({
      lines,
      products,
      discount: 500,
      zone: { id: "z1", name: "Z", deliveryFee: 20, minOrder: 0, isServed: true },
    });
    expect(totals).toEqual({ subtotal: 110, discount: 110, deliveryFee: 20, total: 20 });
  });

  it("charges no delivery fee for an unserved zone", () => {
    const lines: CartLine[] = [{ id: "l1", productId: pizza.id, sizeId: "small", extraIds: [], quantity: 1, isGift: false }];
    const totals = cartTotals({ lines, products, zone: { id: "z1", name: "Z", deliveryFee: 20, minOrder: 0, isServed: false } });
    expect(totals).toEqual({ subtotal: 110, discount: 0, deliveryFee: 0, total: 110 });
  });
});

describe("validateCoupon", () => {
  const coupons: Coupon[] = [
    { code: "WELCOME10", kind: "percent", value: 10, minSubtotal: 100, expiresAt: "2027-01-01T00:00:00.000Z", stackable: false },
    { code: "EXPIRED", kind: "fixed", value: 20, minSubtotal: 0, expiresAt: "2020-01-01T00:00:00.000Z", stackable: false },
  ];

  it("rejects an unknown code without throwing and without altering the typed text (caller's job)", () => {
    expect(validateCoupon({ code: "NOPE", subtotal: 200, coupons })).toEqual({ ok: false, reason: "not-found" });
  });

  it("rejects an expired coupon", () => {
    expect(validateCoupon({ code: "EXPIRED", subtotal: 200, coupons, now: new Date("2026-01-01T00:00:00.000Z") })).toEqual({
      ok: false,
      reason: "expired",
    });
  });

  it("rejects a coupon below its minimum subtotal", () => {
    const now = new Date("2026-06-01T00:00:00.000Z");
    expect(validateCoupon({ code: "WELCOME10", subtotal: 50, coupons, now })).toEqual({ ok: false, reason: "below-minimum" });
  });

  it("applies a percent discount rounded to the nearest pound, case-insensitively", () => {
    const now = new Date("2026-06-01T00:00:00.000Z");
    const result = validateCoupon({ code: "welcome10", subtotal: 205, coupons, now });
    expect(result).toEqual({ ok: true, coupon: coupons[0], discount: 21 });
  });
});

describe("freeFriesGift", () => {
  const threshold = 200;

  it("returns null below the threshold with no active Thursday offer", () => {
    expect(freeFriesGift({ subtotal: 100, threshold, friesProduct: fries })).toBeNull();
  });

  it("returns a zero-price gift line at/above the threshold", () => {
    const line = freeFriesGift({ subtotal: 200, threshold, friesProduct: fries });
    expect(line).toMatchObject({ productId: fries.id, isGift: true, quantity: 1 });
  });

  it("grants the gift during an active Thursday-offer window regardless of subtotal", () => {
    const thursdayOffer: Offer = {
      id: "thursday-offer",
      title: "",
      description: "",
      startAt: "2026-01-01T00:00:00.000Z",
      endAt: "2099-01-01T00:00:00.000Z",
      bannerImage: "x",
      recurrence: "weekly-thursday",
    };
    // 2026-01-01 is a Thursday in Cairo local time.
    const now = new Date("2026-01-01T12:00:00.000Z");
    const line = freeFriesGift({ subtotal: 10, threshold, now, thursdayOffer, friesProduct: fries });
    expect(line).not.toBeNull();
  });
});

describe("isOpenNow", () => {
  const hours: WeeklyHours[] = Array.from({ length: 7 }, (_, weekday) => ({ weekday, opensAt: "13:00", closesAt: "02:00" }));

  it("is open in the mid-afternoon Cairo-local", () => {
    // 2026-01-05 15:00 Cairo (UTC+2) = 13:00 UTC.
    expect(isOpenNow(hours, new Date("2026-01-05T13:00:00.000Z")).isOpen).toBe(true);
  });

  it("is open just after midnight, before the crossed-midnight close", () => {
    // 2026-01-06 01:00 Cairo = 2026-01-05T23:00:00Z.
    expect(isOpenNow(hours, new Date("2026-01-05T23:00:00.000Z")).isOpen).toBe(true);
  });

  it("is closed mid-morning and reports the next opening time", () => {
    // 2026-01-05 10:00 Cairo = 08:00 UTC.
    const result = isOpenNow(hours, new Date("2026-01-05T08:00:00.000Z"));
    expect(result).toEqual({ isOpen: false, opensAt: "13:00" });
  });
});

describe("offerStatus", () => {
  it("resolves scheduled/active/expired for a non-recurring offer", () => {
    const offer: Offer = {
      id: "grand-opening",
      title: "",
      description: "",
      startAt: "2026-06-01T00:00:00.000Z",
      endAt: "2026-06-30T00:00:00.000Z",
      bannerImage: "x",
      recurrence: "none",
    };
    expect(offerStatus(offer, new Date("2026-05-01T00:00:00.000Z"))).toBe("scheduled");
    expect(offerStatus(offer, new Date("2026-06-15T00:00:00.000Z"))).toBe("active");
    expect(offerStatus(offer, new Date("2026-07-01T00:00:00.000Z"))).toBe("expired");
  });

  it("never expires a weekly-thursday offer — only active or scheduled", () => {
    const offer: Offer = {
      id: "thursday-offer",
      title: "",
      description: "",
      startAt: "2026-01-01T00:00:00.000Z",
      endAt: "2099-01-01T00:00:00.000Z",
      bannerImage: "x",
      recurrence: "weekly-thursday",
    };
    expect(offerStatus(offer, new Date("2026-01-01T12:00:00.000Z"))).toBe("active"); // Thursday
    expect(offerStatus(offer, new Date("2026-01-02T12:00:00.000Z"))).toBe("scheduled"); // Friday
  });
});

describe("orderRef", () => {
  it("formats TW-YYMMDD-XXXX from the Cairo-local date", () => {
    expect(orderRef(new Date("2026-01-01T12:00:00.000Z"), () => 0.4242)).toBe("TW-260101-4242");
  });
});

describe("buildWhatsAppMessage / buildWhatsAppUrl", () => {
  it("renders the literal Arabic template, dropping unmet conditional lines without leaving gaps", () => {
    const message = buildWhatsAppMessage({
      orderRef: "TW-260101-0001",
      customer: { name: "أحمد", phone: "01000000000", address: "شارع تجريبي", zoneName: "وسط المدينة" },
      lines: [
        { productName: "بيتزا مارجريتا", sizeLabel: "كبير", quantity: 1, extraLabels: ["جبنة إضافية"], isGift: false },
        { productName: "بطاطس كلاسيك", quantity: 1, extraLabels: [], isGift: true },
      ],
      paymentMethodLabel: "كاش عند الاستلام",
      subtotalFormatted: "190",
      deliveryFeeFormatted: "20",
      totalFormatted: "210",
    });

    expect(message).toBe(
      [
        "طلب جديد من الموقع",
        "رقم الطلب: TW-260101-0001",
        "",
        "الاسم: أحمد",
        "رقم الهاتف: 01000000000",
        "العنوان: شارع تجريبي",
        "المنطقة: وسط المدينة",
        "",
        "الطلبات:",
        "- بيتزا مارجريتا (كبير) × 1",
        "  إضافات: جبنة إضافية",
        "- 🎁 بطاطس هدية × 1 (مجاناً)",
        "",
        "",
        "طريقة الدفع: كاش عند الاستلام",
        "",
        "الإجمالي الفرعي: 190 ج.م",
        "رسوم التوصيل: 20 ج.م",
        "الإجمالي: 210 ج.م",
      ].join("\n"),
    );
  });

  it("includes the landmark and coupon lines only when present", () => {
    const message = buildWhatsAppMessage({
      orderRef: "TW-260101-0002",
      customer: { name: "منى", phone: "01000000001", address: "شارع آخر", zoneName: "الشيخ زايد", landmark: "بجوار الصيدلية" },
      lines: [{ productName: "برجر كلاسيك", quantity: 2, extraLabels: [], isGift: false }],
      coupon: { code: "WELCOME10", amountFormatted: "10" },
      paymentMethodLabel: "فودافون كاش",
      orderNotes: "من غير بصل",
      subtotalFormatted: "190",
      deliveryFeeFormatted: "35",
      totalFormatted: "215",
    });

    expect(message).toContain("أقرب علامة: بجوار الصيدلية");
    expect(message).toContain("الكوبون: WELCOME10 (خصم 10)");
    expect(message).toContain("ملاحظات الطلب: من غير بصل");
  });

  it("builds a wa.me URL with the encoded message", () => {
    const url = buildWhatsAppUrl("سطر تجريبي", "201233326848");
    expect(url).toBe(`https://wa.me/201233326848?text=${encodeURIComponent("سطر تجريبي")}`);
  });
});
