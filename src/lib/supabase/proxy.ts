import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "./database.types";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL, isSupabaseConfigured } from "./env";

/**
 * Refreshes the auth cookies on every request and returns who (if anyone) is signed in.
 *
 * By default this trusts the JWT (`getClaims`, no network). With `verify`, it asks the auth server
 * (`getUser`) and, when the token no longer maps to a user (account deleted, session revoked),
 * clears the session cookies — otherwise a still-unexpired token for a deleted account bounces
 * between /login and /dashboard forever.
 */
export async function updateSession(
  request: NextRequest,
  { verify = false }: { verify?: boolean } = {},
): Promise<{ response: NextResponse; userId: string | null }> {
  let response = NextResponse.next({ request });
  if (!isSupabaseConfigured) return { response, userId: null };

  const supabase = createServerClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (toSet) => {
        toSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  if (verify) {
    const { data, error } = await supabase.auth.getUser();
    if (data.user) return { response, userId: data.user.id };
    // Only a definite "no such user/session" (4xx) clears cookies; a network blip must not sign people out.
    if (error?.status && error.status >= 400 && error.status < 500) await supabase.auth.signOut({ scope: "local" });
    return { response, userId: null };
  }
  const { data } = await supabase.auth.getClaims();
  return { response, userId: typeof data?.claims.sub === "string" ? data.claims.sub : null };
}
