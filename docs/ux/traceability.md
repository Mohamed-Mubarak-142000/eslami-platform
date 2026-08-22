# بوابة تتبع P0

## تعريف معايير القبول الذرية

المعرفات التالية تفكك كل bullet مقبول في `p0-requirements.md` دون تغيير معناه.

| القصة | معايير القبول UX |
|---|---|
| US-AUTH-01 | AC-AUTH-01 نجاح الخادم والعودة؛ 02 أخطاء بلا كشف وحفظ غير الحساس؛ 03 انتهاء session وإعادة واعية |
| US-AUTH-02 | AC-AUTH-04 موضوع واحد وتخطي العلماء؛ 05 استئناف/رجوع؛ 06 Feed لك ولا منع عند غياب الاقتراحات |
| US-FEED-01 | AC-FEED-01 التبويبات والفراغ؛ 02 pagination/الموضع؛ 03 guest/cached offline |
| US-CONTENT-01 | AC-CNT-01 النوع/المؤلف/الثقة/المصادر/التواريخ؛ 02 مصدر بلا رابط؛ 03 hidden/removed |
| US-CONTENT-02 | AC-CNT-04 الأفعال/منع التكرار/rollback؛ 05 share العام فقط؛ 06 helpful ليس صحة/ترتيبًا |
| US-SAVE-01 | AC-SAV-01 افتراضية أو اختيار وقيود الاسم؛ 02 نقل/إزالة وحذف المجموعة؛ 03 مورد ممنوع/محذوف |
| US-EXP-01 | AC-EXP-01 الأقسام الأربعة؛ 02 حجب الخاص وغير المنشور؛ 03 القسم الفارغ |
| US-SEARCH-01 | AC-SRC-01 query/filters في URL؛ 02 أنواع منفصلة ودلالة count؛ 03 zero/Ask بلا إرسال؛ 04 recent محلي بلا private |
| US-PROFILE-01 | AC-PRO-01 بيانات الملف/الشارة/الشرح/التحديث؛ 02 حالات الشارة؛ 03 المؤسسة/follow |
| US-QA-01 | AC-QA-01 حقول wizard وحدودها؛ 02 مشابهات ومسودة؛ 03 preview والخاص؛ 04 idempotency وفشل مع مسودة |
| US-QA-02 | AC-QA-05 الحالات/الوقت/السبب؛ 06 notification ومورد غير متاح |
| US-QA-03 | AC-QA-07 إجابات عامة وإخفاء الربط؛ 08 حجب الخاص؛ 09 OpinionGroups محايدة |
| US-QA-04 | AC-QA-10 موثق/مكلف/تخصص/مصدر؛ 11 403 بلا نجاح؛ 12 تعليق التوثيق ومسودة آمنة |
| US-NOTIF-01 | AC-NOT-01 unread/read/actions/preferences؛ 02 بلا preview حساس؛ 03 rollback وعداد accessible |
| US-VER-01 | AC-VER-01 الخطوات والمسودة؛ 02 upload؛ 03 اكتمال/idempotency/قفل pending |
| US-VER-02 | AC-VER-04 timeline وسبب مهني؛ 05 admin/سبب/audit؛ 06 409 والشارة من الخادم |
| US-MOD-01 | AC-MOD-01 الأسباب وother؛ 02 لا duplicate/لا تفاصيل عقوبة |
| US-MOD-02 | AC-MOD-03 queue/سياق/سبب؛ 04 confirmation/restore/audit؛ 05 409 ومسودة السبب |
| US-TAX-01 | AC-TAX-01 فريد/active/بديل؛ 02 moderator read-only وسجل نصي |
| GEN-01 | AC-GEN-01 loading/success/empty/error/offline؛ 02 forbidden/conflict؛ 03 RTL/keyboard/focus/لا لون؛ 04 لا PII أو نص حر؛ 05 pending و401/403/409/422/5xx؛ 06 لا تسريب private DOM/URL/metadata/analytics |

## مصفوفة CAP → US → شاشة → رحلة → حالة

| CAP | US / AC | SCR | FLW | STA/PAT الحاسمة |
|---|---|---|---|---|
| CAP-AUTH | AUTH-01..02 / AC-AUTH-01..06 | 001..005,026 | 01 | AUT-01/02, FRM-01, OFF-02, DRF-01 |
| CAP-FEED | FEED-01 / AC-FEED-01..03 | 010 | 05 | LOD-02, EMP-03, OFF-02 |
| CAP-CONTENT | CONTENT-01..02 / AC-CNT-01..06 | 015,016,027 | 02,05 | EMP-06, PER-01, PAT-01/02/03/05 |
| CAP-SAVE | SAVE-01 / AC-SAV-01..03 | 024 | 05 | EMP-05, MUT-01/02 |
| CAP-EXPLORE | EXP-01 / AC-EXP-01..03 | 011,013 | 02 | EMP-01؛ قاعدة حجب الخاص |
| CAP-SEARCH | SEARCH-01 / AC-SRC-01..04 | 012 | 02 | EMP-02, OFF-02؛ لا private query/recent |
| CAP-PROFILE | PROFILE-01 / AC-PRO-01..03 | 014 | 05 | TRU-01/02, PAT-01/02 |
| CAP-QA | QA-01..04 / AC-QA-01..12 | 016,020..023,030,031 | 03,04,06 | PRV-01..04, PER-03/04, CNF-01, MUT-02, PAT-04 |
| CAP-NOTIFY | NOTIF-01 / AC-NOT-01..03 | 025 | 10 | EMP-06, PRV-05, PAT-05 |
| CAP-VERIFY | VER-01..02 / AC-VER-01..06 | 028,029,042,043 | 07,08 | PRV-05, CNF-02, MUT-02, PAT-06 |
| CAP-MOD | MOD-01..02 / AC-MOD-01..05 | 027,040,041 | 05,09 | CNF-02, MUT-02, PAT-06 |
| CAP-TAXONOMY | TAX-01 / AC-TAX-01..02 | 044 | 11 | PER-05, CNF-02 |
| CAP-STATES | GEN-01 / AC-GEN-01..06 | 001..045 | 01..11 | كل STA؛ جدول تغطية الشاشات |

## تحقق المعايير العابرة

| معيار المنتج | دليل UX |
|---|---|
| السؤال الخاص لا يظهر علنًا ولا يتسرب | FLW-04، SCR-023، STA-PRV-02..05، AC-GEN-06 |
| الشارة لا تعني تصديق كل رأي | PAT-02، STA-TRU-01، CPY-023/029، UT-01/07 |
| الخلاف بلا winner أو شعبية | SCR-016، PAT-04، CPY-030، UT-05 |
| استرداد المسودة عند session/409/offline | FLW-03/04/06/08/09، AUT-02، CNF-01/02، OFF-02 |
| permission لا يكشف موردًا خاصًا | قاعدة deep link، STA-PRV-02، SCR-023 |
| كل mutation حساس يعالج الحالات | PAT-05، MUT-01/02، جداول الحالات، AC-GEN-05 |

بهذا يكون لكل CAP وقصة ومعيار قبول مكان عرض، رحلة تشغيل، وحالة فشل قابلة للتحويل إلى
اختبار. تفاصيل الحدود الرقمية للحقول موجودة في `FLW-03/04` و`SCR-020` وتظل القيم
المقبولة في `p0-requirements.md` مصدر الحقيقة.
