import type { Account, EntityId, Question, Role, Session } from "./models";

export type Action = "read_public" | "interact" | "ask" | "publish_knowledge" | "answer" | "moderate" | "manage_verification" | "manage_taxonomy";
export interface PermissionContext { ownerId?: EntityId; assignedToId?: EntityId; specialtyMatches?: boolean }

const grants: Readonly<Record<Role, readonly Action[]>> = {
  guest: ["read_public"], member: ["read_public", "interact", "ask"], applicant: ["read_public", "interact", "ask"],
  verified_scholar: ["read_public", "interact", "ask", "publish_knowledge", "answer"],
  moderator: ["read_public", "interact", "ask", "moderate"], admin: ["read_public", "interact", "ask", "moderate", "manage_verification", "manage_taxonomy"],
};

export function can(account: Account | null, action: Action, context: PermissionContext = {}): boolean {
  if (action === "read_public") return true;
  if (!account || account.status !== "active") return false;
  if (!account.roles.some((role) => grants[role].includes(action))) return false;
  if (action === "answer") return context.specialtyMatches === true;
  return true;
}

export function canReadQuestion(session: Session, question: Question): boolean {
  if (question.visibility === "public") return true;
  const id = session.account?.id;
  if (!id) return false;
  return id === question.ownerId || id === question.assignedScholarId || session.account?.roles.some((role) => role === "moderator" || role === "admin") === true;
}
