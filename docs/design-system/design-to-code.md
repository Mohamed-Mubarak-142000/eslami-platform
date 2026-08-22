# خريطة التصميم إلى الكود

## الأنماط

| UX | العقد | أهم ضمان |
|---|---|---|
| PAT-01 | `ScholarIdentity` | fallback initials، اسم طويل، specialty وحالة نصية |
| PAT-02 | `TrustMark` | disclosure أصلي keyboard، معنى الشارة وحدودها، active/inactive |
| PAT-03 | `SourceCitation` | المرجع كامل حتى دون URL؛ هامش منطقي يتحول أعلى على الهاتف |
| PAT-04 | `OpinionGroup` | نفس DOM والوزن لكل رأي، بلا winner/count/تصويت صحة |
| PAT-05 | `AsyncAction` | idle/pending/success/error/uncertain، إعلان live وإعادة صريحة |
| PAT-06 | `StatusTimeline` | قائمة مرتبة، status نصي، actor اختياري و`time` دلالي |

`StatePanel` يغطي STA-EMP/ERR/OFF/PER/PRV/CNF، ومن ضمنها `STA-PRV-02`. Skeleton خاص ببنية كل شاشة ولا ينبغي
لـDS اختراع layout المحتوى؛ `Spinner` يغطي LOD-02 وداخل mutations.

## الشاشات والقوالب

| SCR | عقود مطلوبة |
|---|---|
| 010–013 | Button, TextField, StatePanel, PAT-01/02 ومكونات بطاقات feature-owned |
| 014 | PAT-01/02؛ TrustMark قبل المحتوى على الهاتف |
| 015 | PAT-01/02/03؛ `.ds-reading` بعرض 720px |
| 016 | PAT-01..04؛ `.ds-opinion-list` يحافظ على التساوي |
| 020–029 | TextField, Button, PAT-05/06, StatePanel بحسب STA matrix |
| 030–031 | PAT-01/03/05/06؛ لا يكشف pattern نص الخاص في قائمة الصندوق |
| 040–044 | PAT-05/06، StatePanel؛ الجداول/layout ملك Foundation/Feature |
| SCR-045 | StatePanel مع `kind="permission"` ونص غير تشهيري |

## ربط الحالات

| STA family | API/semantics |
|---|---|
| STA-LOD-01 | skeleton screen-specific، heading ثابت، `aria-busy` على المنطقة |
| LOD-02/MUT-01 | `Spinner` أو `AsyncAction(pending)`؛ يمنع التكرار |
| EMP-* | `StatePanel(empty)` مع action اختياري |
| ERR/OFF | `StatePanel(error/offline)` ورسالة + retry persistent |
| FRM | `TextField(error)` + summary feature-owned يركز أول خطأ |
| PER/PRV/SUS | `StatePanel(permission/privacy)`؛ PRV-02 نفس النص والبنية دائمًا |
| CNF/MUT-02 | `StatePanel(conflict)` أو `AsyncAction(uncertain)`؛ لا overwrite/success |
| TRU | `TrustMark`; approved وحدها تعرض «موثّق» |

## Layout وRTL

- LAY-A/B/C تستخدم `.ds-container` بهوامش 16/24/32، وlogical properties فقط.
- breakpoints: `<640`, `640–1023`, `>=1024`; templates نفسها ليست ملك design-system-agent.
- side navigation وrail يبدلان الاتجاه آليًا مع `dir`; لا transform يدويًا للنص.
- الأسهم الاتجاهية وحدها تعكس بصريًا؛ الأيقونات غير الاتجاهية لا تعكس.
- عند 200% zoom لا يفرض pattern ارتفاعًا ثابتًا أو truncation في detail.

## WCAG AA

ألوان النصوص الأساسية/الثانوية والإجراءات اختيرت لتستهدف 4.5:1، وعناصر UI 3:1، لكن
Foundation يجب أن يشغّل contrast/axe على الرسم النهائي لأن font weight والتركيب والخلفية
قد تغير النتيجة. التركيز 2px مع offset، touch target 44px، والأخطاء مرتبطة بـ
`aria-describedby`. لا تعوض القصص الاختبار اليدوي بلوحة المفاتيح وقارئ الشاشة.
