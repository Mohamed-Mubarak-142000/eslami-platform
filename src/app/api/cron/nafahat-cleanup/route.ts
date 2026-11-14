import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { cleanupNafahat, startOfMonth } from "@/features/nafahat/cleanup";
import { NAFAHAT_TAG } from "@/features/nafahat/shared";
import { isCronAuthorized } from "@/lib/api/cron";

export const maxDuration = 60;

/**
 * Monthly (vercel.json, the 1st at 01:00 UTC): clears "نفحات المنارة" of everything published before this
 * month, with the media files, to keep storage small. "Authorization: Bearer CRON_SECRET" required.
 * /api/cron/nafahat-cleanup[?dryRun=1]
 */
export const GET = run;
export const POST = run;

async function run(request: NextRequest) {
  if (!isCronAuthorized(request)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const dryRun = request.nextUrl.searchParams.get("dryRun") === "1";
  try {
    const cutoff = startOfMonth();
    const result = await cleanupNafahat(cutoff, dryRun);
    if (!dryRun && (result.deleted || result.filesRemoved)) {
      revalidateTag(NAFAHAT_TAG, { expire: 0 });
      revalidatePath("/nafahat");
      revalidatePath("/admin/nafahat");
    }
    return NextResponse.json({ cutoff: cutoff.toISOString(), dryRun, ...result });
  } catch (error) {
    console.error("Nafahat cleanup failed", error);
    return NextResponse.json({ error: "cleanup failed" }, { status: 500 });
  }
}
