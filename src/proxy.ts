import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

const PROTECTED = ["/account", "/dashboard", "/exams", "/admin", "/certificates/mine", "/kids", "/stories"];
const AUTH_ONLY_FOR_GUESTS = ["/login", "/register"];

// Optimistic checks only — every protected page and action verifies the session again on the server.
export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  // Supabase sends the OAuth code to the bare Site URL when our redirect isn't in its allow-list.
  if (path === "/" && request.nextUrl.searchParams.has("code")) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/callback";
    return NextResponse.redirect(url);
  }
  // Sending a "signed-in" visitor away from /login must rest on a real user, not just a token.
  const { response, userId } = await updateSession(request, { verify: AUTH_ONLY_FOR_GUESTS.includes(path) });

  if (!userId && PROTECTED.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(path + request.nextUrl.search)}`;
    return NextResponse.redirect(url);
  }
  if (userId && AUTH_ONLY_FOR_GUESTS.includes(path)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  return response;
}

export const config = {
  // Only the pages that read the session on the server (the ones `next build` lists as dynamic), and the
  // OAuth fallback above. The proxy runs before the cache, so on every other page it would spend a
  // function call per visit for a session nothing there reads: the browser client and Server Actions
  // refresh the session themselves, and the app's API uses bearer tokens.
  matcher: [
    { source: "/", has: [{ type: "query", key: "code" }] },
    "/login",
    "/register",
    "/verify",
    "/reset-password",
    "/auth/:path*",
    "/account/:path*",
    "/dashboard/:path*",
    "/admin/:path*",
    "/exams/:path*",
    "/certificates/:path*",
    "/khatma/:path*",
    "/plan/:path*",
    "/nawawi/:path*",
    "/tasmee/:path*",
    "/kids/:path*",
    "/stories/:path*",
    "/unsubscribe/:path*",
  ],
};
