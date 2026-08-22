import type { Account, KnowledgeContent, Question, ScholarProfile, Session, Specialty, Topic } from "@/domain";

export const specialties: readonly Specialty[] = [{ id: "sp-fiqh", slug: "fiqh", name: "الفقه وأصوله" }, { id: "sp-hadith", slug: "hadith", name: "الحديث وعلومه" }];
export const topics: readonly Topic[] = [{ id: "tp-worship", slug: "worship", name: "العبادات" }];
export const member: Account = { id: "acct-member-1", displayName: "مستخدم تجريبي", roles: ["member"], status: "active" };
export const scholar: Account = { id: "acct-scholar-1", displayName: "باحث تجريبي", roles: ["member", "verified_scholar"], status: "active" };
export const scholarProfile: ScholarProfile = { id: "scholar-1", accountId: scholar.id, slug: "sample-researcher", displayName: scholar.displayName, bio: "ملف تجريبي غير منسوب إلى شخص حقيقي.", specialtyIds: ["sp-fiqh"], verificationStatus: "approved" };
export const publicContent: KnowledgeContent = { id: "content-1", kind: "article", title: "مدخل تجريبي إلى فقه العبادات", summary: "محتوى مصطنع لا يمثل فتوى أو شخصًا حقيقيًا.", body: "نص تجريبي للاختبار فقط.", authorId: scholarProfile.id, topicIds: ["tp-worship"], sources: [{ id: "source-1", type: "book", title: "مرجع تجريبي", locator: "ص ١" }], publishedAt: "2026-08-22T10:00:00.000Z" };
export const privateQuestion: Question = { id: "question-private-1", ownerId: member.id, title: "سؤال خاص تجريبي", details: "تفاصيل لا تدخل القياس أو البحث.", visibility: "private", status: "routed", specialtyId: "sp-fiqh", version: 1, assignedScholarId: scholar.id };
export const guestSession: Session = { account: null, expiresAt: null };
export const memberSession: Session = { account: member, expiresAt: "2099-01-01T00:00:00.000Z" };
