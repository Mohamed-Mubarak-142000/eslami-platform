# UX-INV-01 — مخزون المكونات (عقد التسليم لـdesign-system-agent)

هذا الجدول هو ما يجب أن تُغطّيه مصفوفة design-system-agent بالكامل قبل أن
يقبل orchestrator تلك المرحلة. أي عنصر هنا بلا تطابق في مصفوفة التغطية يعني
مرحلة design-system لم تكتمل، لا أن feature-ui-agent يبنيه بنفسه لاحقًا.

## Primitives (`src/components/ui`)

| العنصر | الحالات المطلوبة |
|---|---|
| Button | primary(أحمر)، accent(ذهبي بنص غامق)، ghost، whatsapp(أخضر)، disabled، loading |
| IconButton | default، active، disabled |
| Badge | bestseller، غير متاح، تقييم/بيانات توضيحية، هدية |
| Dialog | مع/بدون عنوان، مع footer أزرار |
| Sheet/Drawer | يفتح من الاتجاه الختامي (RTL)، ارتفاع كامل على الموبايل |
| Tabs | roving tabindex، sticky، scrollable أفقيًا |
| Accordion | فتح فردي/متعدد |
| Carousel | scroll-snap بلا مكتبة خارجية، أسهم + سحب باللمس |
| QuantityStepper | حد أدنى 1، حد أقصى قابل للضبط |
| PhoneField | صيغة هاتف مصري، رسالة خطأ تنسيق |
| SearchField | أيقونة، مسح سريع |
| RatingStars | عرض فقط + قابل للإدخال (لو احتاجه الأدمن مستقبلًا) |
| CountdownDisplay | تنسيق `DD:HH:MM:SS` أو ما يناسب المساحة |
| Skeleton | لأشكال البطاقة/الجدول/الصورة |
| Toast/Live region | نجاح/خطأ/معلومة |
| StatePanel | يغلّف كل STA-* من `states-and-microcopy.md` بشكل موحّد |

## Patterns (`src/components/patterns`)

| العنصر | يُستخدم في | الحالات |
|---|---|---|
| ProductCard | SCR-001, SCR-002 | عادي، الأكثر طلبًا، غير متاح |
| CategoryChip/Slider | SCR-001, SCR-002 | نشط/غير نشط |
| OfferBanner | SCR-001, SCR-007 | نشط (بعداد)، قريبًا |
| TestimonialCard | SCR-008 | حقيقي، توضيحي (شارة) |
| ZoneCard | SCR-001 (مناطق)، SCR-005 | مخدومة، غير مخدومة |
| CartLineItem | SCR-004 | عادي، هدية (غير قابل للحذف اليدوي) |
| SectionHeading | كل أقسام الرئيسية | مع/بدون زخرفة sparkle |
| CtaSection | SCR-001 | — |
| StatCounter | SCR-001 (لماذا نحن)، SCR-008 | متحرك عند الظهور |
| FaqList | SCR-001 | — |
| Admin: DataTable | SCR-022..028 | فارغ، مع بيانات، تحميل |
| Admin: FormLayout | SCR-022..027 | إنشاء، تعديل، خطأ حقل |
| Admin: StatTile | SCR-021 | — |

## Feature-local composites (يبنيها `feature-ui-agent` مباشرة، ليست primitives/patterns)

CartDrawer الكامل، QuickPreview الكامل، نموذج Checkout الكامل، Hero Timeline،
لوحة أدمن كاملة لكل مورد. هذه تُركّب من الـPrimitives/Patterns أعلاه ولا تحتاج
عقد design-system مستقل، لكنها تحتاج كل العناصر أعلاه **جاهزة أولًا**.
