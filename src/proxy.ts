import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

const PROTECTED = ["/account", "/dashboard", "/exams", "/admin", "/certificates/mine"];
const AUTH_ONLY_FOR_GUESTS = ["/login", "/register"];

// Optimistic checks only — every protected page and action verifies the session again on the server.
export async function proxy(request: NextRequest) {
  const { response, userId } = await updateSession(request);
  const path = request.nextUrl.pathname;

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
  // Skip static assets and images; everything else gets a refreshed session.
  matcher: [
    "/((?!_next/static|_next/image|icon.svg|icons/|manifest.webmanifest|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|svg|webp|mp3)$).*)",
  ],
};
