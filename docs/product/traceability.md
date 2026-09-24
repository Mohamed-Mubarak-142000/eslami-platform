# PROD-006 — التتبع من القدرات إلى الشاشات والتحليلات

## مصفوفة P0

| Capability | الشاشات/المسارات | القصص | التحليلات المسموحة |
|---|---|---|---|
| CAP-SHELL | كل الصفحات (Header/Footer/Loading) | US-HOME | — |
| CAP-HERO | `/` | US-HOME | — |
| CAP-HOME | `/` | US-HOME | `offer_viewed`, `offer_clicked` |
| CAP-MENU | `/menu` | US-MENU | `add_to_cart` (من QuickPreview) |
| CAP-PRODUCT | `/menu/[slug]` | US-PRODUCT | `add_to_cart` |
| CAP-CART | CartDrawer، `/cart` | US-CART | `remove_from_cart`, `coupon_applied`, `coupon_rejected` |
| CAP-CHECKOUT | `/checkout` | US-CHECKOUT | `begin_checkout`, `whatsapp_order_sent`, `whatsapp_popup_blocked` |
| CAP-OFFERS | `/offers` | US-OFFERS | `offer_viewed`, `offer_clicked` |
| CAP-REVIEWS | `/reviews` | — | — |
| CAP-CONTACT | `/contact` | — | — |
| CAP-ADMIN | `/admin/**` | US-ADMIN | `admin_export_json` |
| CAP-PWA | manifest/SW/`/offline` | — | — |
| CAP-STATES | كل ما سبق | US-STATES | `ui_error_shown` (code فقط) |

## تغطية الحالات والاختبارات المطلوبة (qa-agent)

لكل صف أعلاه: اختبار happy path، empty، خطأ شبكة/offline، RTL عند 360px،
keyboard/a11y. رحلات E2E الحرجة: تصفح → إضافة سلة → checkout → فتح واتساب
(مع اعتراض النافذة المنبثقة والتحقق من فك ترميز النص)؛ تطبيق كوبون صحيح/خاطئ؛
تفعيل هدية البطاطس التلقائية عند بلوغ الحد؛ دخول admin → CRUD → تصدير JSON؛
عرض offline fallback.

## قرارات UX مطلوبة من التسليم التالي (`ux-agent`)

- صياغة نهائية لشارة "تقييم/بيانات توضيحية" (`reviews-policy.md`).
- تصميم رسالة "المطعم مغلق حاليًا" بحيث لا تبدو كخطأ يمنع المتابعة.
- تصميم حالة "المنطقة غير مخدومة" و"أقل من الحد الأدنى للطلب" في نموذج التوصيل.
- مخزون مكوّنات (Component inventory) يقابله design-system بمصفوفة تغطية.
