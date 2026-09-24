import type { Category } from "@/domain/twister";

/** PROD-MENU-01: the single reconciled category list shared by the homepage slider and /menu tabs. */
export const categories: readonly Category[] = [
  { id: "pizza", name: "بيتزا", order: 1 },
  { id: "stromboli", name: "استرومبولي", order: 2 },
  { id: "burger", name: "برجر", order: 3 },
  { id: "syrian", name: "سوري", order: 4 },
  { id: "crepe-chicken", name: "كريب فراخ", order: 5 },
  { id: "crepe-meat", name: "كريب لحوم", order: 6 },
  { id: "crepe-potato", name: "كريب بطاطس", order: 7 },
  { id: "crepe-mix", name: "كريب مكس", order: 8 },
  { id: "fries", name: "فراي وبطاطس", order: 9 },
  { id: "extras", name: "إضافات", order: 10 },
];
