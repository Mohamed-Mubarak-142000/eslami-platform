import type { Review } from "@/domain/twister";

/** reviews-policy.md: no fabricated review is ever presented as real — all `source: "placeholder"`. */
export const reviews: readonly Review[] = [
  {
    id: "review-1",
    authorName: "عميل توضيحي",
    rating: 5,
    text: "طلب تجريبي بس الفكرة كويسة، هنستنى التقييمات الحقيقية.",
    source: "placeholder",
  },
  { id: "review-2", authorName: "عميل توضيحي", rating: 4, text: "نص توضيحي لتصميم بطاقة التقييم، مش تقييم حقيقي.", source: "placeholder" },
  {
    id: "review-3",
    authorName: "عميل توضيحي",
    rating: 5,
    text: "مثال لعرض التقييمات قبل توفر بيانات حقيقية من المطعم.",
    source: "placeholder",
  },
];
