# PROD-005 — قاموس ونموذج المجال

## المصطلحات

| المصطلح | التعريف |
|---|---|
| Account | هوية دخول وحالة تشغيل وأدوار؛ ليست ملف عالم بذاتها |
| ScholarProfile | ملف علمي عام مرتبط بحساب وتخصصات وأدلة عرض عامة |
| VerificationApplication | طلب حساس مستقل، أدلته غير عامة |
| TrustMark | عرض مشتق من توثيق approved فعّال؛ ليس قيمة يحررها العميل |
| Topic | موضوع تصنيفي عام قابل للمتابعة |
| Specialty | نطاق علمي معتمد يحد صلاحية الإجابة والتوجيه |
| Content | أصل معرفي عام: post أو article؛ Answer كيان متخصص مرتبط بسؤال |
| Source | مرجع منظم: نوع، عنوان، مؤلف/جهة، locator، URL اختياري |
| Question | طلب معرفة بخصوصية وحالة وتخصص وتوجيه |
| Answer | إجابة من عالم موثق، بمصادر وحالة مراجعة |
| OpinionGroup | تجميع محايد لإجابات/آراء في خلاف معتبر، وليس تصويتًا |
| Collection | مجموعة خاصة يملكها عضو لحفظ موارد عامة متاحة له |
| Report/Case | بلاغ وحالة مراجعة؛ البلاغ لا يساوي إدانة |
| AuditEvent | سجل append-only لفعل حساس مع الفاعل والسبب والوقت والإصدار |

## كيانات وحقول مطلوبة للواجهة

```text
Account { id, displayName, roles[], status, onboardingStatus, permissions[] }
ScholarProfile { id, accountId, name, bio, specialties[], credentials[], institution?, verificationStatus, updatedAt }
VerificationApplication { id, ownerId, status, steps, evidenceMetadata[], consentAt?, version, timeline[] }
Content { id, type(post|article), title, excerpt, body, author, topics[], sources[], reviewStatus, publishedAt, updatedAt }
Question { id, ownerRef, title, details, visibility, anonymity, specialty, topics[], assignees[], status, createdAt, version }
Answer { id, questionId, scholar, specialty, body, sources[1..n], reviewStatus, publishedAt, updatedAt }
OpinionGroup { id, questionId, recognizedStatus, label, neutralSummary, answerIds[], editorialOrder }
Source { id, type, title, authorOrOrg?, locator?, url?, publicationDate? }
ReportCase { id, targetRef, reporterRef, reason, note?, status, priority, assignee?, version, timeline[] }
Notification { id, recipientId, type, entityRef, readAt?, createdAt }
```

`ownerRef` يكون معرفًا مستعارًا في العقود العامة. لا يحتوي fixture أو response عام على
البريد أو الهاتف أو معرف وثيقة أو نص خاص.

## حالات وانتقالات

| الكيان | الحالات | الانتقالات المسموحة |
|---|---|---|
| Account | active, suspended, deleted | active↔suspended؛ active/suspended→deleted |
| Onboarding | not_started, in_progress, completed | تسلسلي مع حفظ المسودة؛ completed يعاد تحرير إعداداته لا الحالة |
| Verification | draft, pending, needs_info, approved, rejected, suspended, revoked | draft→pending؛ pending→needs_info/approved/rejected؛ needs_info→pending؛ approved→suspended/revoked؛ suspended→approved/revoked |
| Content review | draft, pending_review, published, hidden, removed | draft→pending_review/published حسب الصلاحية؛ published↔hidden؛ hidden→removed/published |
| Question | draft, pending_moderation, routed, answered, rejected, closed | draft→pending_moderation؛ pending→routed/rejected؛ routed→answered/closed؛ answered→closed |
| Answer | draft, submitted, published, hidden, withdrawn | draft→submitted؛ submitted→published؛ published↔hidden؛ published/hidden→withdrawn |
| Report | open, triaged, in_review, actioned, dismissed, appealed, closed | open→triaged→in_review→actioned/dismissed؛ actioned/dismissed→appealed/closed؛ appealed→closed |

## ثوابت المجال

1. لا Answer منشورة بلا `scholar.verificationStatus=approved` وقت النشر، specialty معتمد،
   ومصدر واحد على الأقل.
2. تعليق/سحب التوثيق يمنع النشر الجديد؛ لا يمحو التاريخ، بل يظهر حالة المؤلف الحالية
   وملاحظة تحريرية إن قررت الإدارة الإبقاء على محتوى سابق.
3. `private Question` لا يدخل أي collection عامة أو search index أو public cache.
4. الحالة المعروضة تأتي من الخادم مع `version`; العميل لا يستنتج اعتمادًا نهائيًا.
5. حذف Topic/Specialty مستخدم يكون soft-delete مع بديل أو منع للعملية.
6. AuditEvent لا يعدل أو يحذف من واجهة الـMVP.

## حالات العرض المشتركة

كل query لها `loading`, `success`, `empty`, `error`, `offline`. يضاف `forbidden` للموارد
المحمية و`stale/conflict` للقرارات الحساسة. Retry لا يكرر mutation غير idempotent؛ تعرض
الواجهة مرجع العملية عند حالة غير محسومة.

