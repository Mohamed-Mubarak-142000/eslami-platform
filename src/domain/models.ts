export type EntityId = string;
export type IsoDateTime = string;
export type AccountStatus = "active" | "suspended" | "closed";
export type Role = "guest" | "member" | "applicant" | "verified_scholar" | "moderator" | "admin";
export type VerificationStatus = "draft" | "pending" | "needs_info" | "approved" | "rejected" | "suspended" | "revoked";

export interface Account { id: EntityId; displayName: string; roles: readonly Role[]; status: AccountStatus }
export interface Specialty { id: EntityId; slug: string; name: string }
export interface Topic { id: EntityId; slug: string; name: string }
export interface ScholarProfile { id: EntityId; accountId: EntityId; slug: string; displayName: string; bio: string; specialtyIds: readonly EntityId[]; verificationStatus: VerificationStatus }
export type ContentKind = "post" | "article" | "answer";
export interface Source { id: EntityId; type: "book" | "paper" | "website" | "other"; title: string; authorOrOrganization?: string; locator?: string; url?: string }
export interface KnowledgeContent { id: EntityId; kind: ContentKind; title: string; summary: string; body: string; authorId: EntityId; topicIds: readonly EntityId[]; sources: readonly Source[]; publishedAt: IsoDateTime; reviewedAt?: IsoDateTime }
export type QuestionVisibility = "public" | "private";
export type QuestionStatus = "draft" | "pending" | "routed" | "answered" | "rejected";
export interface Question { id: EntityId; ownerId: EntityId; title: string; details: string; visibility: QuestionVisibility; status: QuestionStatus; specialtyId: EntityId; version: number; assignedScholarId?: EntityId }
export interface Session { account: Account | null; expiresAt: IsoDateTime | null }
