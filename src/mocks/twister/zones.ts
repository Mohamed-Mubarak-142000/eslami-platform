import type { Zone } from "@/domain/twister";

/** business-facts.md: real delivery zones/fees are missing — 3 illustrative placeholders. */
export const zones: readonly Zone[] = [
  { id: "zone-downtown", name: "وسط المدينة", deliveryFee: 20, minOrder: 80, isServed: true },
  { id: "zone-sheikh-zayed", name: "الشيخ زايد", deliveryFee: 35, minOrder: 100, isServed: true },
  { id: "zone-far-outskirts", name: "أطراف بعيدة", deliveryFee: 60, minOrder: 150, isServed: false },
];
