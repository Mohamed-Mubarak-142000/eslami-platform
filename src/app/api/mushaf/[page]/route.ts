import { getMushafPage } from "@/features/quran/mushafPage";
import { findRiwaya } from "@/features/quran/riwayat";

/** One mushaf page as JSON, for the reader to turn pages without a full navigation. */
export async function GET(request: Request, { params }: RouteContext<"/api/mushaf/[page]">) {
  const page = Number((await params).page);
  const riwaya = findRiwaya(new URL(request.url).searchParams.get("riwaya"));
  const data = await getMushafPage(riwaya.key, page);
  if (!data) return Response.json({ error: "not found" }, { status: 404 });
  // The text never changes; let the CDN and the browser keep it.
  return Response.json(data, { headers: { "Cache-Control": "public, max-age=86400, s-maxage=2592000, stale-while-revalidate=86400" } });
}
