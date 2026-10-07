/**
 * The thank-you email sent when an admin approves an InstaPay donation (/admin/supporters). Pure, like
 * the other templates, so it can be previewed without sending.
 */

import { arabicNumber, badge, COLORS, escapeHtml, FONT, greetingFor, paragraph, renderShell } from "./emailLayout";

export interface SupporterThanks {
  siteUrl: string;
  recipientName: string;
  amount: number;
  facebookUrl?: string | null;
}

export function renderSupporterThanks({ siteUrl, recipientName, amount, facebookUrl }: SupporterThanks) {
  const subject = "جزاك الله خيرًا على دعمك للمنارة";
  const greeting = greetingFor(recipientName);
  const amountLine = `وصلنا دعمك بمبلغ ${arabicNumber(amount)} جنيه، وتأكدنا من التحويل.`;
  const body =
    "دعمك يغطي الخوادم ويضيف قرّاءً وروايات ومحتوى جديدًا، ويبقي المنارة مجانية للجميع. نسأل الله أن يجعله صدقة جارية في ميزان حسناتك، وأن يبارك لك في مالك وأهلك.";

  const blocks = [
    `<tr><td dir="rtl" style="padding:34px 32px 32px;font-family:${FONT};text-align:right;color:${COLORS.ink}">
      ${badge("✦ من داعمي المنارة")}
      <p style="margin:18px 0 6px;font-size:14px;color:${COLORS.muted}">${escapeHtml(greeting)}</p>
      <h1 style="margin:0 0 14px;font-size:24px;line-height:1.5;color:${COLORS.header}">جزاك الله خيرًا</h1>
      <p style="margin:0 0 12px;font-size:15px;line-height:1.9">${escapeHtml(amountLine)}</p>
      <p style="margin:0;font-size:15px;line-height:1.9">${paragraph(body)}</p>
      <p style="margin:16px 0 0;font-size:14px;line-height:1.9;color:${COLORS.muted}">سيظهر اسمك ضمن «داعمي المنارة» في الصفحة الرئيسية للتطبيق.</p>
    </td></tr>`,
  ];

  const html = renderShell({
    subject,
    siteUrl,
    preheader: amountLine,
    blocks,
    verse: {
      text: "﴿مَّثَلُ الَّذِينَ يُنفِقُونَ أَمْوَالَهُمْ فِي سَبِيلِ اللَّهِ كَمَثَلِ حَبَّةٍ أَنبَتَتْ سَبْعَ سَنَابِلَ﴾",
      ref: "البقرة: ٢٦١",
    },
    facebookUrl,
    reason: "وصلتك هذه الرسالة لأنك أرسلت دعمًا للمنارة من التطبيق.",
  });

  const text = ["المنارة — قرآن وعلم وذكر", "", greeting, "جزاك الله خيرًا", "", amountLine, "", body].join("\n");
  return { subject, html, text };
}
