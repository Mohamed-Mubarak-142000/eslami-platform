"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { AppRole, LearnerRow } from "@/lib/supabase/database.types";

/** Must match ACTIVE_LEARNER_COOKIE in features/auth/session.ts (server reads the same cookie). */
const ACTIVE_LEARNER_COOKIE = "al-manara-learner";

export interface AccountSummary {
  id: string;
  name: string;
  email: string;
  role: AppRole;
}

export type AccountState =
  | { status: "disabled" }
  | { status: "loading" }
  | { status: "signed-out" }
  | { status: "signed-in"; account: AccountSummary; learners: LearnerRow[]; activeLearner: LearnerRow };

interface AccountContextValue {
  state: AccountState;
  setActiveLearner: (learnerId: string) => void;
  refresh: () => void;
  /** Ends the session in this browser right away (cookies, learner choice, in-memory account). */
  signOut: () => Promise<void>;
}

const AccountContext = createContext<AccountContextValue | null>(null);

function readLearnerCookie(): string | undefined {
  return document.cookie
    .split("; ")
    .find((part) => part.startsWith(`${ACTIVE_LEARNER_COOKIE}=`))
    ?.slice(ACTIVE_LEARNER_COOKIE.length + 1);
}

function writeLearnerCookie(learnerId: string) {
  const secure = window.location.protocol === "https:" ? "; secure" : "";
  document.cookie = `${ACTIVE_LEARNER_COOKIE}=${learnerId}; path=/; max-age=31536000; samesite=lax${secure}`;
}

function pickActive(learners: LearnerRow[], preferred: string | undefined): LearnerRow | undefined {
  return learners.find((learner) => learner.id === preferred) ?? learners.find((learner) => learner.kind === "self") ?? learners[0];
}

/**
 * Client-side view of the signed-in user and their learners (self + children), so public pages
 * stay statically rendered. Server pages re-verify with `getSession()`; RLS guards every row.
 */
export function AccountProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<AccountState>(isSupabaseConfigured ? { status: "loading" } : { status: "disabled" });
  const [version, setVersion] = useState(0);
  const pathname = usePathname();
  const userIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    let cancelled = false;

    async function load(user: { id: string; email?: string | undefined; user_metadata: Record<string, unknown> } | null) {
      if (!user) {
        if (!cancelled) setState({ status: "signed-out" });
        return;
      }
      const [{ data: profile }, { data: learners }] = await Promise.all([
        supabase!.from("profiles").select("full_name, role, disabled").eq("id", user.id).maybeSingle(),
        supabase!.from("learners").select("*").eq("owner_id", user.id).order("created_at"),
      ]);
      const activeLearner = pickActive(learners ?? [], readLearnerCookie());
      if (cancelled) return;
      if (!profile || profile.disabled || !activeLearner) {
        setState({ status: "signed-out" });
        return;
      }
      const email = user.email ?? "";
      setState({
        status: "signed-in",
        account: {
          id: user.id,
          email,
          name: profile.full_name || String(user.user_metadata.full_name ?? "") || email.split("@")[0] || "",
          role: profile.role,
        },
        learners: learners ?? [],
        activeLearner,
      });
    }

    supabase.auth.getUser().then(({ data }) => load(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      // Token refreshes keep the same user; only reload on real identity changes.
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") void load(session?.user ?? null);
    });
    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, [version]);

  useEffect(() => {
    userIdRef.current = state.status === "signed-in" ? state.account.id : state.status === "signed-out" ? null : undefined;
  }, [state]);

  useEffect(() => {
    // Sign-in/out done by a server action sets cookies on the server and navigates without a reload,
    // so this browser client never gets an auth event. Re-read the (cookie) session on every
    // navigation — local, no network — and reload the account when the user changed.
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    void supabase.auth.getSession().then(({ data }) => {
      const known = userIdRef.current;
      if (known !== undefined && known !== (data.session?.user.id ?? null)) setVersion((value) => value + 1);
    });
  }, [pathname]);

  function setActiveLearner(learnerId: string) {
    if (state.status !== "signed-in") return;
    const next = state.learners.find((learner) => learner.id === learnerId);
    if (!next || next.id === state.activeLearner.id) return;
    writeLearnerCookie(next.id);
    setState({ ...state, activeLearner: next });
    router.refresh();
  }

  async function signOut() {
    // "local": this device only — the user's other devices stay signed in.
    await getSupabaseBrowserClient()?.auth.signOut({ scope: "local" });
    document.cookie = `${ACTIVE_LEARNER_COOKIE}=; path=/; max-age=0; samesite=lax`;
    setState({ status: "signed-out" });
  }

  return (
    <AccountContext.Provider value={{ state, setActiveLearner, refresh: () => setVersion((value) => value + 1), signOut }}>
      {children}
    </AccountContext.Provider>
  );
}

export function useAccountContext(): AccountContextValue {
  const context = useContext(AccountContext);
  if (!context) throw new Error("useAccountContext must be used within an AccountProvider");
  return context;
}

export function useAccount(): AccountState {
  return useAccountContext().state;
}

/** The learner whose progress is being read and written, or null for on-device guest mode. */
export function useActiveLearner(): LearnerRow | null {
  const { state } = useAccountContext();
  return state.status === "signed-in" ? state.activeLearner : null;
}
