/**
 * "New feature" announcement email. Pure (no server-only imports) so the admin page can render
 * the exact same HTML as a live preview. Same visual language as otpEmail.ts: table layout and
 * inline styles only, since Gmail/Outlook drop <style> blocks and flexbox. Every admin-written
 * string is HTML-escaped before it goes into the template.
 */

import { arabicNumber, badge, button, COLORS, escapeHtml, FONT, greetingFor, paragraph, renderShell, sectionHeading } from "./emailLayout";

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

const clean = (items: string[] | undefined) => (items ?? []).map((item) => item.trim()).filter(Boolean);

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

export function renderAnnouncementEmail(content: AnnouncementContent, context: AnnouncementContext): RenderedAnnouncement {
  const steps = clean(content.steps);
  const benefits = clean(content.benefits);
  const what = content.what?.trim() ?? "";
  const ctaUrl = content.ctaUrl?.trim() || context.siteUrl;
  const ctaLabel = content.ctaLabel?.trim() || "جرّب الميزة الآن";
  const greeting = greetingFor(context.recipientName);

  const blocks: string[] = [];

  blocks.push(`<tr><td dir="rtl" style="padding:34px 32px 6px;font-family:${FONT};text-align:right;color:${COLORS.ink}">
      ${badge("✦ ميزة جديدة")}
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

  const html = renderShell({
    subject: context.subject,
    siteUrl: context.siteUrl,
    preheader: content.preheader,
    blocks,
    verse: { text: "﴿ وَقُل رَّبِّ زِدْنِي عِلْمًا ﴾", ref: "سورة طه — ١١٤" },
    facebookUrl: context.facebookUrl,
    reason: "وصلتك هذه الرسالة لأنك مسجّل في المنارة.",
    ...(context.unsubscribeUrl && { unsubscribe: { url: context.unsubscribeUrl, label: "إيقاف رسائل التحديثات" } }),
  });

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
