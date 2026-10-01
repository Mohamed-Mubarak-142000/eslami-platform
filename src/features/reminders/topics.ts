/** Reminder topics a user opts into separately (kept apart from the occasion content, for the client). */
export type ReminderTopic = "friday" | "fasting" | "seasons";

/** The profiles column that opts a user into each topic. */
export const TOPIC_COLUMN = {
  friday: "remind_friday",
  fasting: "remind_fasting",
  seasons: "remind_seasons",
} as const satisfies Record<ReminderTopic, string>;

export const TOPIC_LABELS: Record<ReminderTopic, string> = {
  friday: "تذكير الجمعة وسورة الكهف",
  fasting: "تذكير صيام الاثنين والخميس والأيام البيض",
  seasons: "المواسم: رمضان، العشر من ذي الحجة، عرفة، عاشوراء",
};
