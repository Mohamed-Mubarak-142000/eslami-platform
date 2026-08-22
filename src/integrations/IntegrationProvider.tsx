"use client";
import { createContext, useContext, type ReactNode } from "react";
import type { Session } from "@/domain";

const SessionContext = createContext<Session>({ account: null, expiresAt: null });
export function IntegrationProvider({ session, children }: { session: Session; children: ReactNode }) { return <SessionContext value={session}>{children}</SessionContext>; }
export function useSession(): Session { return useContext(SessionContext); }
