# معمارية الـFrontend

## 1. الاختيار المقترح

تطبيق ويب Responsive باستخدام:

- Next.js (App Router) + TypeScript strict.
- React Server Components للقراءة العامة، وClient Components عند الحاجة للتفاعل فقط.
- Tailwind CSS مع Design Tokens عبر CSS variables.
- shadcn/ui أو Radix primitives كأساس سلوكي، مع مظهرنا الخاص بالكامل.
- TanStack Query لحالة الخادم في الأجزاء التفاعلية.
- React Hook Form + Zod للنماذج والتحقق.
- Storybook لتوثيق واختبار المكونات.
- Vitest + Testing Library، وPlaywright للرحلات الحرجة.
- MSW لعزل الواجهة والعمل بـMock APIs حتى يجهز الـBackend.

لا نحتاج Redux في البداية؛ نضيف store عالميًا فقط عند ظهور حالة عميل مشتركة حقيقية.

## 2. شكل النظام

```text
Browser
  └─ Next.js Web App
      ├─ Public/SEO routes (Server-first)
      ├─ Authenticated app routes
      ├─ Scholar workspace
      ├─ Admin workspace (isolated layout/permissions)
      └─ BFF/API client layer
           ├─ Identity & Verification API
           ├─ Content & Q&A API
           ├─ Search API
           ├─ Social graph API
           ├─ Notification API
           └─ Moderation API
```

الـFrontend لا يعتمد على شكل استجابة الخادم مباشرة. طبقة `api/` تحول DTOs إلى domain models وتوحّد الأخطاء والترقيم والتواريخ.

## 3. تنظيم المجلدات

```text
src/
├── app/
│   ├── (marketing)/
│   ├── (auth)/
│   ├── (app)/
│   ├── scholar/
│   └── admin/
├── features/
│   ├── auth/
│   ├── onboarding/
│   ├── feed/
│   ├── content/
│   ├── scholars/
│   ├── topics/
│   ├── questions/
│   ├── search/
│   ├── saved/
│   ├── notifications/
│   ├── verification/
│   └── moderation/
├── components/
│   ├── ui/          # primitives فقط
│   ├── patterns/    # Citation, ScholarIdentity, ContentCard...
│   └── layout/
├── domain/          # types, value objects, permissions
├── lib/             # api, auth, analytics, errors, dates
├── mocks/           # handlers + fixtures
├── styles/          # tokens + globals
└── tests/
```

داخل كل feature: `api`, `components`, `hooks`, `schemas`, `types`, `utils`, و`tests` حسب الحاجة، دون إنشاء ملفات فارغة مسبقًا.

## 4. حدود المسؤولية

- `components/ui`: عناصر عامة لا تعرف شيئًا عن العلماء أو الأسئلة.
- `components/patterns`: تركيبات متكررة مرتبطة بالمنتج.
- `features`: حالات الاستخدام والـqueries والـmutations.
- `domain`: قواعد مستقرة مثل الأدوار وحالات التوثيق وأنواع المحتوى.
- `app`: routing، layouts، metadata، وجمع الـfeatures؛ دون business logic كثيف.

## 5. المسارات

```text
/
/login /register /onboarding
/home /explore /search
/scholars/[slug] /topics/[slug]
/content/[id] /questions/[id] /ask
/saved /notifications /profile /settings
/verification/apply /verification/status
/scholar/dashboard /scholar/questions /scholar/content/new
/admin/verifications /admin/moderation /admin/taxonomy
```

استخدم slugs للصفحات العامة وIDs غير قابلة للتخمين في العمليات الحساسة. الصفحات العامة لها metadata وstructured data وcanonical URLs.

## 6. إدارة البيانات والحالة

- Server fetch للصفحات العامة وبيانات أول تحميل.
- TanStack Query للـinfinite feed، البحث التفاعلي، الإشعارات، والعمليات المتفائلة الآمنة.
- URL هو مصدر حقيقة للفلاتر والتبويبات والـpagination القابلة للمشاركة.
- Local state للتفاعل القصير؛ form state داخل النموذج.
- Cache keys مركزية ومقسمة حسب feature.
- لا optimistic update لقرارات التوثيق أو الإشراف؛ ننتظر تأكيد الخادم.

شكل خطأ موحد: `code`, `message`, `fieldErrors`, `traceId`. لا تعرض رسائل الخادم الخام للمستخدم.

## 7. Auth والصلاحيات

- Session آمنة في HttpOnly/Secure/SameSite cookies.
- Route guards لتحسين التجربة فقط، مع Enforcement فعلي في الـAPI.
- Permission matrix بدل شروط متناثرة مثل `role === admin`.
- Step-up authentication لإجراءات الإدارة الحساسة مستقبلًا.
- واجهة مستقلة لحالات: غير مسجل، غير مصرح، حساب موقوف، توثيق معلق.

## 8. الأداء وSEO

- ميزانية أولية: LCP < 2.5s، INP < 200ms، CLS < 0.1 عند p75.
- Server-render لصفحات المحتوى والعلماء والموضوعات.
- `next/image`، أحجام ثابتة، وصور responsive؛ lazy load تحت الطية.
- Virtualization فقط عندما تثبت الحاجة؛ infinite scroll مع رابط/زر تحميل وإمكانية الرجوع لموضع القراءة.
- تقسيم المحرر ولوحات Admin كحزم منفصلة.
- JSON-LD مناسب للمقالات وBreadcrumbs وProfiles دون ادعاءات مضللة.

## 9. RTL وAccessibility

- `<html lang="ar" dir="rtl">` واستخدام CSS logical properties.
- ترتيب DOM منطقي لا يعتمد على قلب بصري بـCSS.
- خط عربي واضح، line-height مريح، وعرض قراءة 65–75 حرفًا تقريبًا.
- كل الوظائف بالكيبورد، focus ظاهر، targets لا تقل عن 44px على الهاتف.
- Contrast مطابق WCAG AA، و`prefers-reduced-motion` محترم.
- الأرقام والتواريخ والمراجع تمر عبر formatter مركزي يدعم locale.

## 10. الاختبارات والجودة

- Unit: permissions، formatters، schemas، mapping.
- Component: جميع حالات المكونات المهمة عبر Storybook.
- Integration: البحث، السؤال، التوثيق، الحفظ.
- E2E P0: التسجيل، الوصول لإجابة، طرح سؤال، نشر إجابة كعالم، قبول توثيق، مراجعة بلاغ.
- Visual regression للمكونات والشاشات الأساسية في RTL ومقاسات mobile/desktop.
- CI: typecheck + lint + unit + build + E2E smoke + accessibility scan.

## 11. المراقبة والتحليلات

- Error tracking مع source maps وrelease tags.
- Web Vitals حسب الصفحة والجهاز.
- Analytics taxonomy بأسماء أحداث ثابتة، منها:
  `search_submitted`, `search_result_opened`, `trusted_answer_viewed`,
  `answer_marked_helpful`, `question_submitted`, `scholar_followed`,
  `content_saved`, `verification_submitted`.
- عدم إرسال نص الأسئلة الخاصة أو المستندات أو بيانات حساسة إلى analytics/logs.

## 12. قرارات مؤجلة يجب حسمها قبل الـBackend

- مزود الهوية، تخزين الملفات، ومحرك البحث.
- تعريف «إجابة موثقة» ومن يملك اعتمادها أو تحديثها.
- سياسة السؤال الخاص والاحتفاظ بالبيانات.
- نموذج تعدد الآراء وعلاقة التخصص بالمذهب/المنهج.
- workflow الإشراف، الاستئناف، وسحب التوثيق.
