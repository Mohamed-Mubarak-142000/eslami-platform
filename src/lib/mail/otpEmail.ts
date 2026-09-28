import "server-only";
import type { OtpPurpose } from "@/lib/supabase/database.types";
import { SITE_URL } from "@/lib/supabase/env";

/**
 * Branded OTP email. Table layout with inline styles only, since Gmail/Outlook drop <style>
 * blocks and flexbox; colors mirror the site tokens in globals.css.
 */

const COLORS = {
  page: "#f3ecdc",
  card: "#ffffff",
  header: "#003e32",
  ink: "#183d34",
  muted: "#5d7169",
  gold: "#cda23e",
  goldSoft: "#e8d7a6",
  codeBg: "#fbf8f1",
  line: "#ece3cf",
};

const FONT = "Tahoma, 'Segoe UI', Arial, sans-serif";

const COPY: Record<OtpPurpose, { subject: string; title: string; lead: string }> = {
  signup: {
    subject: "كود تأكيد حسابك في المنارة",
    title: "أهلًا بك في المنارة",
    lead: "شكرًا لتسجيلك. أدخل الكود التالي لتأكيد بريدك الإلكتروني وتفعيل حسابك:",
  },
  recovery: {
    subject: "كود استعادة كلمة المرور",
    title: "استعادة كلمة المرور",
    lead: "وصلنا طلب لإعادة تعيين كلمة المرور لحسابك. أدخل الكود التالي للمتابعة:",
  },
  email: {
    subject: "كود الدخول إلى المنارة",
    title: "كود تسجيل الدخول",
    lead: "استخدم الكود التالي لتسجيل الدخول إلى حسابك:",
  },
};

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

export function renderOtpEmail(purpose: OtpPurpose, code: string, ttlMinutes: number): RenderedEmail {
  const copy = COPY[purpose];
  const site = SITE_URL.replace(/\/$/, "");
  const host = site.replace(/^https?:\/\//, "");
  const year = new Date().getFullYear();
  const digits = code
    .split("")
    .map(
      (digit) =>
        `<td style="padding:0 4px"><div style="width:44px;height:56px;line-height:56px;border:1px solid ${COLORS.goldSoft};border-radius:10px;background:${COLORS.codeBg};font-family:'Courier New',monospace;font-size:28px;font-weight:bold;color:${COLORS.header};text-align:center">${digit}</div></td>`,
    )
    .join("");

  const html = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${copy.subject}</title>
</head>
<body style="margin:0;padding:0;background:${COLORS.page};-webkit-text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">كودك هو ${code} — صالح لمدة ${ttlMinutes} دقيقة.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLORS.page}">
<tr><td align="center" style="padding:32px 12px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:${COLORS.card};border-radius:18px;overflow:hidden;box-shadow:0 8px 30px rgba(1,42,34,0.08)">
    <tr><td align="center" style="background:${COLORS.header};padding:30px 24px 26px">
      <div style="font-family:${FONT};font-size:13px;letter-spacing:4px;color:${COLORS.gold}">✦ ✦ ✦</div>
      <div style="font-family:${FONT};font-size:30px;font-weight:bold;color:#ffffff;margin-top:6px">المنارة</div>
      <div style="font-family:${FONT};font-size:13px;color:${COLORS.goldSoft};margin-top:4px">قرآن وعلم وذكر</div>
    </td></tr>
    <tr><td style="height:4px;background:${COLORS.gold};font-size:0;line-height:0">&nbsp;</td></tr>
    <tr><td dir="rtl" style="padding:34px 32px 8px;font-family:${FONT};text-align:right;color:${COLORS.ink}">
      <p style="margin:0 0 6px;font-size:14px;color:${COLORS.muted}">السلام عليكم ورحمة الله،</p>
      <h1 style="margin:0 0 14px;font-size:22px;line-height:1.5;color:${COLORS.header}">${copy.title}</h1>
      <p style="margin:0;font-size:15px;line-height:1.9">${copy.lead}</p>
    </td></tr>
    <tr><td align="center" style="padding:26px 20px 10px">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" dir="ltr"><tr>${digits}</tr></table>
    </td></tr>
    <tr><td align="center" style="padding:6px 32px 28px;font-family:${FONT};font-size:13px;color:${COLORS.muted}">
      ⏱ الكود صالح لمدة <strong style="color:${COLORS.ink}">${ttlMinutes} دقيقة</strong> ويُستخدم مرة واحدة فقط.
    </td></tr>
    <tr><td style="padding:0 32px 30px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fbf6ea;border-right:4px solid ${COLORS.gold};border-radius:10px">
        <tr><td dir="rtl" style="padding:14px 16px;font-family:${FONT};font-size:13px;line-height:1.9;color:${COLORS.ink};text-align:right">
          <strong>🔒 للحفاظ على أمان حسابك:</strong> لا تشارك هذا الكود مع أي شخص، فريق المنارة لن يطلبه منك أبدًا.
          إن لم تطلب هذا الكود فتجاهل الرسالة، ولن يتغيّر شيء في حسابك.
        </td></tr>
      </table>
    </td></tr>
    <tr><td style="padding:0 32px"><div style="height:1px;background:${COLORS.line};font-size:0;line-height:0">&nbsp;</div></td></tr>
    <tr><td align="center" style="padding:22px 32px 28px;font-family:${FONT}">
      <p style="margin:0;font-size:17px;color:${COLORS.header}">﴿ وَقُل رَّبِّ زِدْنِي عِلْمًا ﴾</p>
      <p style="margin:4px 0 0;font-size:12px;color:${COLORS.muted}">سورة طه — ١١٤</p>
    </td></tr>
  </table>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px">
    <tr><td align="center" style="padding:20px 16px 0;font-family:${FONT};font-size:12px;line-height:1.9;color:${COLORS.muted}">
      <a href="${site}" style="color:${COLORS.header};text-decoration:none;font-weight:bold">${host}</a><br>
      هذه رسالة تلقائية، يُرجى عدم الرد عليها.<br>
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
    "السلام عليكم ورحمة الله،",
    copy.title,
    "",
    copy.lead,
    "",
    `    ${code}`,
    "",
    `الكود صالح لمدة ${ttlMinutes} دقيقة ويُستخدم مرة واحدة فقط.`,
    "لا تشارك هذا الكود مع أي شخص، فريق المنارة لن يطلبه منك أبدًا.",
    "إن لم تطلب هذا الكود فتجاهل الرسالة.",
    "",
    site,
  ].join("\n");

  return { subject: copy.subject, html, text };
}
