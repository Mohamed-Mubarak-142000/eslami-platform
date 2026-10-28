import { NextResponse } from "next/server";

/** The riwayat besides Hafs that the mobile app reads (src/data/riwayat, scripts/build-riwayat.mjs). */
const KEYS = new Set(["shouba", "warsh", "qaloon", "bazzi", "qumbul", "doori", "soosi"]);

/**
 * GET /api/v1/riwayat/{key} — a riwaya's whole mushaf (src/data/riwayat/{key}.json, the King Fahd
 * Complex text), for the mobile app to download once and read offline. The files never change
 * between releases of the data, so they are cached for a month at the edge and on the device.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  if (!KEYS.has(key)) return NextResponse.json({ error: "رواية غير معروفة." }, { status: 404 });
  const file = (await import(`@/data/riwayat/${key}.json`)) as { default: unknown };
  return NextResponse.json(file.default, {
    headers: { "cache-control": "public, max-age=2592000, s-maxage=2592000, stale-while-revalidate=86400" },
  });
}
