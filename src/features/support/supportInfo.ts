/**
 * Support goes by InstaPay, the same as the mobile app (features/support/supportStore.ts there): the user
 * transfers to this number, then sends the screenshot. An admin checks it at /admin/supporters.
 */
export const INSTAPAY_NUMBER = "01050867135";

/** Quick amounts in EGP; any other amount can be typed. */
export const QUICK_AMOUNTS = [50, 100, 200, 500] as const;

export const SUPPORTER_PERKS = [
  "اسمك ودعاؤك في قسم «داعمي المنارة» بالصفحة الرئيسية",
  "ألوان إضافية لصفحات المصحف في تطبيق المنارة",
  "أجر المساهمة في نشر القرآن بإذن الله",
] as const;

/** Reloaded every 10 minutes, and right away when an admin approves someone. */
export const SUPPORTERS_TAG = "supporters";
