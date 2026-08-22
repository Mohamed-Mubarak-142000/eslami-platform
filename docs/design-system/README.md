# نظام التصميم التنفيذي — Frontend MVP

هذه الحزمة هي عقد التنفيذ المشتق من UX المقبول. المرجع المفاهيمي السابق يبقى
`docs/DESIGN_SYSTEM.md`، بينما الملفات هنا تحسم الأسماء والسلوك الذي يستهلكه Foundation
وFeature UI.

## المخرجات

- `src/styles/tokens.css`: مصدر CSS الدلالي للثيمات.
- `src/styles/tokens.ts`: أسماء typed للوصول إلى المتغيرات، وليس نسخة قيم ثانية.
- `src/styles/foundations.css`: RTL، الحاويات، القراءة، التركيز والأساس العام.
- `src/components/ui`: primitives قليلة ومستقلة عن مكتبة خارجية.
- `src/components/patterns`: PAT-01..06 وStatePanel المشترك.
- `stories/design-system`: قصص مصدرية ومصفوفة visual regression جاهزة للربط.
- `design-to-code.md`: تتبع SCR/STA/PAT إلى العقود.

## قرارات ملزمة

1. يضبط الجذر `dir="rtl" lang="ar"`، وتستخدم القطع الحرة `dir="auto"` فقط.
2. `data-theme="dark"` يغير semantic tokens؛ لا تستخدم features قيمة لون مباشرة.
3. حالة الثقة أو القرار لها نص/أيقونة ومعنى DOM، ولا تعتمد على اللون.
4. لا تعرض `success` في PAT-05 قبل تأكيد الخادم؛ `uncertain` تبقى ظاهرة مع فعل تحقق.
5. كل target تفاعلي 44px على الأقل، والتركيز المرئي لا يزال واضحًا في forced colors.
6. الحركة وظيفية 120–220ms وتتعطل عمليًا عند `prefers-reduced-motion`.

## افتراضات Foundation

- React مع JSX runtime حديث؛ لا تفترض المكونات Next.js أو router أو state library.
- على Foundation استيراد CSS بالترتيب: `tokens.css` ثم `foundations.css`؛ CSS المكون يستورد
  من ملفه الحالي.
- الخطوط تحمل محليًا أو عبر آلية المشروع مع fallback؛ لا network import داخل CSS.
- Storybook يضيف globals للثيم والاتجاه وviewports دون تعديل story contracts.
- `color-mix()` تحسين للـfocus shadow؛ outline الصريح هو fallback الملزم.

## بوابة إضافة مكون

API صغيرة typed، label accessible، keyboard path، حالات disabled/loading/error، RTL وlong
content، light/dark، reduced motion، وقصة 360/768/1280. business permissions وfetching لا
يدخلان نظام التصميم.
