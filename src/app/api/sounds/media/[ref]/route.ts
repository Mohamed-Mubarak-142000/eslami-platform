import { NextResponse, type NextRequest } from "next/server";
import { getRadioMediaUrl } from "@/features/sounds/soundsApi";

/** Sends the player to a radio recording's HLS playlist; the lookup is cached for a week. */
export async function GET(_request: NextRequest, ctx: RouteContext<"/api/sounds/media/[ref]">) {
  const { ref } = await ctx.params;
  if (!/^\d{1,12}$/.test(ref)) return new NextResponse(null, { status: 404 });
  const url = await getRadioMediaUrl(ref);
  if (!url) return new NextResponse(null, { status: 502 });
  return NextResponse.redirect(url, { status: 302, headers: { "Cache-Control": "public, s-maxage=604800, max-age=86400" } });
}
