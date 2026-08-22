import type { Session } from "@/domain";

export function isAuthenticatedSession(session: Session, now = Date.now()): boolean {
  if (!session.account || session.account.status !== "active" || !session.expiresAt) return false;
  const expiresAt = Date.parse(session.expiresAt);
  return Number.isFinite(expiresAt) && expiresAt > now;
}
