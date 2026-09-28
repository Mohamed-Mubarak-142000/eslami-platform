import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "./database.types";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL, isSupabaseConfigured } from "./env";

/** Refreshes the auth cookies on every request and returns who (if anyone) is signed in. */
export async function updateSession(request: NextRequest): Promise<{ response: NextResponse; userId: string | null }> {
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

  const { data } = await supabase.auth.getClaims();
  return { response, userId: typeof data?.claims.sub === "string" ? data.claims.sub : null };
}
