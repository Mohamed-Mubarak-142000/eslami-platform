// The AdMob app listing points at this domain, so the mobile app is verified with the same line.
import { adsTxtResponse } from "@/components/ads/adsTxt";

// Fixed for a deployment (the publisher ID is a build-time variable).
export const dynamic = "force-static";

export function GET() {
  return adsTxtResponse();
}
