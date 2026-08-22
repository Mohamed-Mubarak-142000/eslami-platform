# Todo — خطة تنفيذ الـFrontend

الترميز: `[P0]` ضروري، `[P1]` تالٍ، `[P2]` مستقبلي. كل Epic ينتهي بـDemo قابل للاختبار، وليس بمجرد اكتمال ملفات.

## 0. Product discovery والقرارات — أسبوع 1

- [ ] `[P0]` اعتماد اسم مبدئي ووعد المنتج ونبرة الكتابة.
- [ ] `[P0]` مقابلات: 5 مستخدمين، 3 علماء/باحثين، و2 مشرفين.
- [ ] `[P0]` اعتماد تعريف العالم الموثق والأدلة المطلوبة وسحب التوثيق.
- [ ] `[P0]` اعتماد سياسة الخلاف والمصادر والإجابة المعتمدة.
- [ ] `[P0]` اعتماد سياسة السؤال الخاص والخصوصية والاحتفاظ.
- [ ] `[P0]` كتابة permission matrix للأدوار والإجراءات.
- [ ] `[P0]` تحويل قواعد العمل إلى حالات قبول قابلة للاختبار.
- [ ] `[P0]` تثبيت Scope الـMVP وما هو خارج النطاق.

**قبول:** وثيقة قرارات موقعة، لا توجد أسئلة حرجة مفتوحة تمنع تصميم Q&A أو Verification.

## 1. UX وInformation Architecture — أسبوع 1–2

- [ ] `[P0]` Sitemap نهائي للمستخدم والعالم والإدارة.
- [ ] `[P0]` رسم flows: onboarding، search-to-answer، ask، verification، moderation.
- [ ] `[P0]` Wireframes للـ12 شاشة الأساسية على mobile أولًا.
- [ ] `[P0]` Wireframes desktop وadmin للرحلات الحرجة.
- [ ] `[P0]` حالات empty/loading/error/offline/permission لكل شاشة.
- [ ] `[P0]` Prototype قابل للنقر واختباره مع مستخدمين حقيقيين.
- [ ] `[P0]` تعديل التصميم بناءً على نتائج الاختبار.

**قبول:** 80% على الأقل يكملون البحث والوصول لإجابة وطرح سؤال دون مساعدة.

## 2. Design System foundation — أسبوع 2–3

- [ ] `[P0]` إنشاء Figma variables للألوان والمسافات والخطوط والـradius/elevation.
- [ ] `[P0]` اختبار الخط العربي على Android/iOS/Windows/macOS.
- [ ] `[P0]` بناء Light/Dark themes وcontrast AA.
- [ ] `[P0]` تصميم grid وresponsive rules وAppShell.
- [ ] `[P0]` تصميم primitives الأساسية بكل الحالات.
- [ ] `[P0]` تصميم ScholarIdentity، TrustMark، SourceCitation، ContentCard.
- [ ] `[P0]` تصميم QuestionCard، AnswerPanel، OpinionGroup.
- [ ] `[P0]` تصميم Search، Filters، Verification، Moderation patterns.
- [ ] `[P0]` توثيق المكونات في Storybook مع RTL وmobile.
- [ ] `[P0]` Visual regression baseline.

**قبول:** لا تستخدم شاشة P0 لونًا أو مسافة أو عنصرًا خارج النظام دون توثيق.

## 3. Engineering foundation — أسبوع 3

- [ ] `[P0]` Scaffold Next.js + TypeScript strict + package manager lockfile.
- [ ] `[P0]` إعداد lint/format/typecheck وpre-commit hooks.
- [ ] `[P0]` إضافة tokens والخطوط وRTL والthemes.
- [ ] `[P0]` إعداد Storybook، Vitest، Testing Library، Playwright، MSW.
- [ ] `[P0]` إنشاء route groups وfeature-based structure.
- [ ] `[P0]` بناء API client وerror mapping وquery keys.
- [ ] `[P0]` بناء mock domain fixtures واقعية وغير منسوبة لأشخاص حقيقيين.
- [ ] `[P0]` إعداد CI: lint/typecheck/test/build/E2E smoke/a11y.
- [ ] `[P0]` إعداد analytics schema وerror monitoring interfaces.

**قبول:** Pull request تجريبي يمر آليًا بكل checks، وPreview deploy يعمل بالعربية RTL.

## 4. App Shell + Auth + Onboarding — أسبوع 4

- [ ] `[P0]` Landing وSEO metadata الأساسية.
- [ ] `[P0]` Login/Register/forgot password وحالات الخطأ.
- [ ] `[P0]` AppShell responsive + desktop side nav + mobile bottom nav.
- [ ] `[P0]` Onboarding: بيانات أساسية، اهتمامات، علماء مقترحون.
- [ ] `[P0]` session/route guards وpermission components.
- [ ] `[P0]` إعدادات الحساب والخصوصية الأساسية.
- [ ] `[P0]` اختبارات E2E للتسجيل والدخول والخروج.

**قبول:** مستخدم جديد يصل إلى Home مخصصة، مع حفظ تقدمه واستكمال onboarding المتقطع.

## 5. Knowledge Feed والمحتوى — أسبوع 5

- [ ] `[P0]` Feed tabs: لك/تتابعهم/الأحدث مع pagination.
- [ ] `[P0]` ContentCard variants للمنشور والمقال والإجابة.
- [ ] `[P0]` صفحة تفاصيل القراءة والمصادر وآخر تحديث.
- [ ] `[P0]` Follow وHelpful وSave وShare.
- [ ] `[P0]` Collections: إنشاء/تسمية/حفظ/إزالة.
- [ ] `[P0]` Report content flow.
- [ ] `[P0]` Skeletons وempty/error/offline/retry.
- [ ] `[P0]` اختبارات رجوع المستخدم إلى موضعه في الـFeed.

**قبول:** المستخدم يقرأ محتوى، يفهم مصدره وصفة صاحبه، يحفظه ويعود إليه دون فقد السياق.

## 6. Explore + Search + Profiles — أسبوع 6

- [ ] `[P0]` Explore: موضوعات، علماء، أسئلة رائجة، أحدث محتوى.
- [ ] `[P0]` Search autocomplete + recent searches.
- [ ] `[P0]` نتائج مبوبة: إجابات/علماء/مقالات/موضوعات.
- [ ] `[P0]` فلاتر النوع والتخصص والموضوع والتاريخ واللغة.
- [ ] `[P0]` URL-synced search/filter state.
- [ ] `[P0]` zero results مع اقتراحات ومسار «اطرح سؤالًا».
- [ ] `[P0]` Scholar profile + بطاقة الثقة + tabs.
- [ ] `[P0]` Topic page + follow topic.
- [ ] `[P0]` SEO/structured data للصفحات العامة.

**قبول:** يمكن مشاركة رابط بحث بفلاتره، والوصول من النتيجة إلى مصدر وهوية واضحة.

## 7. Questions & Answers — أسبوع 7–8

- [ ] `[P0]` Ask wizard: عنوان، تفاصيل، تصنيف، تخصص، عام/خاص، مراجعة.
- [ ] `[P0]` كشف نتائج مشابهة قبل الإرسال.
- [ ] `[P0]` My Questions وحالات pending/routed/answered/rejected.
- [ ] `[P0]` Question details وإخفاء بيانات السائل عند الحاجة.
- [ ] `[P0]` Answer editor للعالم مع sources validation.
- [ ] `[P0]` عرض الآراء المتعددة ووسم الخلاف المعتبر.
- [ ] `[P0]` Scholar questions inbox وفلاتر التخصص.
- [ ] `[P0]` إشعار داخل التطبيق عند تغير الحالة أو وصول إجابة.
- [ ] `[P0]` E2E لسؤال عام وخاص وإجابة عالم.

**قبول:** لا يمكن لمستخدم عادي نشر Answer، ولا يتسرب السؤال الخاص في UI أو analytics أو search mock contract.

## 8. Verification — أسبوع 8–9

- [ ] `[P0]` نموذج متعدد الخطوات للهوية والمؤهلات والتخصص والمؤسسة والروابط.
- [ ] `[P0]` رفع ملفات مع progress/type/size/error states.
- [ ] `[P0]` صفحة مراجعة قبل الإرسال وموافقة الخصوصية.
- [ ] `[P0]` status timeline: draft/pending/needs-info/approved/rejected.
- [ ] `[P0]` Admin queue وقائمة فلاتر.
- [ ] `[P0]` شاشة الطلب مع الأدلة وقرار مسبب.
- [ ] `[P0]` audit timeline وطلب استكمال.
- [ ] `[P0]` إخفاء الوثائق الحساسة عن غير المخولين.
- [ ] `[P0]` اختبارات الصلاحيات والقرارات المتزامنة.

**قبول:** كل قرار له صاحب ووقت وسبب، ولا تظهر الشارة قبل تأكيد الخادم.

## 9. Moderation + Notifications — أسبوع 9

- [ ] `[P0]` Notifications center: unread/read/grouping/preferences.
- [ ] `[P0]` Report reasons: تضليل، كراهية، تطرف، انتحال، مضايقة، spam.
- [ ] `[P0]` Moderation queue وفلاتر وأولوية.
- [ ] `[P0]` شاشة البلاغ والسياق والتاريخ والقرار المسبب.
- [ ] `[P0]` suspend/restore UI مع confirmation وحالات conflict.
- [ ] `[P0]` taxonomy management للموضوعات والتخصصات.
- [ ] `[P0]` audit log viewer.

**قبول:** يمكن للمشرف تتبع البلاغ حتى قرار قابل للمراجعة، ولا يعتمد أي status على اللون وحده.

## 10. Hardening والإطلاق التجريبي — أسبوع 10

- [ ] `[P0]` ربط API حقيقي وفق OpenAPI contracts وإزالة الاختلافات مع mocks.
- [ ] `[P0]` Security review وCSP وupload/privacy checks.
- [ ] `[P0]` Accessibility audit وإصلاح مشاكل keyboard/screen reader/contrast.
- [ ] `[P0]` RTL visual audit لكل شاشة وlong-content tests.
- [ ] `[P0]` Performance profiling وتحقيق ميزانية Web Vitals.
- [ ] `[P0]` Cross-browser/device matrix.
- [ ] `[P0]` Analytics QA مع منع PII.
- [ ] `[P0]` Error monitoring وrunbook للأعطال.
- [ ] `[P0]` Seed content ومراجعة تحريرية وشرعية.
- [ ] `[P0]` Beta مغلقة، feedback loop، وقرار Go/No-Go.

**قبول:** صفر أخطاء P0/P1 مفتوحة، الرحلات الحرجة تمر، وخطة rollback ودعم المستخدم جاهزة.

## 11. بعد الـMVP

- [ ] `[P1]` Research/PDF reader وإدارة المراجع.
- [ ] `[P1]` Institution pages وفرق العلماء.
- [ ] `[P1]` Push/email notifications.
- [ ] `[P1]` Scholar analytics وcontent management متقدم.
- [ ] `[P1]` بحث دلالي يعيد محتوى العلماء دون توليد فتوى.
- [ ] `[P1]` تعدد اللغات.
- [ ] `[P2]` Events/courses/premium بعد تحقق نموذج الثقة والاستخدام.

## Definition of Done لكل Task

- التصميم معتمد لكل المقاسات والحالات المطلوبة.
- TypeScript بلا أخطاء ولا `any` غير مبرر.
- Keyboard وscreen reader وRTL تم اختبارها.
- حالات loading/empty/error/permission موجودة.
- Unit/component tests مناسبة، وE2E إن كانت رحلة حرجة.
- Analytics وerror handling لا يحتويان بيانات حساسة.
- Story/توثيق المكوّن محدث.
- Preview راجعه مصمم ومطور وصاحب منتج.
