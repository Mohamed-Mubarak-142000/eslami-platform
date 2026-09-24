# UX-001 — بنية المعلومات والتنقل

## خريطة الموقع

```text
عام (مفهرس)
├─ SCR-001 الرئيسية                              /
├─ SCR-002 المنيو                                /menu?category=&q=
├─ SCR-003 تفاصيل منتج                            /menu/:slug
├─ SCR-007 العروض                                 /offers
├─ SCR-008 التقييمات                              /reviews
├─ SCR-009 اتصل بنا                                /contact
└─ SCR-010 عدم الاتصال (PWA)                       /offline

ضيف — noindex (لا يحتاج تسجيل دخول)
├─ SCR-004 السلة                                   /cart
├─ SCR-005 إتمام الطلب                             /checkout
└─ SCR-006 تأكيد الإرسال                           حالة داخل /checkout بعد نجاح الفتح

إدارة — noindex + robots disallow
├─ SCR-020 تسجيل دخول الأدمن                       /admin/login
├─ SCR-021 لوحة القيادة                            /admin
├─ SCR-022 المنتجات                                /admin/products
├─ SCR-023 العروض                                  /admin/offers
├─ SCR-024 المناطق                                 /admin/zones
├─ SCR-025 الكوبونات                               /admin/coupons
├─ SCR-026 البانرات                                /admin/banners
├─ SCR-027 الإعلانات                               /admin/announcements
└─ SCR-028 سجل الطلبات                             /admin/orders
```

سلة/checkout **ضيف بالكامل** — لا `SCR` تحت مسار حساب لأن لا حسابات عملاء في
هذا المعلم (انظر `docs/product/scope.md`).

## القوالب

- `LAY-A Storefront`: Header (شعار + 6 عناصر تنقل + CTA اطلب الآن + drawer
  موبايل) + main + Footer + عناصر ثابتة (StickyWhatsApp, StickyCart) +
  CartDrawer عائم فوق كل الصفحات. تُستخدم لـSCR-001..003, 007..010.
- `LAY-B Checkout Flow`: نفس Header/Footer لكن main بعرض أضيق (max ~720px)
  ومحتوى خطوة واحدة مركّز، بلا تشتيت جانبي. تُستخدم لـSCR-004, 005.
- `LAY-C Admin`: side nav (سطح مكتب) / bottom tabs أو drawer (موبايل) + toolbar
  + منطقة محتوى (جدول/نموذج). تُستخدم لـSCR-020..028.

## التنقل حسب العرض

| السطح | الهاتف `<640` | اللوحي `640–1023` | سطح المكتب `≥1024` |
|---|---|---|---|
| Header | شعار + زر قائمة (drawer) + أيقونة سلة | نفس الهاتف مع مسافات أوسع | شعار + 6 روابط أفقية + CTA + أيقونة سلة |
| CTA اطلب الآن | ضمن drawer + Sticky bar أسفل الشاشة | ضمن Header | ضمن Header |
| CartDrawer | يغطي الشاشة كاملة (`Sheet` full-height) | يغطي ~70% من العرض من الاتجاه الختامي (RTL: من اليسار) | لوحة جانبية عرض ثابت ~420px |
| Admin nav | Bottom tabs أو drawer قابل للسحب | side rail مصغّر (أيقونات) | side nav كامل بالتسميات |

## قواعد

- كل مسار عام قابل للفهرسة إلا `admin/**` (`noindex` + `robots.txt disallow`).
- إخفاء رابط في الواجهة لا يعني حماية بيانات؛ الحماية الوحيدة المتاحة هنا هي
  كوكي تسجيل دخول الأدمن (انظر `docs/product/governance.md`).
- لا رابط "دخول/تسجيل عميل" في أي مكان — الطلب ضيف فقط، هذا قرار منتج نهائي.
