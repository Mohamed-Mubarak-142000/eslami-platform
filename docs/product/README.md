# حزمة متطلبات المنتج — Twister Crepes & Pizza (`twister-storefront-v1`)

هذه الحزمة هي مرجع التنفيذ لبقية خط الأنابيب. عند التعارض، القرارات المعلّمة
`مطلوب اعتماد` أو `owner-confirm` لا تتحول إلى بيانات إنتاج نهائية قبل تأكيد
صاحب المطعم.

| المهمة | المخرج |
|---|---|
| PROD-001 | [scope.md](scope.md): الوعد، النطاق P0/P1، الاستبعادات، بوابات الإطلاق |
| PROD-002 | [personas-permissions.md](personas-permissions.md): الشخصيات والأدوار (guest/admin) |
| PROD-003 | [p0-requirements.md](p0-requirements.md): قصص P0 ومعايير القبول والحالات الطرفية |
| PROD-004 | [governance.md](governance.md): الخصوصية وسلامة المحتوى وحوكمة بيانات الإدارة |
| PROD-005 | [domain-model.md](domain-model.md): الكيانات والحقول والحالات لـ`src/domain/twister` |
| PROD-006 | [traceability.md](traceability.md): ربط القدرات بالشاشات والقصص والتحليلات |
| PROD-BR-01 | [business-rules.md](business-rules.md): التسعير، الكوبونات، هدية البطاطس، التوصيل، الضريبة، الساعات |
| PROD-WA-01 | [whatsapp-order-message.md](whatsapp-order-message.md): قالب رسالة واتساب الحرفي وآلية الإرسال |
| PROD-MENU-01 | [menu-catalog.md](menu-catalog.md): المنيو الموحّد الكامل (كل الأسعار placeholder) |
| PROD-OFF-01 | [offers.md](offers.md): افتتاح كبير، بطاطس هدية، عروض الخميس |
| PROD-FACTS-01 | [business-facts.md](business-facts.md): تتبع البيانات الحقيقية المفقودة (شعار/صور/عنوان/مناطق...) |
| PROD-ADMIN-01 | [admin-requirements.md](admin-requirements.md): نطاق لوحة التحكم المحلية بلا خادم |
| PROD-AN-01 | [analytics-privacy.md](analytics-privacy.md): أحداث التحليلات المسموحة وخصوصية بيانات العميل |
| PROD-REV-01 | [reviews-policy.md](reviews-policy.md): منع عرض تقييمات مصطنعة كحقيقية |
| — | [twister-storefront-v1.md](twister-storefront-v1.md): ملخص المعلم ومعايير القبول والاستبعادات |

## قواعد استخدام الحزمة

- المعرّفات ثابتة وتُستخدم في UX/التصميم/الاختبارات/قرارات التسليم.
- `يجب` = شرط قبول P0؛ `ينبغي` = توصية لا تمنع التسليم إلا إذا وردت في معيار قبول.
- كل شاشة تنفذ حالات `loading/empty/error/offline/closed-hours` المناسبة.
- لا بيانات عميل حقيقية (اسم/هاتف/عنوان) تُرسل إلى analytics أو تُخزَّن على خادم.
- كل سعر أو بيانة تواصل لم تُؤكَّد من صاحب المطعم تبقى موسومة `owner-confirm`
  حتى استبدالها الفعلي.

## أرشيف

خطة/وثائق منصة "بَصيرة"/"المنارة" الإسلامية السابقة محفوظة بالكامل في تاريخ
Git (وسم `almanara-final`) وليست جزءًا من هذه الحزمة.
