# UX-003 — مواصفات Wireframes منخفضة الدقة

## قواعد القوالب والاستجابة

- `LAY-A Public`: header (علامة، بحث، دخول/إشعارات) + main مقروء + footer.
- `LAY-B App`: desktop side nav 248 + main حتى 720 + rail حتى 320؛ tablet main + drawers؛
  mobile main واحد + bottom nav ثابت مع safe-area.
- `LAY-C Admin`: desktop side nav 240 + toolbar + table/detail؛ tablet cards أو table scroll
  مع عمود أول ثابت؛ mobile filter sheet وقائمة cards ثم detail كامل.
- الحاوية: 16px هاتف، 24px لوحي، 32px سطح مكتب. لا horizontal scroll إلا جدول معلّم.
- الأزرار الأساسية sticky أسفل wizard في الهاتف، inline في نهاية النموذج على الأكبر.

## الشاشات العامة والاستهلاكية

| ID | القالب | ترتيب المناطق من أعلى لأسفل | السلوك الضيق/الواسع |
|---|---|---|---|
| SCR-001 | LAY-A | value proposition؛ مثال معرفة بمصدر؛ كيف تعمل الثقة؛ CTA استكشف/أنشئ حسابًا | هاتف بلا hero مزدوج؛ desktop نص + نموذج بطاقة |
| SCR-002 | LAY-A | عنوان دخول؛ بريد؛ كلمة مرور؛ نسيت؛ submit؛ رابط تسجيل | بطاقة 100% هاتف، max 440 أكبر؛ رسائل قرب الحقول |
| SCR-003 | LAY-A | اسم عرض؛ بريد؛ كلمة مرور؛ موافقة؛ submit؛ دخول | نفس SCR-002؛ لا حفظ لكلمة المرور |
| SCR-004 | LAY-A | بريد؛ submit؛ تأكيد عام لا يكشف وجود الحساب | شاشة نجاح داخل نفس البطاقة |
| SCR-005 | LAY-A | progress؛ عنوان خطوة؛ الحقول/اختيارات؛ رجوع/التالي | chips تلتف؛ desktop max 680؛ CTA sticky هاتف |
| SCR-010 | LAY-B | عنوان؛ tabs لك/تتابعهم/الأحدث؛ قائمة ContentCard؛ load more sentinel | rail: موضوعات/علماء؛ الهاتف skeleton بطول ثابت |
| SCR-011 | LAY-B | بحث؛ أقسام موضوعات؛ علماء؛ أسئلة عامة؛ حديث | carousel ممنوع للمعنى الضروري؛ grids 1/2/3 أعمدة |
| SCR-012 | LAY-B | search input؛ chips الفلاتر؛ tabs + دلالة count؛ نتائج؛ pagination | filters Sheet هاتف، inline/rail desktop؛ URL يطابق الحالة |
| SCR-013 | LAY-B | اسم/وصف موضوع؛ follow؛ tabs محتوى/أسئلة/علماء | hero مختصر؛ rail موضوعات مرتبطة |
| SCR-014 | LAY-B | ScholarIdentity؛ TrustMark قابل للشرح؛ bio؛ مؤهلات/تخصصات؛ updated؛ follow؛ tabs المحتوى | desktop identity + trust card؛ هاتف trust accordion قبل المحتوى |
| SCR-015 | LAY-B | breadcrumb؛ type/title؛ ScholarIdentity؛ dates؛ body؛ SourceCitation؛ actions؛ report | عرض قراءة ≤720؛ source margin يتحول block هاتف |
| SCR-016 | LAY-B | سؤال/خصوصية الاسم؛ metadata؛ AnswerPanels؛ OpinionGroups؛ sources/actions | كل OpinionGroup بنفس الوزن؛ لا counts أو winner؛ rail سؤال مشابه عام فقط |

## شاشات العضو

| ID | القالب | ترتيب المناطق | ملاحظات تنفيذية |
|---|---|---|---|
| SCR-020 | LAY-B | progress؛ حقل الخطوة؛ مشابهات بعد العنوان؛ رجوع/التالي؛ مؤشر حفظ | 6 خطوات: عنوان، تفاصيل، تصنيف، خصوصية، هوية، مراجعة |
| SCR-021 | LAY-B | بطاقة «من سيرى؟»؛ preview السؤال؛ تحذير بيانات شخصية؛ consent؛ تعديل/إرسال | العام والخاص variants منفصلان؛ لا معاينة URL للخاص |
| SCR-022 | LAY-B | filters الحالة؛ قائمة status/timestamp/next action | السبب العام فقط؛ لا نص خاص في cards إذا setting يخفيه |
| SCR-023 | LAY-B | label «سؤال خاص» إن لزم؛ status timeline؛ body للمالك؛ إجابات؛ next action | no share/related للخاص؛ cache/metadata محجوبان |
| SCR-024 | LAY-B | قائمة مجموعات؛ المجموعة النشطة؛ items؛ إنشاء/تسمية/حذف | mobile groups Sheet؛ تأكيد حذف واضح |
| SCR-025 | LAY-B | heading + unread count؛ tabs؛ mark all؛ مجموعات زمنية؛ preferences link | لا preview حساس؛ status icon + text |
| SCR-026 | LAY-B | section nav؛ الحساب؛ الخصوصية؛ اهتمامات؛ إشعارات؛ حذف/تصدير | destructive في قسم منفصل مع شرح أثر غير محسوم قانونيًا |
| SCR-027 | modal/sheet | target عام مختصر؛ reasons radio؛ other textarea؛ submit | لا تعرض body حساس؛ sheet هاتف/dialog أكبر |
| SCR-028 | LAY-B | progress؛ fields؛ uploader rows؛ consent؛ review | 6 خطوات؛ uploads تعرض progress/cancel/retry داخل الطلب فقط |
| SCR-029 | LAY-B | status summary؛ timeline؛ next action؛ fields المطلوبة عند needs_info | لا internal notes؛ approved يشرح معنى الشارة |
| SCR-045 | LAY-A | حالة الحساب؛ سبب عام؛ تاريخ؛ ما يزال متاحًا؛ مسار مراجعة | لا nav إنشائي؛ قراءة عامة ممكنة حسب السياسة |

## سطح العالم والإدارة

| ID | القالب | ترتيب المناطق | ملاحظات تنفيذية |
|---|---|---|---|
| SCR-030 | LAY-C | heading؛ filters status/specialty؛ assigned list؛ privacy labels | السؤال الخاص يعرض مقتطفًا منقحًا أو عنوانًا عامًا فقط |
| SCR-031 | LAY-C | minimal question context؛ permission/specialty؛ editor؛ structured sources؛ preview؛ submit | autosave محلي آمن؛ source ≥1؛ lost-permission recovery |
| SCR-040 | LAY-C | queue metrics بلا تنافس؛ filters؛ assigned cases table/cards | أعمدة: حالة، أولوية، نوع، عمر، مكلف؛ بلا هوية مبلغ |
| SCR-041 | LAY-C | version/status؛ target context؛ report reason؛ timeline؛ decision form | reason required؛ actions الحساسة confirmation بنطاق |
| SCR-042 | LAY-C | filters؛ requests table/cards؛ assignment | أعمدة غير حساسة فقط؛ الأدلة في detail |
| SCR-043 | LAY-C | version/status؛ applicant data؛ evidence viewer؛ timeline؛ decision form | viewer لا يكشف signed URL؛ reason + confirmation |
| SCR-044 | LAY-C | tabs topics/specialties؛ search؛ create؛ rows name/status/usage؛ edit | moderator view-only؛ replacement قبل تعطيل مستخدم |

## أنماط داخل الشاشة

- `PAT-01 ScholarIdentity`: اسم، تخصص، حالة نصية؛ فتح الشرح دون مغادرة سياق القراءة.
- `PAT-02 TrustMark`: «موثّق» + «ما معنى ذلك؟»؛ overlay: الهوية والمسار والتخصص وتاريخ التحقق،
  مع «لا تعني موافقة المنصة على كل رأي».
- `PAT-03 SourceCitation`: رقم، نوع، عنوان، مؤلف/جهة، locator، رابط اختياري. غياب الرابط
  لا يزيل المرجع.
- `PAT-04 OpinionGroup`: label محايد، summary، حدود التطبيق، الإجابات/الأدلة، آخر مراجعة؛
  ترتيب ثابت ومتساوٍ.
- `PAT-05 AsyncAction`: label → spinner + تعطيل → نجاح مؤكد أو rollback + سبب وإعادة.
- `PAT-06 StatusTimeline`: الحالة + نص + actor عام عند الملاءمة + timestamp؛ لا لون منفرد.

## كثافة المحتوى والطول

- العنوان يلتف حتى 3 أسطر في card ثم يختصر مع اسم كامل accessible؛ في detail بلا truncation.
- أسماء عربية طويلة ومحتوى عربي/إنجليزي يستخدم `dir=auto` للقطع الحرة دون قلب shell.
- صورة مفقودة → أحرف أولى؛ مؤسسة غير متحقق منها تظهر «مذكورة في الملف» لا كعلامة ثقة.
- الجداول تتحول cards عند فقد قابلية القراءة؛ الإجراءات لا تختفي داخل horizontal overflow.

