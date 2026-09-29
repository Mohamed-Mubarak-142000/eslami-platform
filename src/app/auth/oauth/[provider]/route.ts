import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { isOAuthProvider, loginNoticeUrl, requestOrigin, safeNextPath } from "@/features/auth/oauth";

/**
 * Starts Google/Facebook sign-in. A plain link rather than a server action, so an in-app webview can
 * hand this exact URL to the phone's real browser and the PKCE cookie is set in the browser that finishes.
 */
export async function GET(request: NextRequest, ctx: RouteContext<"/auth/oauth/[provider]">) {
  const { provider } = await ctx.params;
  const origin = requestOrigin(request);
  const next = safeNextPath(request.nextUrl.searchParams.get("next"));
  if (!isOAuthProvider(provider)) return NextResponse.redirect(`${origin}/login`);
  if (!isSupabaseConfigured) return NextResponse.redirect(loginNoticeUrl(origin, "not-configured", next));

  const callback = new URL("/auth/callback", origin);
  callback.searchParams.set("next", next);
  callback.searchParams.set("provider", provider);
  if (request.nextUrl.searchParams.get("retry") === "1") callback.searchParams.set("retry", "1");

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    // Facebook only shares the email when asked; the account is keyed on it.
    options: { redirectTo: callback.toString(), ...(provider === "facebook" && { scopes: "email" }) },
  });
  if (error || !data.url) {
    console.error(`[auth/oauth] could not start ${provider} sign-in:`, error?.message);
    return NextResponse.redirect(loginNoticeUrl(origin, provider, next));
  }
  return NextResponse.redirect(data.url);
}
