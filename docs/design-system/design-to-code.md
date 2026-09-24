# خريطة التصميم إلى الكود — Twister storefront v1 (مصفوفة التغطية)

هذا الملف هو **بوابة القبول** لمرحلة design-system-agent: كل صف في
`docs/ux/component-inventory.md` يجب أن يقابله صف هنا بحالة "مكتمل"، وإلا لا
تُعتبر المرحلة منتهية.

## Primitives

| العنصر (UX inventory) | العقد في الكود | القصة في Storybook | الحالة |
|---|---|---|---|
| Button (كل الأنواع) | `src/components/ui/index.tsx` → `Button` (`primary/secondary/ghost/danger/accent/whatsapp`) | `Twister/Primitives` → `Buttons` | مكتمل |
| IconButton | `social-primitives.tsx` → `IconButton` (بلا تغيير، متوافق مع tokens الجديدة) | `Twister/Primitives` → `IconButtons` | مكتمل |
| Badge | `index.tsx` → `Badge` | `Twister/Primitives` → `Badges` | مكتمل |
| Dialog | `index.tsx` → `Dialog` | `Twister/Overlays` → `DialogExample` | مكتمل |
| Sheet/Drawer | `index.tsx` → `Sheet` | `Twister/Overlays` → `SheetExample` | مكتمل |
| Tabs | `index.tsx` → `Tabs` | `Twister/Navigation` → `StickyTabs` | مكتمل |
| Accordion | `index.tsx` → `Accordion` | `Twister/Navigation` → `FaqAccordion` | مكتمل |
| Carousel | `index.tsx` → `Carousel` | `Twister/Navigation` → `BestsellerCarousel` | مكتمل |
| QuantityStepper | `index.tsx` → `QuantityStepper` | `Twister/Commerce` → `Stepper` | مكتمل |
| PhoneField | `index.tsx` → `PhoneField` (TextField preset) | `Twister/Forms` → `PhoneFieldExample` | مكتمل |
| SearchField | يُغطّى بـ`TextField` الموجود (type="search")؛ لا عقد جديد لازم | `Twister/Forms` → `PhoneFieldExample` (مثال مشترك) | مكتمل — بلا مكوّن جديد بقصد |
| RatingStars | `index.tsx` → `RatingStars` | `Twister/Commerce` → `Rating` | مكتمل |
| CountdownDisplay | `index.tsx` → `CountdownDisplay` | `Twister/Commerce` → `Countdown` | مكتمل (عرض فقط؛ العدّاد الفعلي عند foundation/feature-ui) |
| Skeleton | `social-primitives.tsx` → `Skeleton` (بلا تغيير) | `Twister/Primitives` → موجودة أصلًا في `Design System/Contracts` | مكتمل |
| Toast/live region | `index.tsx` → `ToastRegion` | `Twister/Feedback` → `Toasts` | مكتمل |
| StatePanel | `patterns/index.tsx` → `StatePanel` (موجود، متوافق) | `Design System/Contracts` → `SharedState` | مكتمل (بلا تغيير كود) |

## Patterns

| العنصر (UX inventory PAT-*) | العقد | القصة | الحالة |
|---|---|---|---|
| PAT-01 ProductCard | `patterns/index.tsx` → `ProductCard` | `Twister/Commerce` → `ProductCardStates` | مكتمل |
| PAT-02 CategoryChip/Slider | `patterns/index.tsx` → `CategoryChip` | `Twister/Commerce` → `CategoryChips` | مكتمل |
| PAT-03 OfferBanner | `patterns/index.tsx` → `OfferBanner` | `Twister/Commerce` → `OfferBannerExample` | مكتمل |
| PAT-04 TestimonialCard | `patterns/index.tsx` → `TestimonialCard` | `Twister/Commerce` → `Testimonials` | مكتمل |
| PAT-05 ZoneCard | `patterns/index.tsx` → `ZoneCard` | `Twister/Commerce` → `ZoneCards` | مكتمل |
| PAT-06 CartLineItem | **غير مبني في هذه المرحلة** — تركيبة feature-local تعتمد على domain الخاص بالسلة (`src/domain/twister`) الذي لم يُبنَ بعد | — | مؤجل إلى `feature-ui-agent`، ليس فجوة تصميم (السلة تحتاج بيانات domain حقيقية، لا mock تصميم فقط) |
| SectionHeading | `patterns/index.tsx` → `SectionHeading` | `Twister/Layout` → `SectionHeadingExample` | مكتمل |
| CtaSection | `patterns/index.tsx` → `CtaSection` | `Twister/Layout` → `CtaSectionExample` | مكتمل |
| StatCounter | `patterns/index.tsx` → `StatCounter` (عرض فقط، بلا تحريك) | `Twister/Layout` → `StatCounters` | مكتمل |
| FaqList | `patterns/index.tsx` → `FaqList` (يغلّف `Accordion`) | `Twister/Layout` → `FaqAccordion` (مشتركة) | مكتمل |
| Admin DataTable | `patterns/index.tsx` → `AdminDataTable<T>` | `Twister/Admin` → `DataTableExample` | مكتمل |
| Admin FormLayout | `patterns/index.tsx` → `AdminFormLayout` | `Twister/Admin` → `FormLayoutExample` | مكتمل |
| Admin StatTile | `patterns/index.tsx` → `AdminStatTile` | `Twister/Admin` → `StatTiles` | مكتمل |
| Admin local-data notice | `patterns/index.tsx` → `AdminLocalDataNotice` | `Twister/Admin` → `LocalDataNotice` | مكتمل (SCR-021 يعرضه دائمًا، غير قابل للإغلاق) |

## ملاحظة انتقالية

المكونات القديمة (`ScholarIdentity`, `TrustMark`, `SourceCitation`,
`OpinionGroup`, `AuthShell`, `ComposerCard`, `SocialContentCard`,
`TopicHighlights`) **تبقى في الكود بلا حذف في هذه المرحلة** — تُحذف في الجولة
العكسية (reverse sweep) بعد قبول qa-agent، وفق خطة التنفيذ المعتمدة. القيم
البصرية القديمة (أخضر/ذهبي هادئ) لم تعد موجودة لأن `tokens.css` أصبح ملفًا
واحدًا (dark-only)، لذا هذه المكونات ستظهر الآن بألوان Twister تلقائيًا حتى
حذفها — وهذا سلوك متوقع ومقصود (tokens موحّدة، لا نظامي ثيم متوازيين).
