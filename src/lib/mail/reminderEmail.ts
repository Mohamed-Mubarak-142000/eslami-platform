/**
 * Special-day reminder email (Friday & al-Kahf, fasting days, the seasons). Pure, so the admin
 * page previews the exact HTML that the cron sends. Content comes from the occasions registry.
 */

import type { ReminderContent } from "@/features/reminders/occasions";
import { badge, button, COLORS, escapeHtml, FONT, greetingFor, paragraph, renderShell, sectionHeading } from "./emailLayout";

export interface ReminderEmailContext {
  siteUrl: string;
  recipientName?: string;
  facebookUrl?: string | null;
  unsubscribeUrl?: string;
}

export interface RenderedReminder {
  subject: string;
  html: string;
  text: string;
}

function virtueCards(virtues: ReminderContent["virtues"]) {
  return virtues
    .map(
      (
        virtue,
        index,
      ) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLORS.tint};border-right:4px solid ${COLORS.gold};border-radius:10px${index ? ";margin-top:10px" : ""}">
          <tr><td dir="rtl" style="padding:14px 18px;font-family:${FONT};text-align:right;color:${COLORS.ink}">
            <p style="margin:0;font-size:15px;line-height:1.9">${paragraph(virtue.text)}</p>
            <p style="margin:6px 0 0;font-size:12px;color:${COLORS.goldText}">${escapeHtml(virtue.source)}</p>
          </td></tr>
        </table>`,
    )
    .join("");
}

function tipRows(tips: string[]) {
  return tips
    .map(
      (tip, index) =>
        `<p style="margin:0 0 ${index === tips.length - 1 ? 0 : 6}px;font-size:15px;line-height:1.8"><span style="color:${COLORS.gold}">✔</span>&nbsp; ${paragraph(tip)}</p>`,
    )
    .join("");
}

/** Side by side on wide screens; email clients wrap the cells on narrow ones. */
function actionButtons(actions: { label: string; href: string }[]) {
  const cells = actions.map((action, index) => {
    const main = index === 0;
    return `<td align="center" style="padding:6px">${button(
      action.href,
      escapeHtml(action.label),
      main ? COLORS.gold : COLORS.card,
      main ? COLORS.night : COLORS.header,
      main ? "14px 30px" : "12px 28px",
      16,
      main ? "" : `2px solid ${COLORS.header}`,
    )}</td>`;
  });
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center"><tr>${cells.join("")}</tr></table>`;
}

const absolute = (siteUrl: string, href: string) => (/^https?:\/\//.test(href) ? href : `${siteUrl}${href}`);

export function renderReminderEmail(content: ReminderContent, context: ReminderEmailContext): RenderedReminder {
  const greeting = greetingFor(context.recipientName);
  const actions = content.actions.map((action) => ({ ...action, href: absolute(context.siteUrl, action.href) }));
  const accountUrl = `${context.siteUrl}/account`;

  const blocks: string[] = [];

  blocks.push(`<tr><td dir="rtl" style="padding:34px 32px 6px;font-family:${FONT};text-align:right;color:${COLORS.ink}">
      ${badge(content.badge)}
      <p style="margin:18px 0 6px;font-size:14px;color:${COLORS.muted}">${escapeHtml(greeting)}</p>
      <h1 style="margin:0 0 14px;font-size:24px;line-height:1.5;color:${COLORS.header}">${escapeHtml(content.title)}</h1>
      <p style="margin:0;font-size:15px;line-height:1.9">${paragraph(content.intro)}</p>
    </td></tr>`);

  if (actions.length) {
    blocks.push(`<tr><td align="center" style="padding:24px 26px 0">${actionButtons(actions)}</td></tr>`);
  }

  if (content.virtues.length) {
    blocks.push(`<tr><td dir="rtl" style="padding:28px 32px 0;font-family:${FONT};text-align:right">
      ${sectionHeading("فضل اليوم", 12)}
      ${virtueCards(content.virtues)}
    </td></tr>`);
  }

  if (content.tips.length) {
    blocks.push(`<tr><td dir="rtl" style="padding:26px 32px 0;font-family:${FONT};text-align:right;color:${COLORS.ink}">
      ${sectionHeading("ماذا تفعل؟", 10)}
      ${tipRows(content.tips)}
    </td></tr>`);
  }

  if (actions.length) {
    blocks.push(`<tr><td align="center" style="padding:28px 26px 32px">${actionButtons(actions)}</td></tr>`);
  } else {
    blocks.push(`<tr><td style="padding:0 0 32px;font-size:0;line-height:0">&nbsp;</td></tr>`);
  }

  const html = renderShell({
    subject: content.subject,
    siteUrl: context.siteUrl,
    preheader: content.preheader,
    blocks,
    verse: content.verse,
    facebookUrl: context.facebookUrl,
    reason: "وصلتك هذه الرسالة لأنك مشترك في تذكيرات المنارة بالأيام المميزة.",
    extraLinks: [`<a href="${escapeHtml(accountUrl)}" style="color:${COLORS.header};text-decoration:none">إدارة التذكيرات</a>`],
    ...(context.unsubscribeUrl && { unsubscribe: { url: context.unsubscribeUrl, label: "إيقاف التذكيرات" } }),
  });

  const text = [
    "المنارة — قرآن وعلم وذكر",
    "",
    greeting,
    content.title,
    "",
    content.intro,
    ...(content.virtues.length ? ["", "فضل اليوم:", ...content.virtues.map((virtue) => `- ${virtue.text} (${virtue.source})`)] : []),
    ...(content.tips.length ? ["", "ماذا تفعل؟", ...content.tips.map((tip) => `- ${tip}`)] : []),
    ...(actions.length ? ["", ...actions.map((action) => `${action.label}: ${action.href}`)] : []),
    "",
    `${content.verse.text} — ${content.verse.ref}`,
    "",
    `إدارة التذكيرات: ${accountUrl}`,
    ...(context.unsubscribeUrl ? [`لإيقاف التذكيرات: ${context.unsubscribeUrl}`] : []),
  ].join("\n");

  return { subject: content.subject, html, text };
}
