import { getMushafPage } from "@/features/quran/mushafPage";

/** One mushaf page as JSON, for the reader to turn pages without a full navigation. */
export async function GET(_request: Request, { params }: RouteContext<"/api/mushaf/[page]">) {
  const page = Number((await params).page);
  const data = await getMushafPage(page);
  if (!data) return Response.json({ error: "not found" }, { status: 404 });
  // The text never changes; let the CDN and the browser keep it.
  return Response.json(data, { headers: { "Cache-Control": "public, max-age=86400, s-maxage=2592000, stale-while-revalidate=86400" } });
}
