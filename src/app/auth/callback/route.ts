import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { isOAuthProvider, loginNoticeUrl, requestOrigin, safeNextPath } from "@/features/auth/oauth";

// Google/Facebook OAuth lands here with a one-time code to exchange for a session.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const origin = requestOrigin(request);
  const next = safeNextPath(searchParams.get("next"));
  if (!isSupabaseConfigured) return NextResponse.redirect(loginNoticeUrl(origin, "not-configured", next));

  const code = searchParams.get("code");
  const providerError = searchParams.get("error");
  const errorDescription = searchParams.get("error_description") ?? "";
  const provider = searchParams.get("provider");
  const supabase = await createSupabaseServerClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
    console.warn("[auth/callback] code exchange failed:", error.code, error.message);
  } else if (providerError) {
    console.warn("[auth/callback] provider returned:", providerError, errorDescription);
  }

  // The code was already used by an earlier request (refresh, back button, link opened twice).
  const { data } = await supabase.auth.getUser();
  if (data.user) return NextResponse.redirect(`${origin}${next}`);

  if (providerError === "access_denied") return NextResponse.redirect(loginNoticeUrl(origin, "oauth-cancelled", next));
  // Facebook accounts made with a phone number, or where the visitor unticked email sharing.
  if (/email/i.test(errorDescription)) return NextResponse.redirect(loginNoticeUrl(origin, "oauth-no-email", next));

  // Usually the sign-in began in another browser or host (in-app webview, installed app, www vs bare
  // domain), so this one lacks the PKCE cookie. Start over here once; the provider remembers the account.
  if (code && isOAuthProvider(provider) && searchParams.get("retry") !== "1") {
    const restart = new URL(`/auth/oauth/${provider}`, origin);
    restart.searchParams.set("next", next);
    restart.searchParams.set("retry", "1");
    return NextResponse.redirect(restart);
  }
  return NextResponse.redirect(loginNoticeUrl(origin, "callback", next));
}
