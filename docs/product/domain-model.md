# PROD-005 — المصطلحات والكيانات والحالات

هذا هو المرجع اللفظي لـ`foundation-agent` عند كتابة `src/domain/twister/**`؛
الأسماء هنا هي نفسها المتوقعة في الأنواع/الـschemas (بالإنجليزية في الكود،
موضّحة هنا بالعربية للسياق).

## الكيانات

| كيان | الحقول الجوهرية | ملاحظات |
|---|---|---|
| `Category` | id, name(ar), order | التصنيف المعتمد الموحّد — انظر `menu-catalog.md` |
| `Product` | id, categoryId, name, description, images[], basePrice, sizes[]?, extras[]?, spicyLevels[]?, calories?, isBestseller, isAvailable, verified | `verified: false` = بيانات placeholder |
| `Size` | id, label, priceDelta | فرق السعر عن `basePrice`، لا سعر مطلق مستقل |
| `Extra` | id, label, price, compatibleSizes?[] | إن غاب `compatibleSizes` فمتوافق مع كل المقاسات |
| `SpicyLevel` | id, label, order | لا يغيّر السعر |
| `CartLine` | productId, sizeId?, extraIds[], spicyLevelId?, quantity, notes?, unitPrice(محسوب) | `unitPrice` محسوب لحظيًا من domain، لا يُخزَّن كقيمة ثابتة |
| `Offer` | id, title, description, startAt, endAt, bannerImage, linkedCategoryId? | يقود لصفحة منيو مفلترة عند وجود `linkedCategoryId` |
| `Coupon` | code, kind(percent\|fixed\|freeItem), value, minSubtotal, expiresAt, stackable | القواعد الكاملة في `business-rules.md` |
| `Zone` | id, name, deliveryFee, minOrder, isServed | `isServed:false` = "غير مخدومة حاليًا" في الواجهة |
| `Review` | id, authorName, rating(1-5), text, source(real\|placeholder) | `source:placeholder` يُعرض بوسم واضح دومًا |
| `Faq` | id, question, answer, order | |
| `Banner` | id, image, headline, ctaHref, order | يستخدمه bestseller/hero/offers |
| `Announcement` | id, text, isActive | يستبدل "push notifications" لهذا المعلم — شريط داخل التطبيق فقط |
| `BusinessInfo` | address, phone, whatsappNumber, socials{}, hours[], verified | verified=false حتى تأكيد صاحب المطعم |
| `OrderDraft` | customer{name,phone,address,zoneId,landmark?}, lines[], couponCode?, paymentMethod, notes? | يُبنى منه نص واتساب |
| `Order` | orderRef, draft, totals, createdAt, status(local-log) | يُخزَّن محليًا فقط في متصفح الإدارة |

## الحالات (states)

- **منتج**: `available` → `unavailable` (يدويًا من لوحة التحكم؛ لا حالة "نفذت
  الكمية" تلقائية في هذا المعلم لعدم وجود مخزون حقيقي).
- **عرض**: `scheduled` (لم يبدأ) → `active` → `expired` — محسوبة من التواريخ،
  لا تُخزَّن كحقل منفصل يحتاج تحديثًا يدويًا.
- **كوبون**: `valid` → `expired` | `below-minimum` | `not-found` — الحالة تُحسب
  عند إدخال الكود، لا تُخزَّن.
- **طلب (سجل محلي)**: `submitted` (فور فتح واتساب بنجاح) — لا حالات "مؤكد/تم
  التسليم" لأن التأكيد يحدث في محادثة واتساب خارج الموقع تمامًا.

## قاموس مصطلحات (Arabic → متغيرات الكود)

`سلة` = cart، `سعر أساسي` = basePrice، `فرق سعر` = priceDelta، `هدية تلقائية` =
autoGift، `رسوم توصيل` = deliveryFee، `حد أدنى للطلب` = minOrder، `مرجع الطلب` =
orderRef (صيغة: `TW-YYMMDD-XXXX`).
