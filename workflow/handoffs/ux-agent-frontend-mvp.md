# Handoff: ux-agent / frontend-mvp

- Status: `review`
- Base ref: `b87d21c575ce68c84b965989c8e067204c391d26`
- Result ref: `working-tree marker`
- Tasks completed: `UX-001, UX-002, UX-003, UX-004, UX-005`

## Delivered outputs

| Path | Purpose |
|---|---|
| `docs/ux/README.md` | خريطة الحزمة وقواعد المعرفات والتنفيذ |
| `docs/ux/information-architecture.md` | sitemap عربي، تنقل الأدوار، deep links والوصول |
| `docs/ux/task-flows.md` | 11 رحلة حرجة بنقاط القرار والفشل واسترداد المسودة |
| `docs/ux/wireframes.md` | مواصفات low-fidelity لكل شاشات P0 عبر الهاتف واللوحي والمكتب |
| `docs/ux/states-and-microcopy.md` | حالات التحميل/الفراغ/الخطأ/offline والصلاحية والخصوصية وجرد النصوص |
| `docs/ux/usability-test-plan.md` | عينة وسيناريوهات ومقاييس وبوابة قبول قابلة للتنفيذ |
| `docs/ux/traceability.md` | معايير ذرية وربط كل CAP/US/AC بالشاشة والرحلة والحالة |

## Acceptance evidence

| Criterion | Evidence/command | Result |
|---|---|---|
| Every P0 acceptance criterion maps to a screen, flow, and UI state | `docs/ux/traceability.md`: AC-AUTH-01 through AC-GEN-06 and CAP matrix | pass |
| Arabic-first sitemap and navigation cover user, scholar, and admin surfaces | `information-architecture.md`: SCR-001..045 and role navigation table | pass |
| Responsive wireframe specifications cover mobile, tablet, and desktop | `wireframes.md`: LAY-A/B/C and `<640`, `640–1023`, `≥1024` rules | pass |
| Loading, empty, error, offline, permission, and privacy states are explicit | `states-and-microcopy.md`: STA matrix plus per-screen coverage | pass |
| Usability test plan and Arabic microcopy inventory are implementation-ready | `usability-test-plan.md` UT-01..11; `states-and-microcopy.md` CPY-001..040 | pass |
| Required CAP/state terms exist | PowerShell content assertion across seven `docs/ux` files returned `True` for 21 required terms | pass |
| UX-agent boundary from clean activation ref | deterministic union of `git diff --name-only <base>` + `git ls-files --others --exclude-standard`; all eight paths match ownership | pass |

## Decisions and assumptions

- استُخدمت معرفات ثابتة `SCR/FLW/STA/CPY/AC/UT/PAT/LAY` لتكون مفاتيح Storybook والاختبارات.
- السؤال الخاص يعامل مسارًا محميًا مستقلًا؛ حالة غير المخول لا تؤكد وجود المورد، ولا يظهر النص في URL أو metadata أو الأسطح العامة.
- الشارة تشرح نطاق التحقق وحدوده، وOpinionGroups متساوية بصريًا بلا winner أو أرقام شعبية.
- العمليات الحساسة لا تعرض نجاحًا قبل الخادم؛ session expiry وoffline و409 تحفظ المسودة الآمنة وتطلب مراجعة واعية.
- «بصيرة» اسم تشغيلي؛ لا تتوقف مواصفات UX على اعتماد الاسم النهائي.

## Open risks and deferred work

- يلزم اعتماد شرعي/تحريري لسياسة الخلاف والمصادر، واعتماد قانوني للاحتفاظ والخاص والوثائق قبل الإنتاج.
- قيم SLA والاستئناف غير معتمدة؛ لذلك تستخدم النصوص «سنظهر الخطوة المطلوبة» ولا تعد بزمن.
- نتائج usability مؤجلة حتى وجود prototype؛ الخطة وبوابة القبول جاهزتان، وليست هناك نتائج مختلقة.

## Cross-owner requests

- على مالك workflow/foundation جعل `Test-AgentBoundary.ps1` متوافقًا مع Windows PowerShell 5.1 أو اشتراط PowerShell 7؛ النسخة الحالية تستخدم `ConvertFrom-Json -AsHashtable` غير المدعوم.
- على design-system-agent تنفيذ الأنماط PAT-01..06 والحالات STA بمعنى النصوص المحدد، دون تغيير قرارات IA/الخصوصية.

## Boundary check

- Command: `./workflow/scripts/Test-AgentBoundary.ps1 -AgentId ux-agent -BaseRef b87d21c575ce68c84b965989c8e067204c391d26`
- Result: `official attempt blocked by PowerShell 5.1: A parameter cannot be found that matches parameter name 'AsHashtable'; deterministic manual ownership check PASS — 8/8 paths allowed`

The agent stops after creating this handoff. Only the orchestrator may accept it and activate
the successor.
