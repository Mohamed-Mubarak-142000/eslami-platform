import type { Offer } from "@/domain/twister";

const placeholderBanner = "/images/placeholder-banner.svg";

/**
 * PROD-OFF-01: dates/discount details are `owner-confirm` placeholders.
 * - `grand-opening`: fixed placeholder window (real dates pending the owner).
 * - `free-fries`: no dedicated window — its condition lives in `freeFriesGift`; kept here only
 *   so `/offers` has a card to render (per offers.md, it always shows there too).
 * - `thursday-offer`: recurs every Cairo-local Thursday (`recurrence: "weekly-thursday"`);
 *   `startAt`/`endAt` are placeholders unused while recurrence is set.
 */
export const offers: readonly Offer[] = [
  {
    id: "grand-opening",
    title: "افتتاح كبير",
    description: "خصم افتتاح لفترة محدودة على كل المنيو — تواريخ نهائية قيد اعتماد صاحب المطعم.",
    startAt: "2026-09-01T00:00:00.000Z",
    endAt: "2026-10-15T21:59:59.000Z",
    bannerImage: placeholderBanner,
    recurrence: "none",
  },
  {
    id: "free-fries",
    title: "بطاطس هدية",
    description: "بطاطس مجانية عند تجاوز حد الطلب — يُطبَّق تلقائيًا في السلة.",
    startAt: "2026-01-01T00:00:00.000Z",
    endAt: "2099-01-01T00:00:00.000Z",
    bannerImage: placeholderBanner,
    recurrence: "none",
  },
  {
    id: "thursday-offer",
    title: "عروض الخميس",
    description: "خصم خاص يوم الخميس على البيتزا — النسبة والتصنيف النهائيان قيد اعتماد صاحب المطعم.",
    startAt: "2026-01-01T00:00:00.000Z",
    endAt: "2099-01-01T00:00:00.000Z",
    bannerImage: placeholderBanner,
    linkedCategoryId: "pizza",
    recurrence: "weekly-thursday",
  },
];

export const freeFriesThreshold = 200;
