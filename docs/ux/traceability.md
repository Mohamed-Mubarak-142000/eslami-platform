# بوابة التسليم — التتبع من CAP/US إلى الشاشة والمسار والحالة

| Capability (منتج) | US (منتج) | SCR (UX) | FLW (UX) | حالات STA ذات الصلة |
|---|---|---|---|---|
| CAP-SHELL | US-HOME | كل SCR | — | STA-LOADING, STA-OFFLINE |
| CAP-HERO | US-HOME | SCR-001 | — | STA-LOADING |
| CAP-HOME | US-HOME | SCR-001 | FLW-02 | STA-EMPTY-MENU (عند فلترة صفر) |
| CAP-MENU | US-MENU | SCR-002 | FLW-01, FLW-02 | STA-EMPTY-MENU, STA-PRODUCT-UNAVAILABLE |
| CAP-PRODUCT | US-PRODUCT | SCR-003 | FLW-01 | STA-PRODUCT-UNAVAILABLE |
| CAP-CART | US-CART | SCR-004 | FLW-01 | STA-EMPTY-CART, STA-COUPON-INVALID, STA-GIFT-ADDED, STA-GIFT-REMOVED |
| CAP-CHECKOUT | US-CHECKOUT | SCR-005, SCR-006 | FLW-01 | STA-CLOSED-HOURS, STA-BELOW-MINIMUM, STA-ZONE-NOT-SERVED, STA-POPUP-BLOCKED |
| CAP-OFFERS | US-OFFERS | SCR-007 | FLW-02 | STA-LOADING |
| CAP-REVIEWS | — | SCR-008 | — | — |
| CAP-CONTACT | — | SCR-009 | — | — |
| CAP-ADMIN | US-ADMIN | SCR-020..028 | FLW-03 | STA-ADMIN-UNAUTH |
| CAP-PWA | — | SCR-010 | — | STA-OFFLINE |
| CAP-STATES | US-STATES | كل SCR | — | كل STA-* |

## قرارات مطلوبة من design-system-agent (التسليم التالي)

- إثبات تغطية كل عنصر في `component-inventory.md` بمصفوفة Storybook مقابلة.
- قيم tokens نهائية للألوان/الخطوط/الحركة مبنية على `motion-choreography.md`
  وقيود التباين المذكورة في `docs/product/scope.md`.
- حل واضح لتباين النص الأحمر على الأسود والنص الأبيض على الذهبي (استخدام نص
  غامق على الأزرار الذهبية، والأحمر لعناصر كبيرة/UI فقط لا نص فقرات).
