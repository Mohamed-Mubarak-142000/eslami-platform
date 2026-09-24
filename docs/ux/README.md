# حزمة تجربة المستخدم — Twister Crepes & Pizza (`twister-storefront-v1`)

هذه الحزمة عقد التنفيذ بين المنتج والتصميم والواجهة. العربية وRTL هما الوضع
الأساسي، وكل معرّف ثابت يُحتفظ به في التصميم وStorybook والاختبارات.

| المهمة | المخرج |
|---|---|
| UX-001 | [information-architecture.md](information-architecture.md): خريطة الموقع والتنقل والقوالب |
| UX-002 | [task-flows.md](task-flows.md): الرحلات الحرجة (طلب واتساب، عرض، أدمن) |
| UX-003 | [wireframes.md](wireframes.md): مواصفات نصية لكل شاشات P0 والاستجابة |
| UX-004 | [states-and-microcopy.md](states-and-microcopy.md): الحالات والنصوص العربية |
| UX-005 | [usability-test-plan.md](usability-test-plan.md): خطة اختبار قابلة للتنفيذ |
| UX-MOTION-01 | [motion-choreography.md](motion-choreography.md): مواصفة GSAP/ScrollTrigger وتعطيل الحركة |
| UX-A11Y-01 | [accessibility.md](accessibility.md): مواصفة إمكانية الوصول |
| UX-INV-01 | [component-inventory.md](component-inventory.md): مخزون المكونات — عقد design-system-agent |
| بوابة التسليم | [traceability.md](traceability.md): ربط CAP/US بالشاشة والمسار والحالة |

## قواعد القراءة والتنفيذ

- `SCR-*` شاشة، `FLW-*` رحلة، `STA-*` حالة، `CPY-*` نص، `PAT-*` نمط داخل الشاشة.
- كل شاشة عامة قابلة للفهرسة إلا `admin/**` (`noindex` + `robots.txt disallow`).
- إخفاء عنصر في الواجهة لا يمثل حماية بيانات — لوحة التحكم محلية بالكامل، انظر
  `docs/product/governance.md`.
- الحركة تحسين تدريجي دومًا؛ لا وظيفة تعتمد على اكتمال أنيميشن.
- الأولوية عند التعارض: متطلبات المنتج المقبولة (`docs/product/`)، ثم هذه
  الحزمة، ثم أي توجيه بصري قديم من منصة "المنارة" السابقة.

## أرشيف

وثائق UX لمنصة "بَصيرة"/"المنارة" الإسلامية السابقة محفوظة بالكامل في تاريخ
Git (وسم `almanara-final`) وليست جزءًا من هذه الحزمة.
