/**
 * "New feature" announcement email. Pure (no server-only imports) so the admin page can render
 * the exact same HTML as a live preview. Same visual language as otpEmail.ts: table layout and
 * inline styles only, since Gmail/Outlook drop <style> blocks and flexbox. Every admin-written
 * string is HTML-escaped before it goes into the template.
 */

export interface AnnouncementContent {
  title: string;
  /** Grey preview line next to the subject in the inbox. */
  preheader?: string;
  intro: string;
  /** "ما هي الميزة؟" — omitted when empty. */
  what?: string;
  /** "كيف تحصل عليها؟" — numbered steps, omitted when empty. */
  steps?: string[];
  /** "ما الفائدة؟" — check-marked points, omitted when empty. */
  benefits?: string[];
  ctaLabel?: string;
  ctaUrl?: string;
}

export interface AnnouncementContext {
  subject: string;
  siteUrl: string;
  recipientName?: string;
  facebookUrl?: string | null;
  unsubscribeUrl?: string;
}

export interface RenderedAnnouncement {
  subject: string;
  html: string;
  text: string;
}

const COLORS = {
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

const FONT = "Tahoma,'Segoe UI',Arial,sans-serif";
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

/** Escaped text with the admin's line breaks kept. */
const paragraph = (value: string) => escapeHtml(value.trim()).replace(/\r?\n/g, "<br>");

const arabicNumber = (value: number) => String(value).replace(/\d/g, (digit) => ARABIC_DIGITS[Number(digit)]!);

const clean = (items: string[] | undefined) => (items ?? []).map((item) => item.trim()).filter(Boolean);

/** First name only, so the greeting reads "يا محمد" rather than a full legal name. */
const firstName = (name: string | undefined) => name?.trim().split(/\s+/)[0] ?? "";

function sectionHeading(label: string, marginBottom: number) {
  return `<h2 style="margin:0 0 ${marginBottom}px;font-size:17px;color:${COLORS.header}"><span style="color:${COLORS.gold}">◆</span>&nbsp; ${label}</h2>`;
}

function stepsRows(steps: string[]) {
  return steps
    .map((step, index) => {
      const last = index === steps.length - 1;
      return `<tr>
          <td width="40" valign="top" style="padding:0 0 ${last ? 0 : 12}px"><div style="width:30px;height:30px;line-height:30px;border-radius:50%;background:${COLORS.header};color:#ffffff;font-size:14px;font-weight:bold;text-align:center">${arabicNumber(index + 1)}</div></td>
          <td valign="top" style="padding:4px 0 ${last ? 0 : 12}px;font-size:15px;line-height:1.8">${paragraph(step)}</td>
        </tr>`;
    })
    .join("");
}

function benefitRows(benefits: string[]) {
  return benefits
    .map(
      (benefit, index) =>
        `<p style="margin:0 0 ${index === benefits.length - 1 ? 0 : 6}px;font-size:15px;line-height:1.8"><span style="color:${COLORS.gold}">✔</span>&nbsp; ${paragraph(benefit)}</p>`,
    )
    .join("");
}

function button(href: string, label: string, background: string, color: string, padding: string, fontSize: number) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
        <td align="center" style="border-radius:999px;background:${background}">
          <a href="${escapeHtml(href)}" target="_blank" style="display:inline-block;padding:${padding};font-family:${FONT};font-size:${fontSize}px;font-weight:bold;color:${color};text-decoration:none;border-radius:999px">${label}</a>
        </td>
      </tr></table>`;
}

export function renderAnnouncementEmail(content: AnnouncementContent, context: AnnouncementContext): RenderedAnnouncement {
  const steps = clean(content.steps);
  const benefits = clean(content.benefits);
  const what = content.what?.trim() ?? "";
  const ctaUrl = content.ctaUrl?.trim() || context.siteUrl;
  const ctaLabel = content.ctaLabel?.trim() || "جرّب الميزة الآن";
  const name = firstName(context.recipientName);
  const greeting = name ? `السلام عليكم ورحمة الله يا ${name}،` : "السلام عليكم ورحمة الله،";
  const year = new Date().getFullYear();

  const blocks: string[] = [];

  blocks.push(`<tr><td dir="rtl" style="padding:34px 32px 6px;font-family:${FONT};text-align:right;color:${COLORS.ink}">
      <span style="display:inline-block;background:${COLORS.tint};border:1px solid ${COLORS.goldSoft};color:${COLORS.goldText};font-size:12px;font-weight:bold;padding:5px 12px;border-radius:999px">✦ ميزة جديدة</span>
      <p style="margin:18px 0 6px;font-size:14px;color:${COLORS.muted}">${escapeHtml(greeting)}</p>
      <h1 style="margin:0 0 14px;font-size:24px;line-height:1.5;color:${COLORS.header}">${escapeHtml(content.title.trim())}</h1>
      <p style="margin:0;font-size:15px;line-height:1.9">${paragraph(content.intro)}</p>
    </td></tr>`);

  if (what) {
    blocks.push(`<tr><td dir="rtl" style="padding:26px 32px 0;font-family:${FONT};text-align:right;color:${COLORS.ink}">
      ${sectionHeading("ما هي الميزة؟", 8)}
      <p style="margin:0;font-size:15px;line-height:1.9">${paragraph(what)}</p>
    </td></tr>`);
  }

  if (steps.length) {
    blocks.push(`<tr><td dir="rtl" style="padding:26px 32px 0;font-family:${FONT};text-align:right;color:${COLORS.ink}">
      ${sectionHeading("كيف تحصل عليها؟", 12)}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${stepsRows(steps)}</table>
    </td></tr>`);
  }

  if (benefits.length) {
    blocks.push(`<tr><td style="padding:26px 32px 0">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLORS.tint};border-right:4px solid ${COLORS.gold};border-radius:10px">
        <tr><td dir="rtl" style="padding:18px 20px;font-family:${FONT};text-align:right;color:${COLORS.ink}">
          <h2 style="margin:0 0 10px;font-size:17px;color:${COLORS.header}">ما الفائدة؟</h2>
          ${benefitRows(benefits)}
        </td></tr>
      </table>
    </td></tr>`);
  }

  blocks.push(`<tr><td align="center" style="padding:30px 32px 32px">
      ${button(ctaUrl, escapeHtml(ctaLabel), COLORS.gold, COLORS.night, "14px 34px", 16)}
    </td></tr>`);

  if (context.facebookUrl) {
    blocks.push(`<tr><td style="padding:0 32px 28px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLORS.header};border-radius:14px">
        <tr><td dir="rtl" align="center" style="padding:20px 20px 22px;font-family:${FONT}">
          <p style="margin:0 0 4px;font-size:16px;font-weight:bold;color:#ffffff">تابعنا على فيسبوك</p>
          <p style="margin:0 0 14px;font-size:13px;line-height:1.8;color:${COLORS.goldSoft}">أول من يعرف بالميزات الجديدة، مع تذكير يومي بالأذكار والورد.</p>
          ${button(context.facebookUrl, `<span style="font-family:Arial,sans-serif;font-size:16px">f</span>&nbsp;&nbsp;صفحة المنارة على فيسبوك`, COLORS.facebook, "#ffffff", "10px 24px", 14)}
        </td></tr>
      </table>
    </td></tr>`);
  }

  const footerLinks = [
    `<a href="${escapeHtml(context.siteUrl)}" style="color:${COLORS.header};text-decoration:none">الموقع</a>`,
    context.facebookUrl && `<a href="${escapeHtml(context.facebookUrl)}" style="color:${COLORS.header};text-decoration:none">فيسبوك</a>`,
  ]
    .filter(Boolean)
    .join("&nbsp;·&nbsp;");
  const unsubscribe = context.unsubscribeUrl
    ? ` <a href="${escapeHtml(context.unsubscribeUrl)}" style="color:${COLORS.muted};text-decoration:underline">إيقاف رسائل التحديثات</a>`
    : "";

  const preheader = content.preheader?.trim();
  const html = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escapeHtml(context.subject)}</title>
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
    ${blocks.join("\n    ")}
    <tr><td style="padding:0 32px"><div style="height:1px;background:${COLORS.line};font-size:0;line-height:0">&nbsp;</div></td></tr>
    <tr><td align="center" style="padding:22px 32px 28px;font-family:${FONT}">
      <p style="margin:0;font-size:17px;color:${COLORS.header}">﴿ وَقُل رَّبِّ زِدْنِي عِلْمًا ﴾</p>
      <p style="margin:4px 0 0;font-size:12px;color:${COLORS.muted}">سورة طه — ١١٤</p>
    </td></tr>
  </table>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px">
    <tr><td align="center" style="padding:20px 16px 0;font-family:${FONT};font-size:12px;line-height:1.9;color:${COLORS.muted}">
      <strong style="color:${COLORS.header}">المنارة — قرآن وعلم وذكر</strong><br>
      ${footerLinks}<br>
      وصلتك هذه الرسالة لأنك مسجّل في المنارة.${unsubscribe}<br>
      © ${year} المنارة — جميع الحقوق محفوظة
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>`;

  const text = [
    "المنارة — قرآن وعلم وذكر",
    "",
    greeting,
    content.title.trim(),
    "",
    content.intro.trim(),
    ...(what ? ["", "ما هي الميزة؟", what] : []),
    ...(steps.length ? ["", "كيف تحصل عليها؟", ...steps.map((step, index) => `${index + 1}. ${step}`)] : []),
    ...(benefits.length ? ["", "ما الفائدة؟", ...benefits.map((benefit) => `- ${benefit}`)] : []),
    "",
    `${ctaLabel}: ${ctaUrl}`,
    ...(context.facebookUrl ? ["", `تابعنا على فيسبوك: ${context.facebookUrl}`] : []),
    ...(context.unsubscribeUrl ? ["", `لإيقاف رسائل التحديثات: ${context.unsubscribeUrl}`] : []),
  ].join("\n");

  return { subject: context.subject, html, text };
}
