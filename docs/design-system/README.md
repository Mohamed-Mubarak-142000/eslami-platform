# نظام التصميم التنفيذي — Twister Crepes & Pizza (`twister-storefront-v1`)

هذه الحزمة عقد التنفيذ المشتق من UX المقبول (`docs/ux/`). المرجع التاريخي
للتوجه البصري السابق ("المنارة") محفوظ في تاريخ Git فقط (وسم `almanara-final`).

## المخرجات

- `src/styles/tokens.css`: مصدر CSS الدلالي الوحيد — dark-luxury (أحمر/ذهبي/أسود)، **بلا وضع فاتح** في هذا المعلم.
- `src/styles/tokens.ts`: أسماء typed للوصول إلى المتغيرات.
- `src/styles/foundations.css`: RTL، الحاويات، التركيز، وأدوات الزخرفة السينمائية (`ds-glow-*`, `ds-sparkle`).
- `src/components/ui`: primitives (Button بأنواعه، Tabs، Accordion، Dialog/Sheet، QuantityStepper، RatingStars، CountdownDisplay، Carousel، Toast، PhoneField) بلا مكتبة خارجية (لا shadcn/radix).
- `src/components/patterns`: PAT-01..07 (ProductCard, CategoryChip, OfferBanner, TestimonialCard, ZoneCard, SectionHeading, CtaSection, StatCounter, FaqList) + أنماط الإدارة (DataTable, FormLayout, StatTile, LocalDataNotice).
- `stories/design-system/twister.stories.tsx`: قصص Storybook لكل عنصر جديد.
- [token-reference.md](token-reference.md): مرجع الـtokens وقيود التباين.
- [design-to-code.md](design-to-code.md): **مصفوفة التغطية** — تتبع `docs/ux/component-inventory.md` إلى العقد/القصص.

## قرارات ملزمة

1. الجذر `dir="rtl" lang="ar"`؛ القطع الحرة (أسماء منتجات مثلًا) تستخدم `dir="auto"`.
2. **ثيم واحد فقط** (dark) — لا `data-theme` توگل، لا `next-themes`؛ `ThemeToggle` القديم يُزال في مرحلة foundation-agent.
3. أي سطح خلفيته `--ds-color-accent` الصلب (ذهبي) يستخدم `--ds-color-on-accent-solid` للنص، لا أبيض — انظر قيود التباين في `token-reference.md`.
4. لا PAT جديد يخترع بيانات domain (السلة/الطلب) — الأنماط هنا presentational بحتة، تستهلك بيانات يمررها feature-ui-agent من `src/domain/twister` (لم يُبن بعد؛ لذلك `CartLineItem` مؤجل، انظر `design-to-code.md`).
5. الحركة وظيفية 120–220ms وتتعطل عمليًا عند `prefers-reduced-motion` (نفس آلية tokens السابقة، محفوظة).
6. كل target تفاعلي 44px على الأقل؛ Dialog/Sheet لهما focus trap كامل و`Escape` يُغلق.
7. المكونات القديمة (الاجتماعية/الثقة العلمية) **لا تُحذف في هذه المرحلة** — الحذف يحدث في الجولة العكسية بعد قبول qa-agent.

## بوابة إضافة مكون

API صغيرة typed، label accessible، مسار لوحة مفاتيح، حالات disabled/loading/
error، RTL ونص عربي طويل، dark فقط، reduced motion، وقصة Storybook واحدة على
الأقل. لا صلاحيات أو fetching داخل نظام التصميم — هذه مسؤولية feature-ui/foundation.
