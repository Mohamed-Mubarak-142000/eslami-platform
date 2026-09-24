# PROD-AN-01 — أحداث التحليلات والخصوصية

## الأحداث المسموحة (بلا PII)

| الحدث | الخصائص المسموحة |
|---|---|
| `add_to_cart` | `product_id`, `category_id`, `price_bucket`, `has_extras` |
| `remove_from_cart` | `product_id` |
| `coupon_applied` / `coupon_rejected` | `coupon_code`(opaque إن حساس)، `reason` (للرفض) |
| `begin_checkout` | `subtotal_bucket`, `zone_id`, `item_count` |
| `whatsapp_order_sent` | `order_ref`, `total_bucket`, `payment_method` |
| `whatsapp_popup_blocked` | لا خصائص إضافية |
| `offer_viewed` / `offer_clicked` | `offer_id` |
| `admin_export_json` | لا خصائص (حدث تشغيلي داخلي فقط، لا يُرسل لأداة تحليلات خارجية) |

## ممنوع صراحة

اسم العميل، رقم الهاتف، العنوان الكامل، نص أي حقل حر (ملاحظات الطلب)، محتوى
رسالة واتساب الكاملة، أي معرّف يمكن ربطه بشخص حقيقي دون تجهيل.

## أين تُخزَّن بيانات العميل فعليًا

- نموذج الطلب: في الذاكرة فقط أثناء الجلسة، وبناء رسالة واتساب، بلا إرسال لأي
  خادم لدينا. حفظ اختياري في `localStorage` لتعبئة النموذج تلقائيًا لاحقًا على
  **نفس الجهاز فقط** — يحتاج نص إفصاح مرئي قصير في نموذج الـcheckout نفسه
  ("سنحفظ بياناتك على هذا الجهاز لتسهيل طلبك القادم") لا فقط في الوثائق.
