import type { Announcement } from "@/domain/twister";

/** admin-requirements.md: replaces real push notifications with an in-app announcement bar. */
export const announcements: readonly Announcement[] = [
  { id: "announcement-grand-opening", text: "خصم الافتتاح الكبير شغّال دلوقتي — اطلب الآن!", isActive: true },
];
