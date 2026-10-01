/**
 * The Al-Manara email frame shared by announcements and reminders: header, gold rule, closing
 * verse and footer. Pure (no server-only imports) so admin pages can render live previews.
 * Table layout and inline styles only, since Gmail/Outlook drop <style> blocks and flexbox.
 */

export const COLORS = {
  page: "#f3ecdc",
  card: "#ffffff",
  header: "#003e32",
  ink: "#183d34",
  muted: "#5d7169",
  gold: "#cda23e",
  goldSoft: "#e8d7a6",
  goldText: "#9a7521",
  tint: "#fbf6ea",
  line: "#ece3cf",
  night: "#012a22",
  facebook: "#1877f2",
};

export const FONT = "Tahoma,'Segoe UI',Arial,sans-serif";
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

export const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

/** Escaped text with line breaks kept. */
export const paragraph = (value: string) => escapeHtml(value.trim()).replace(/\r?\n/g, "<br>");

export const arabicNumber = (value: number) => String(value).replace(/\d/g, (digit) => ARABIC_DIGITS[Number(digit)]!);

/** First name only, so the greeting reads "يا محمد" rather than a full legal name. */
export const firstName = (name: string | undefined) => name?.trim().split(/\s+/)[0] ?? "";

export function greetingFor(name: string | undefined) {
  const first = firstName(name);
  return first ? `السلام عليكم ورحمة الله يا ${first}،` : "السلام عليكم ورحمة الله،";
}

/** A pill badge above the greeting, e.g. "✦ ميزة جديدة". */
export function badge(label: string) {
  return `<span style="display:inline-block;background:${COLORS.tint};border:1px solid ${COLORS.goldSoft};color:${COLORS.goldText};font-size:12px;font-weight:bold;padding:5px 12px;border-radius:999px">${escapeHtml(label)}</span>`;
}

export function sectionHeading(label: string, marginBottom: number) {
  return `<h2 style="margin:0 0 ${marginBottom}px;font-size:17px;color:${COLORS.header}"><span style="color:${COLORS.gold}">◆</span>&nbsp; ${label}</h2>`;
}

/** `label` is HTML (callers escape their own text). */
export function button(href: string, label: string, background: string, color: string, padding: string, fontSize: number, border = "") {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
        <td align="center" style="border-radius:999px;background:${background}${border ? `;border:${border}` : ""}">
          <a href="${escapeHtml(href)}" target="_blank" style="display:inline-block;padding:${padding};font-family:${FONT};font-size:${fontSize}px;font-weight:bold;color:${color};text-decoration:none;border-radius:999px">${label}</a>
        </td>
      </tr></table>`;
}

export interface EmailShell {
  subject: string;
  siteUrl: string;
  preheader?: string | undefined;
  /** `<tr>` rows that go inside the white card. */
  blocks: string[];
  verse: { text: string; ref: string };
  facebookUrl?: string | null | undefined;
  /** Why this email arrived, e.g. "وصلتك هذه الرسالة لأنك مسجّل في المنارة." */
  reason: string;
  /** Extra footer links (HTML), after "الموقع" and "فيسبوك". */
  extraLinks?: string[];
  unsubscribe?: { url: string; label: string };
}

export function renderShell(shell: EmailShell): string {
  const footerLinks = [
    `<a href="${escapeHtml(shell.siteUrl)}" style="color:${COLORS.header};text-decoration:none">الموقع</a>`,
    shell.facebookUrl && `<a href="${escapeHtml(shell.facebookUrl)}" style="color:${COLORS.header};text-decoration:none">فيسبوك</a>`,
    ...(shell.extraLinks ?? []),
  ]
    .filter(Boolean)
    .join("&nbsp;·&nbsp;");
  const unsubscribe = shell.unsubscribe
    ? ` <a href="${escapeHtml(shell.unsubscribe.url)}" style="color:${COLORS.muted};text-decoration:underline">${escapeHtml(shell.unsubscribe.label)}</a>`
    : "";
  const preheader = shell.preheader?.trim();
  const year = new Date().getFullYear();

  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escapeHtml(shell.subject)}</title>
</head>
<body style="margin:0;padding:0;background:${COLORS.page};-webkit-text-size-adjust:100%">
${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(preheader)}</div>` : ""}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLORS.page}">
<tr><td align="center" style="padding:32px 12px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:${COLORS.card};border-radius:18px;overflow:hidden;box-shadow:0 8px 30px rgba(1,42,34,0.08)">
    <tr><td align="center" style="background:${COLORS.header};padding:30px 24px 26px">
      <div style="font-family:${FONT};font-size:13px;letter-spacing:4px;color:${COLORS.gold}">✦ ✦ ✦</div>
      <div style="font-family:${FONT};font-size:30px;font-weight:bold;color:#ffffff;margin-top:6px">المنارة</div>
      <div style="font-family:${FONT};font-size:13px;color:${COLORS.goldSoft};margin-top:4px">قرآن وعلم وذكر</div>
    </td></tr>
    <tr><td style="height:4px;background:${COLORS.gold};font-size:0;line-height:0">&nbsp;</td></tr>
    ${shell.blocks.join("\n    ")}
    <tr><td style="padding:0 32px"><div style="height:1px;background:${COLORS.line};font-size:0;line-height:0">&nbsp;</div></td></tr>
    <tr><td align="center" style="padding:22px 32px 28px;font-family:${FONT}">
      <p style="margin:0;font-size:17px;color:${COLORS.header}">${escapeHtml(shell.verse.text)}</p>
      <p style="margin:4px 0 0;font-size:12px;color:${COLORS.muted}">${escapeHtml(shell.verse.ref)}</p>
    </td></tr>
  </table>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px">
    <tr><td align="center" style="padding:20px 16px 0;font-family:${FONT};font-size:12px;line-height:1.9;color:${COLORS.muted}">
      <strong style="color:${COLORS.header}">المنارة — قرآن وعلم وذكر</strong><br>
      ${footerLinks}<br>
      ${escapeHtml(shell.reason)}${unsubscribe}<br>
      © ${year} المنارة — جميع الحقوق محفوظة
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>`;
}
