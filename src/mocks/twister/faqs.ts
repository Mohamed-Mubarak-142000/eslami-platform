import type { Faq } from "@/domain/twister";

export const faqs: readonly Faq[] = [
  {
    id: "faq-delivery-time",
    question: "التوصيل بياخد قد إيه؟",
    answer: "المدة تختلف حسب المنطقة وزحمة الطلبات، هيتأكد لك الميعاد في محادثة واتساب بعد إرسال الطلب.",
    order: 1,
  },
  {
    id: "faq-payment",
    question: "طرق الدفع المتاحة إيه؟",
    answer: "كاش عند الاستلام، وفودافون كاش — التفاصيل النهائية تُعتمد من صاحب المطعم.",
    order: 2,
  },
  {
    id: "faq-zones",
    question: "هل بتوصلوا لكل المناطق؟",
    answer: "لأ، في مناطق لسه مش متاحة — هتلاقي الحالة موضحة جنب كل منطقة قبل ما تكمل الطلب.",
    order: 3,
  },
  {
    id: "faq-coupon",
    question: "إزاي أستخدم كود خصم؟",
    answer: "اكتب الكود في خانة الكوبون بالسلة، لو غير صالح هيظهر لك السبب واضح.",
    order: 4,
  },
];
