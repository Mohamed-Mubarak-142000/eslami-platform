# PROD-006 — التتبع والقياس

## مصفوفة P0

| Capability | الشاشات/المسارات | القصص | الأدوار | أحداث مسموحة |
|---|---|---|---|---|
| CAP-AUTH | Landing, Login/Register/Reset, Onboarding, Settings | US-AUTH-01..02 | guest/member | auth_result, onboarding_step_completed |
| CAP-FEED | Home tabs | US-FEED-01 | all | feed_viewed, feed_page_loaded |
| CAP-CONTENT | Content details/report | US-CONTENT-01..02 | all/member | content_opened, source_opened, helpful_toggled, report_submitted |
| CAP-SAVE | Saved/Collections | US-SAVE-01 | member | content_saved, collection_changed |
| CAP-EXPLORE | Explore/Topic | US-EXP-01 | all | explore_section_opened, topic_followed |
| CAP-SEARCH | Search overlay/results | US-SEARCH-01 | all | search_submitted, search_results_viewed, zero_results_viewed |
| CAP-PROFILE | Scholar profile | US-PROFILE-01 | all | scholar_profile_opened, scholar_followed |
| CAP-QA | Ask/My Questions/Question/Scholar inbox/editor | US-QA-01..04 | member/scholar/mod | ask_step_completed, question_submitted, answer_opened, answer_submitted |
| CAP-NOTIFY | Notifications/preferences | US-NOTIF-01 | authenticated | notification_opened, notification_read |
| CAP-VERIFY | Apply/status/Admin queue/detail | US-VER-01..02 | applicant/admin | verification_step_completed, verification_submitted, verification_decision |
| CAP-MOD | Report/Moderation queue/detail/audit | US-MOD-01..02 | member/mod/admin | moderation_case_opened, moderation_decision |
| CAP-TAXONOMY | Topic/specialty management | US-TAX-01 | admin | taxonomy_changed |
| CAP-STATES | كل ما سبق | GEN-01 | all | ui_error_shown (code/category only) |

## خصائص الأحداث

مسموح: `entity_type`, opaque `entity_id`, `result`, `status`, `step`, `tab`, `filter_count`,
`result_count_bucket`, `latency_bucket`, `error_code`, `role_bucket`, `visibility`.

ممنوع: query text، title/body، private question ID في أداة خارجية، الاسم/البريد/الهاتف،
اسم الملف/الرابط الموقّع، سبب حر، ملاحظات المراجع، بيانات المصدر الحساسة.

## تعريف مؤشرات النجاح

- North Star: جلسة شهرية بها `answer_opened` لإجابة منشورة موثقة ثم helpful=true.
- Search success: جلسات `search_submitted` التي يتبعها فتح نتيجة خلال 10 دقائق ÷ جلسات البحث.
- Zero-result rate: `zero_results_viewed` ÷ `search_submitted`.
- Answer rate: أسئلة P0 التي وصلت answered ÷ الأسئلة المقبولة، حسب cohort أسبوعي.
- Time to first answer: زمن routed إلى أول Answer منشورة؛ لا يسجل نص السؤال.
- Verification completion: submitted ÷ طلبات بدأت، وزمن pending إلى قرار.
- Moderation reversal: قرارات تغيرت بعد مراجعة ÷ قرارات مغلقة (بعد اعتماد الاستئناف).

## تغطية الحالات والاختبارات المطلوبة لاحقًا

لكل صف في المصفوفة: اختبار happy path، empty، 422، 403، offline/5xx، keyboard/RTL؛
وللموارد الحساسة اختبار 409 واختبار عدم تسريب إلى DOM/URL/metadata/analytics. رحلات E2E
الحرجة: onboarding، search-to-answer، public ask، private ask، scholar answer، verification
decision، moderation decision.

## قرارات UX المطلوبة من التسليم التالي

- تمثيل واضح لمعنى الشارة دون إيحاء بالتصديق على كل محتوى.
- preview للجمهور قبل إرسال سؤال، وحجب كامل للخاص في الأسطح العامة.
- OpinionGroup بلا winner أو عدادات شعبية.
- استرداد مسودة آمن عند session expiry و409 وoffline.
- permission state يشرح الخطوة الممكنة دون كشف وجود مورد خاص لغير المخول.

