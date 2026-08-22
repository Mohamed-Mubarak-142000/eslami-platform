import type { KnowledgeContent, Question, ScholarProfile } from "@/domain";

export interface ContentDto { id: string; kind: KnowledgeContent["kind"]; title: string; summary: string; body: string; author_id: string; topic_ids: string[]; sources: Array<{ id: string; type: "book" | "paper" | "website" | "other"; title: string; author?: string; locator?: string; url?: string }>; published_at: string; reviewed_at?: string }
export interface ScholarDto { id: string; account_id: string; slug: string; display_name: string; bio: string; specialty_ids: string[]; verification_status: ScholarProfile["verificationStatus"] }
export interface QuestionDto { id: string; owner_id: string; title: string; details: string; visibility: Question["visibility"]; status: Question["status"]; specialty_id: string; version: number; assigned_scholar_id?: string }

export function toContent(dto: ContentDto): KnowledgeContent {
  return { id: dto.id, kind: dto.kind, title: dto.title, summary: dto.summary, body: dto.body, authorId: dto.author_id, topicIds: dto.topic_ids, sources: dto.sources.map(({ author, ...source }) => ({ ...source, ...(author ? { authorOrOrganization: author } : {}) })), publishedAt: dto.published_at, ...(dto.reviewed_at ? { reviewedAt: dto.reviewed_at } : {}) };
}
export function toScholar(dto: ScholarDto): ScholarProfile { return { id: dto.id, accountId: dto.account_id, slug: dto.slug, displayName: dto.display_name, bio: dto.bio, specialtyIds: dto.specialty_ids, verificationStatus: dto.verification_status }; }
export function toQuestion(dto: QuestionDto): Question { return { id: dto.id, ownerId: dto.owner_id, title: dto.title, details: dto.details, visibility: dto.visibility, status: dto.status, specialtyId: dto.specialty_id, version: dto.version, ...(dto.assigned_scholar_id ? { assignedScholarId: dto.assigned_scholar_id } : {}) }; }
