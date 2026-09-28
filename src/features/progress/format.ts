const DATE_FORMAT = new Intl.DateTimeFormat("ar-EG", { day: "numeric", month: "long", timeZone: "UTC" });

/** Short Arabic date ("١٢ سبتمبر"); UTC so server and client render the same text. */
export function formatArabicDate(iso: string): string {
  return DATE_FORMAT.format(new Date(iso));
}
